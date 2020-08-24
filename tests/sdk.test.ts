import { getResolver, getRegistrar } from "../ts";
import { Resolver } from "did-resolver";
import {
  createConnection,
  getConnection,
  Connection,
  ConnectionOptions,
} from 'typeorm'
import {
  JolocomTypeormStorage,
  EventLogEntity,
} from '@jolocom/sdk-storage-typeorm'

const testConnection: ConnectionOptions = {
  type: 'sqlite',
  database: ':memory:',
  dropSchema: true,
  entities: ['node_modules/@jolocom/sdk-storage-typeorm/js/src/entities/*.js'],
  synchronize: true,
  logging: false,
}

beforeEach(async () => {
  return await createConnection(testConnection)
})

afterEach(async () => {
  let conn = await getConnection()
  return conn.close()
})

// Testing against a specific implementation (KERI) of a validation function.
import { walletUtils, validateEvents, getIdFromEvent, getIcp } from '@jolocom/native-utils-node'

describe("Local DID Resolver", () => {
  describe("getResolver", () => {
    it("It should fail to resolve an unknown local DID", async () => {
      const con = await getConnection()
      const store = new JolocomTypeormStorage(con)
      const testId = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
      const testDid = `did:jun:${testId}`
      const resolver = new Resolver(getResolver('jun')({
        dbInstance: store.eventDB,
        validateEvents
      }));

      return expect(resolver.resolve(testDid)).rejects.toEqual(
        new Error(`resolver returned null for ${testDid}`)
      )
    });

    it('It should correctly register a known local DID', async () => {
      const con = await getConnection()
      const store = new JolocomTypeormStorage(con)
      const db = store.eventDB


      const registrar = getRegistrar({
        dbInstance: db,
        validateEvents,
        getIdFromEvent,
        create: getIcp,
      })

      const resolver = getResolver('jun')({
        dbInstance: db,
        validateEvents
      })

      let id = "none"
      let pass = "pass"
      let encryptedWallet = await walletUtils.newWallet(id, pass)
      const icp_data = await registrar.create({encryptedWallet, id, pass})
      
      const { inceptionEvent } = icp_data

      const res = await registrar.update([inceptionEvent])

      const testDDO = await validateEvents(JSON.stringify([inceptionEvent]))

      const ddo = await new Resolver(resolver)
        .resolve(`did:jun:${await getIdFromEvent(inceptionEvent)}`)
      
      return expect(ddo).toEqual(JSON.parse(testDDO))
    });
  });
});
