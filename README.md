# @jolocom/local-resolver-registrar
This repository can be used as a base for defining DID resolvers (compatible with the [DIF did-resolver](https://github.com/decentralized-identity/did-resolver) module), as well as the corresponding registrars, for various event based DID Methods.

The exported functions are agnostic to the structure of the underlying events, but rely on a number of functions being injected upon construction. These functions provide an implementation for operations which need to be aware of the event structure, allowing for registrars / resolvers relying on different event structures (e.g. [KERI](https://github.com/SmithSamuelM/Papers/blob/2a39bd7b99f39556bd9e204142a1f36c49372bd7/whitepapers/KERI_WP_2.x.web.pdf), [Peer DID](https://identity.foundation/peer-did-method-spec/index.html)) to be built by supplying different implementations of `getIdFromEvent` and `create` (required by the registrar), and `validateEvents` (required by the resolver and the registrar).

*Please note that these modules are not meant to be used directly, but rather through an integration with either the Jolocom Library ([resolver integration](https://github.com/jolocom/jolocom-lib/blob/next/ts/didMethods/local/resolver.ts#L22), [registrar integration](https://github.com/jolocom/jolocom-lib/blob/next/ts/didMethods/local/registrar.ts#L21)), or the DIF DID-Resolver module (as shown in the example below)*

## Usage examples
In combination with the [DIF DID-Resolver](https://github.com/decentralized-identity/did-resolver):

```typescript
import { getResolver, createSimpleEventDb } from "@jolocom/local-resolver-registrar";
import { Resolver } from "did-resolver";
import { validateEvents } from '@jolocom/native-core'

const dbInstance = createSimpleEventDb()

// The supported Event structures, and the logic for validating them
// is encapsulated in the implementation of validateEvents

const configuredResolver = getResolver('local')({
  validateEvents,
  dbInstance
})

const resolver = new Resolver(getResolver());
const didDocument = await resolver.resolve(did);

// didDocument now contains the corresponding Did Document in JSON form.
```

For an example of using the registrar / resolver modules (including an example of using an event database other than the default one) , please check out [the test folder](./tests).
