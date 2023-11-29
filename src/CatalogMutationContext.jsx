import { createContext } from "react"

// The only reason this is in a separate file is to work around
// a build issue in Vite.
// see: https://github.com/vitejs/vite/issues/3301
export const CatalogMutationContext = createContext(null)
