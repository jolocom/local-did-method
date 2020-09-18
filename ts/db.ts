interface DbState {
  [did: string]: string
}

/**
 * Mostly used for testing / demo / dev purposes.
 * A very simple Event DB for persisting / retrieving events
 */

export const createDb = (
  initialState: DbState = {}
): InternalDb => ({
    append: async (id: string, events: string) => {
      if (!initialState[id] || !initialState[id].length) {
        initialState[id] = ""
      }

      initialState[id] = initialState[id].concat(events)
      return true
    },
    delete: async (id: string) => {
      initialState[id] = "" 
      return true
    },
    read: async id => initialState[id] || "",
  })

export interface InternalDb {
  read: (id: string) => Promise<string>
  append: (id: string, events: string) => Promise<boolean>
  delete: (id: string) => Promise<boolean>,
}
