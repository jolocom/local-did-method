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

      const resolver = new Resolver(getResolver('jun')({
        dbInstance: db,
        validateEvents
      }))

      let idNone = "none"
      let pass = "pass"
      let encryptedWallet = await walletUtils.newWallet(idNone, pass)
      const icp_data = await registrar.create({encryptedWallet, id: idNone, pass})
      const { inceptionEvent, id } = icp_data

      // save the event to the DB, and resolve the DID
      await registrar.update(inceptionEvent)
      const ddo = await resolver.resolve(id)

      // now do it again, resolved DID doc should be unchanged
      await registrar.update(inceptionEvent)
      const ddoUpdated = await resolver.resolve(id)

      return expect(ddoUpdated).toEqual(ddo)
    });
  });
});
