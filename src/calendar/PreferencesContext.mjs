import { createContext } from 'react'

const defaultPreferences = { merge: true }
export const PreferencesContext = createContext(defaultPreferences)
