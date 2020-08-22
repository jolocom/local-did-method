import { Identity } from "jolocom-lib/js/identity/identity";
import { getRegistrar } from 'local-did-resolver'
import { DidDocument } from "jolocom-lib/js/identity/didDocument/didDocument";
import { SignedCredential } from 'jolocom-lib/js/credentials/signedCredential/signedCredential'
import { IRegistrar } from "jolocom-lib/js/didMethods/types";
import { createDb } from 'local-did-resolver/js/db'
import {
  getIdFromEvent,
  validateEvents,
  getIcp,
} from '@jolocom/native-core-node-linux-x64'
import { SoftwareKeyProvider } from '@jolocom/vaulted-key-provider'

interface CreationReturn {
  id: string
  encryptedWallet: string
  inceptionEvent: string
}

interface CreationParams {
  id: string
  encryptedWallet: string
  pass: string
}

const createFromIcp = async (p: CreationParams): Promise<CreationReturn> =>
    getIcp({
      encryptedWallet: p.encryptedWallet,
      id: p.id,
      pass: p.pass
    })

export class LocalRegistrar implements IRegistrar {
  public prefix = 'un'
  private registrar: ReturnType<typeof getRegistrar>

  public constructor(db = createDb()) {
    this.registrar = getRegistrar({
      dbInstance: db,
      create: createFromIcp,
      getIdFromEvent: getIdFromEvent,
      validateEvents: validateEvents,
    })
  }

  public async create(keyProvider: SoftwareKeyProvider, password: string) {
    const ret = (await this.registrar.create({
      encryptedWallet: keyProvider.encryptedWallet,
      id: keyProvider.id,
      pass: password,
    })) as CreationReturn

    // @ts-ignore Assigning directly to a private property
    keyProvider._encryptedWallet = Buffer.from(ret.encryptedWallet, 'base64')
    // @ts-ignore Assigning directly to a private property
    keyProvider._id = ret.id

    const didDoc = JSON.parse(
      await validateEvents(JSON.stringify([ret.inceptionEvent])),
    )

    const identity = Identity.fromDidDocument({
      didDocument: DidDocument.fromJSON(didDoc),
    })

    this.encounter([ret.inceptionEvent])
    return identity
  }

  // TODO Verify signature on the public profile? Or just assume it's correct
  // TODO Public profile should perhaps be JSON / any, so that the registrars can be used without having to typecheck / guard / use generics
  public async updatePublicProfile(
    keyProvider: SoftwareKeyProvider,
    password: string,
    identity: Identity,
    publicProfile: SignedCredential,
  ) {
    console.error(`"updatePublicProfile not implemented for did:${this.prefix}`) // TODO Better error
    return false
  }

  public async encounter(deltas: string[]) {
    return Identity.fromDidDocument({
      didDocument: DidDocument.fromJSON(await this.registrar.update(deltas)),
    })
  }
}
