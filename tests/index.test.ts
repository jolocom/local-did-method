import { getResolver, getRegistrar } from "../ts";
import { Resolver } from "did-resolver";

// Testing against a specific implementation (KERI) of a validation function.
import { walletUtils, processEvents, resolveId, getIcp } from '@jolocom/native-core'

const testDb = "./test_db"

describe("Local DID Resolver", () => {
  describe("getResolver", () => {
    it("It should fail to resolve an unknown local DID", async () => {
      const testDid = 'did:keri:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
      const resolver = new Resolver(getResolver('keri')({
        dbInstance: testDb,
        resolve: resolveId
      }));

      return expect(resolver.resolve(testDid)).rejects.toEqual(
        new Error(`resolver returned null for ${testDid}`)
      )
    });

    it('It should correctly register a known local DID', async () => {
      const registrar = getRegistrar({
        dbInstance: testDb,
        processEvents,
        create: getIcp,
      })

      const resolver = new Resolver(getResolver('keri')({
        dbInstance: testDb,
        resolve: resolveId
      }))

      let idNone = "none"
      let pass = "pass"
      let encryptedWallet = await walletUtils.newWallet(idNone, pass)
      const icpData = await registrar.create({encryptedWallet, id: idNone, pass})
      const { inceptionEvent, id } = icpData

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
