import { createContext } from 'react'

export const LayoutContext = createContext('mobile')
export const DrawerContext = createContext({
  expanded: false,
  setExpanded: () => {},
})
