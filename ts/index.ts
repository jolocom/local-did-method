import { DIDDocument, ParsedDID, Resolver } from "did-resolver";
import { InternalDb } from "./db";
export { InternalDb } from './db'
import { JolocomLib } from 'jolocom-lib'

// TODO Current types, will be replaced
type EventValidationFunction = (events: string) => Promise<string>
type IdExtractionFunction = (event: string) => Promise<string>
type IdCreationFunction<T, C> = (config: C) => Promise<T>

// TODO Functions which should be exposed from the native modules and used by the local registrar in jolo-did-methods
type ExtractIdFromEvent = (event: string) => Promise<string>
type ConvertEventsToDidDoc = (events: string) => Promise<string>
type CreateInceptionEvent = (options?: {}) => Promise<string>

export const getResolver = (cfg: {
  dbInstance: InternalDb,
  validateEvents: EventValidationFunction,
}) => ({ 
    un: async (did: string, parsed: ParsedDID, didResolver: Resolver): Promise<DIDDocument | null> => {
      const events = await cfg.dbInstance.read(parsed.id)

      if (events && events.length) {
        return JSON.parse(await cfg.validateEvents(JSON.stringify(events)))
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
    update: async (events: string[]) => {
      try {
        const keyEventId = await cfg.getIdFromEvent(events[0])
        const previousEvents = await cfg.dbInstance.read(keyEventId) || []

        const document = await cfg.validateEvents(
          JSON.stringify(previousEvents.concat(events))
        )
        await cfg.dbInstance.append(keyEventId, events)
        return document
      } catch (err) {
        return err
      }
    },
    delete: (id: string) => cfg.dbInstance.delete(id),
    create: cfg.create
  })


export { LocalDidMethod } from './jolocomLibIntegration'
