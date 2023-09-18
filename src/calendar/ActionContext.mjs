import { createContext } from 'react'

export const actionList = ['edit', 'delete', 'create']
export const ActionContext = createContext(actionList[0])
