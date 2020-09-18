import { DIDDocument, ParsedDID, Resolver } from "did-resolver";
import { InternalDb } from "./db";

// TODO Current types, will be replaced
type EventValidationFunction = (events: string) => Promise<string>
type IdExtractionFunction = (event: string) => Promise<string>
type IdCreationFunction<T, C> = (config: C) => Promise<T>

export const getResolver = (prefix: string) => (cfg: {
  dbInstance: InternalDb,
  validateEvents: EventValidationFunction,
}) => ({
    [prefix]: async (did: string, parsed: ParsedDID, _: Resolver): Promise<DIDDocument | null> => {
      const events = await cfg.dbInstance.read(parsed.id)

      if (events && events.length) {
        return JSON.parse(await cfg.validateEvents(events))
      }

      return null
    }
 })

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
    delete: (id: string) => cfg.dbInstance.delete(id),
    create: cfg.create
  })
