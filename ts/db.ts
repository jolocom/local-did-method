interface DbState {
  [did: string]: string[]
}

// SMALL MOCK IMPLEMENTATION, this will mutate the initialState
export const createDb = (
  initialState: DbState = {}
): InternalDb => ({
    append: async (id: string, events: string[]) => {
      if (!initialState[id] || !initialState[id].length) {
        initialState[id] = []
      }

      initialState[id] = initialState[id].concat(events)
      return true
    },
    delete: async (id: string) => {
      initialState[id] = [] 
      return true
    },
    read: async id => initialState[id] || [],
  })

export interface InternalDb {
  read: (id: string) => Promise<string[]>
  append: (id: string, events: string[]) => Promise<boolean>
  delete: (id: string) => Promise<boolean>,
}
