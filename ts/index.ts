import { DIDDocument, ParsedDID, Resolver } from "did-resolver";
import { InternalDb } from "./db";

// TODO Current types, will be replaced
type EventValidationFunction = (events: string) => Promise<string>
type IdExtractionFunction = (event: string) => Promise<string>
type IdCreationFunction<T, C> = (config: C) => Promise<T>

/**
 * Returns a configured resolver for a local, event based, DID method
 * @param prefix - the DID Method prefix to use. Given that this code is fairly generic / agnostic to the structure
 * of the underlying events, it's not bound to one did method.
 * @param cfg.dbInstance - Storage / DB interface used to delete, store, and read Event logs. The resolver only
 * reads events from the DB, with the registrar being the one appending new events.
 * @param cfg.validateEvents - A function which takes a list of events, performs all necessary validation, and
 * return a Did Document in case of success, or throws
 */

export const getResolver = (prefix: string) => (cfg: {
  dbInstance: InternalDb,
  validateEvents: EventValidationFunction,
}) => ({
    [prefix]: async (did: string, parsed: ParsedDID, _: Resolver): Promise<DIDDocument | null> => {
      const events = await cfg.dbInstance.read(parsed.id)

      if (events && events.length) {
        return JSON.parse(await cfg.validateEvents(JSON.stringify(events)))
      }

      return null
    }
 })

/**
 * Returns a configured registrar for a local, event based, DID method
 * @param dbInstance - Storage / DB interface used to delete, store, and read Event logs. The registrar reads and appends
 * to this DB.
 * @param validateEvents - A function which takes a list of events, performs all necessary validation, and return a Did Document in case of success, or throws
 * @param getIdFromEvent - Helper function to extract ID from a event. Given that this code is agnostic to the underlying event structure, the functionality
 * for finding the ID for an event (or sequence of events) needs to be encapsulated this way.
 * @param create - Helper function to create a new genesis / inception event. The returned event format must be supported by the
 * `validateEvents` and `getIdFromEvent` helpers.
 */

export const getRegistrar = <T, C>(cfg: {
  dbInstance: InternalDb,
  validateEvents: EventValidationFunction,
  getIdFromEvent: IdExtractionFunction,
  create: IdCreationFunction<T, C>
}) => ({
    /**
     * Updates the local DB / event list with new events, given the new events are valid / can be applied.
     * Before being applied / validated, the new events are concatenated with existing events (queried from the DB using the event ID),
     * with duplicate events filtered out, and the resulting list passed to the aforementioned `validateEvents` function.
     * If validation succeeds, the new unique events are appended to the Event DB and the resulting DID Document is returned.
     *
     * @param events - list of events, e.g. shared as part of a resolution protocol
     * @returns didDocument - the document resulting from applying all events.
     */
    update: async (events: string[]) => {
      const keyEventId = await cfg.getIdFromEvent(events[0])
      const previousEvents = await cfg.dbInstance.read(keyEventId) || []

      const uncommon = events.filter(event => previousEvents.indexOf(event) == -1)

      const document = await cfg.validateEvents(
        JSON.stringify(previousEvents.concat(uncommon))
      )
      await cfg.dbInstance.append(keyEventId, uncommon)
      return document
    },

    /**
     * Deletes all Events from the DB associated with the given id.
     *
     * @param id - the ID of the Event list to be deleted
     * @returns didDocument - the document resulting from applying all events.
     */
    delete: (id: string) => cfg.dbInstance.delete(id),

    /**
     * Helper function to create a new genesis / inception event. The returned event format must be supported by the `validateEvents` and `getIdFromEvent` helpers.
     * @todo rethink slightly, perhaps this belongs elsewhere.
     * @returns didDocument - the document resulting from applying all events.
     */
    create: cfg.create
  })
