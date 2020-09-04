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
      const keyEventId = await cfg.getIdFromEvent(events[0])
      const previousEvents = await cfg.dbInstance.read(keyEventId) || []

      const uncommon = events.filter(event => previousEvents.indexOf(event) == -1)

      const document = await cfg.validateEvents(
        JSON.stringify(previousEvents.concat(uncommon))
      )
      await cfg.dbInstance.append(keyEventId, uncommon)
      return document
    },
    delete: (id: string) => cfg.dbInstance.delete(id),
    create: cfg.create
  })
