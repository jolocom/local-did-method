import { IdentityWallet } from 'jolocom-lib/js/identityWallet/identityWallet'
import { LocalRegistrar } from './registrar'
import { LocalResolver } from './resolver'
import { InternalDb, createDb } from 'local-did-resolver/js/db'
import { validateEvents } from '@jolocom/native-core-node-linux-x64'
import { SoftwareKeyProvider } from '@jolocom/vaulted-key-provider'
import {
  createIdentityFromKeyProvider,
  authAsIdentityFromKeyProvider,
} from 'jolocom-lib/js/didMethods/utils'
import { IDidMethod, IResolver, IRegistrar } from 'jolocom-lib/js/didMethods/types'

export class LocalDidMethod implements IDidMethod {
  public prefix = 'un'
  public resolver: IResolver
  public registrar: IRegistrar
  private db: InternalDb // TODO Better type, InternalDb doesn't make a lot of sense

  constructor(
    db = createDb(), // TODO Don't rely on the test db
  ) {
    this.db = db
    this.resolver = new LocalResolver(this.db, validateEvents)
    this.registrar = new LocalRegistrar(this.db)
  }

  /**
   * Registers a  new Jolocom identity on Ethereum and IPFS and returns an instance of the Identity Wallet class
   * @param vaultedKeyProvider - Instance of Vaulted Provider class storing password encrypted seed.
   * @param decryptionPassword - password used to decrypt seed in vault for key generation
   * @example `const identityWallet = await registry.create(vaultedProvider, 'password')`
   */

  public async create(
    vaultedKeyProvider: SoftwareKeyProvider,
    decryptionPassword: string,
  ): Promise<IdentityWallet> {
    return createIdentityFromKeyProvider(
      vaultedKeyProvider,
      decryptionPassword,
      this.registrar,
    )
  }

  /**
   * Resolves a jolocom did and returns an {@link Identity} class instance
   * @param did - The jolocom did to resolve
   * @example `const serviceIdentity = await registry.resolve('did:jolo:...')`
   */

  /**
   * Derives the identity public key, fetches the public
   *   profile and did document, and instantiates an identity wallet
   *   with the vault, decryption pass, and and key metadata
   * @param vaultedKeyProvider - Vaulted key store
   * @param derivationArgs - password for the vault and derivation path
   * @example `const wallet = registry.authenticate(vault, { derivationPath: '...', encryptionPass: '...'})`
   */

  public async authenticate(
    vaultedKeyProvider: SoftwareKeyProvider,
    decryptionPassword: string,
  ): Promise<IdentityWallet> {
    return authAsIdentityFromKeyProvider(
      vaultedKeyProvider,
      decryptionPassword,
      this.resolver,
    )
  }
}
