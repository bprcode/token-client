import { Box } from "@mui/material"
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react"

export const LoggerContext = createContext(null)

export function useLogger() {
  const logger = useContext(LoggerContext)
  return logger
}

export function LoggerProvider({children}) {
  const [log, setLog] = useState([])
  const addEntry = useCallback(entry => {
    setLog(l => {
      const updated = [...l, entry]
      if (updated.length > 50) {updated.shift()}
      return updated
    })
  }, [])

  return <LoggerContext.Provider value={addEntry}>
    <Logger log={log} />
    {children}
  </LoggerContext.Provider>
}

export function Logger({ log }) {
  const ref = useRef(null)
  useEffect(() => {
    ref.current.scrollTo(0, ref.current.scrollHeight)
  }, [log])
  
  return (
    <Box
      ref={ref}
      sx={{
        position: 'fixed',
        top: '4rem',
        width: '40ch',
        height: '6rem',
        backgroundColor: '#f33',
        color: '#ccc',
        overflowY: 'auto',
        zIndex: 9,
      }}
    >
      {log.map((m,i) => <div key={i}>{m}</div>)}
    </Box>
  )
}

