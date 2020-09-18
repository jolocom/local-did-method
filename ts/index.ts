import { DIDDocument, ParsedDID, Resolver } from "did-resolver";
import { InternalDb } from "./db";

// TODO Provisional types, will be replaced
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
  /**
   * Given a [prefix] DID, will attempt to find all associated events in the local database,
   * validate them, and return the corresponding DID Document
   * @param did - the did to resolve
   * @param parsed - a object containing the parsed DID, as provided by the "did-resolver" module
   * @param didResolver - instance of {@link Resolver}, populated by the "did-resolver" module
   * @returns DID Document - Did Document for the corresponding DID in JSON form
   */

    [prefix]: async (did: string, parsed: ParsedDID, _: Resolver): Promise<DIDDocument | null> => {
      const events = await cfg.dbInstance.read(parsed.id)

      if (events && events.length) {
        return JSON.parse(await cfg.validateEvents(events))
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
    update: async (events: string) => {
      try {
        const keyEventId = await cfg.getIdFromEvent(events)
        const previousEvents = await cfg.dbInstance.read(keyEventId) || ""

        // TODO
        // ideally there should be a function to perform deduplication here and handle correct append logic
        // should handle combining event streams securely
        // (oldEvents: string, newEvents: string) => Promise<string>
        
        // HACK this will always assume that 'events' is a FULL KEL, starting FROM INCEPTION
        if (events.length > previousEvents.length) {
          await cfg.dbInstance.delete(keyEventId)
          await cfg.dbInstance.append(keyEventId, events)
          return await cfg.validateEvents(events)
        } else {
          return await cfg.validateEvents(previousEvents)
        }
      } catch (err) {
        return err
      }
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

/**
 * A DB interface compatible with the interface required by the local registrar / resolver.
 * The simpleEventDb offers the interface by wrapping a JS object.
 * More roboust / persistent alternatives are strongly recommended for deployed versions.
 */

export { createDb as createSimpleEventDb }  from './db'
