# @jolocom/local-resolver-registrar
This repository includes an implementation for a local, event based resolver / registrar modules.

The exported functions are agnostic to the structure of the underlying events, but rely on a number of functions being injected upon construction. These functions provide an implementation for operations which need to be aware of the Event structure, allowing for registrars / resolvers relying on different event structures (e.g. [KERI](https://github.com/SmithSamuelM/Papers/blob/2a39bd7b99f39556bd9e204142a1f36c49372bd7/whitepapers/KERI_WP_2.x.web.pdf), [Peer DID](https://identity.foundation/peer-did-method-spec/index.html)) to be built by supplying different implementations of `validateEvents`, `getIdFromEvent`, and `create`.

*This module is also [integrated with the Jolocom Library](https://github.com/jolocom/jolocom-lib/blob/next/ts/didMethods/local/registrar.ts#L2) for our KERI based `did:jun` method.*

## Usage examples
In combination with the [DIF DID-Resolver](https://github.com/decentralized-identity/did-resolver):

```typescript
import { getResolver, createSimpleEventDb } from "@jolocom/local-resolver-registrar";
import { Resolver } from "did-resolver";
import { validateEvents } from '@jolocom/native-core'

const dbInstance = createSimpleEventDb()

const configuredResolver = getResolver('local')({
  validateEvents,
  dbInstance
})

const resolver = new Resolver(getResolver());
const didDocument = await resolver.resolve(did);

// didDocument now contains the corresponding Did Document in JSON form.
```

For an example of using this module with a storage backend other than the simple event DB provided within, check out the [this test example](./tests/sdk.test.ts)
