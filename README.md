# @jolocom/local-resolver-registrar
This repository includes an implementation for a local, event based resolver / registrar modules. The exported functions are agnostic to the structure of the underlying events, only making assumptions about the algorithm for validation:

- Update: Given a list of events (e.g. a KEL), will use the available event DB to fetch all existing events related to the relevant identifier, append all new **unique** events received, and attempt to validate the new event sequence. If the validation succeeds, the new unique events are appended to the database, and the new resulting DID Document is returned.
- Delete: Given an identifier (associated with a sequence of events) will attempt to remove all events related to the identifier from the event DB.

Repository containing logic for resolving / registering local identities a resolver / registrar implementation for a local, event based DID method.
