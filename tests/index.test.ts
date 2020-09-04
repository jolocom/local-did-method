import { getResolver, getRegistrar } from "../ts";
import { Resolver } from "did-resolver";
import { createDb } from "../ts/db";

// Testing against a specific implementation (KERI) of a validation function.
import { walletUtils, validateEvents, getIdFromEvent, getIcp } from '@jolocom/native-core'

describe("Local DID Resolver", () => {
  describe("getResolver", () => {
    it("It should fail to resolve an unknown local DID", async () => {
      const testDb = createDb()
      const testDid = 'did:jun:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
      const resolver = new Resolver(getResolver('jun')({
        dbInstance: testDb,
        validateEvents
      }));

      return expect(resolver.resolve(testDid)).rejects.toEqual(
        new Error(`resolver returned null for ${testDid}`)
      )
    });

    it('It should correctly register a known local DID', async () => {
      const db = createDb()

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

      await registrar.update([inceptionEvent])

      const updatedEvents = await db.read(id)

      const testDDO = await validateEvents(JSON.stringify(updatedEvents))

      const ddo = await new Resolver(resolver)
        .resolve(`did:jun:${await getIdFromEvent(inceptionEvent)}`)
      
      return expect(ddo).toEqual(JSON.parse(testDDO))
    });
  });
});
