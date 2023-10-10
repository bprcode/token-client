import { useMediaQuery } from '@mui/material'
import { createContext } from 'react'

export const ToggleMenuContext = createContext(() => {})

export function useNarrowCheck () {
  return useMediaQuery('(max-width: 800px)')
}
