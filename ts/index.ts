import { DIDDocument, ParsedDID, Resolver } from "did-resolver";

type EventProcessingFunction = (events: string, dbPath: string) => Promise<void>
type DBResolutionFunction = (id: string, dbPath: string, methodPrefix: string) => Promise<string>
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
  dbInstance: string,
  resolve: DBResolutionFunction,
}) => ({
  /**
   * Given a [prefix] DID, will attempt to find all associated events in the local database,
   * validate them, and return the corresponding DID Document
   * @param did - the did to resolve
   * @param parsed - a object containing the parsed DID, as provided by the "did-resolver" module
   * @param didResolver - instance of {@link Resolver}, populated by the "did-resolver" module
   * @returns DID Document - Did Document for the corresponding DID in JSON form
   */

    [prefix]: async (did: string, parsed: ParsedDID, _: Resolver): Promise<DIDDocument | null> =>
      cfg.resolve(parsed.id, cfg.dbInstance, prefix).then(JSON.parse).catch(e => null)
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
  dbInstance: string,
  processEvents: EventProcessingFunction,
  create: IdCreationFunction<T, C>
}) => ({
    update: async (events: string) => {
      await cfg.processEvents(events, cfg.dbInstance)
    },

    /**
     * Deletes all Events from the DB associated with the given id.
     * TODO
     *
     * @param id - the ID of the Event list to be deleted
     */
    delete: async (id: string) => {},

    /**
     * Helper function to create a new genesis / inception event. The returned event format must be supported by the `validateEvents` and `getIdFromEvent` helpers.
     * @todo rethink slightly, perhaps this belongs elsewhere.
     * @returns didDocument - the document resulting from applying all events.
     */
    create: cfg.create
  })
