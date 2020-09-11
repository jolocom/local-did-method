# @jolocom/local-resolver-registrar
This repository includes an implementation for a local, event based resolver / registrar modules. The exported functions are agnostic to the structure of the underlying events.

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
