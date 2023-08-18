import { useReducer, useState, useContext, createContext } from 'react'

export const FetchStatusContext = createContext(null)
export const FetchStatusDispatchContext = createContext(null)

export function fetchStatusReducer(log, action) {
  const newLog = new Map(log)

  switch (action.type) {
    case 'set':
      return newLog.set(action.id, {
        message: action.message,
        color: action.color || 'blue',
      })
    case 'deleted':
      newLog.delete(action.id)
      return newLog
    default:
      throw Error('Unrecognized action type: ' + action.type)
  }
}

export function FetchDisplay() {
  const fetchStatus = useContext(FetchStatusContext)

  if (import.meta.env.VITE_ENV !== 'development') {
    return
  }

  const displays = []
  let y = 0
  for (const s of fetchStatus) {
    displays.push(
      <div
        key={s[0]}
        style={{
          position: 'fixed',
          top: y,
          left: 0,
          width: 'max-content',
          backgroundColor: s[1].color,
          paddingLeft: '0.25rem',
          paddingRight: '0.25rem',
          transition: 'background-color 0.5s, top 1s',
        }}
      >
        {s[1].message}
      </div>
    )
    y += 24
  }

  return (
    <div style={{ zIndex: 1, position: 'fixed', top: 0, left: 0 }}>
      {displays}
    </div>
  )
}

function findUnusedKey(map) {
  let key
  while (true) {
    key = (Math.random() * 1000).toFixed(0)
    if (!map.has(key)) return key
  }
}

async function fetchLogged(resource, options = {}, statusList, dispatch) {
  const num = findUnusedKey(statusList)
  const method = options.method || 'GET'
  const tag =
    `(${num}) ` +
    method +
    ' > ' +
    resource.replace(import.meta.env.VITE_BACKEND, '')
  const defaultTime = 4000
  const controller = new AbortController()

  function expireStatus(message, color) {
    dispatch({ type: 'set', id: num, message, color })
    setTimeout(() => {
      dispatch({ type: 'deleted', id: num })
    }, 5000)
  }

  const tid = setTimeout(() => {
    console.log(`⌚ Timed out`, tag)
    expireStatus(tag + ' timed out', 'purple')
    controller.abort('Fetch timed out. ' + tag)
  }, options.timeout || defaultTime)

  // Chain additional AbortSignal, if provided
  if (options.signal) {
    options.signal.addEventListener(
      'abort',
      () => {
        console.log(`🌼 Chaining abort events...`, tag)
        expireStatus(tag + ' cancelled', 'red')
        controller.abort(options.signal.reason)
        clearTimeout(tid)
      },
      { signal: controller.signal }
    )
  }

  // Track abort events for the primary controller
  controller.signal.onabort = () => {
    console.log(`primary controller aborting`, tag)
  }

  dispatch({ type: 'set', id: num, message: tag })
  let response

  try {
    response = await fetch(resource, {
      ...options,
      signal: controller.signal,
    }).then(result => {
      expireStatus(tag + ' OK', 'green')
      console.log(`Resolved`, tag)
      return result
    })
  } finally {
    clearTimeout(tid)
  }

  return response
}

export function FetchStatusProvider({ children }) {
  const [fetchStatus, dispatch] = useReducer(fetchStatusReducer, new Map())

  return (
    <FetchStatusContext.Provider value={fetchStatus}>
      <FetchStatusDispatchContext.Provider value={dispatch}>
        {children}
      </FetchStatusDispatchContext.Provider>
    </FetchStatusContext.Provider>
  )
}

export function useLoggedFetch() {
  const fetchStatus = useContext(FetchStatusContext)
  const fetchStatusDispatch = useContext(FetchStatusDispatchContext)

  return async (resource, options) =>
    fetchLogged(resource, options, fetchStatus, fetchStatusDispatch)
}

export async function fetchTimeout() {}

/*
export async function fetchTimeout(resource, options = {}) {
  let num

  while (true) {
    num = (Math.random() * 1000).toFixed(0)
    console.log('trying ', num, ' has? ', fetchMap.has(num))
    if (!fetchMap.has(num)) {
      fetchLog =
        `(${num}) >` + resource.replace(import.meta.env.VITE_BACKEND, '')
      fetchMap.set(num, fetchLog)
      break
    }
  }

  console.log('Fetching ', fetchLog)

  const defaultTime = 4000
  const controller = new AbortController()
  const id = setTimeout(() => {
    console.log(`⌚ Timed out`, fetchLog)
    controller.abort('Fetch timed out. ' + fetchLog)
  }, options.timeout || defaultTime)

  // Chain additional AbortSignal, if provided
  if (options.signal) {
    options.signal.addEventListener(
      'abort',
      () => {
        console.log(`🌼 Chaining abort events...`, fetchLog)
        controller.abort(options.signal.reason)
        clearTimeout(id)
      },
      { signal: controller.signal }
    )
  }

  controller.signal.onabort = () => {
    fetchMap.delete(num)
    console.log(`primary controller aborting`, fetchLog)
  }

  let response
  try {
    response = await fetch(resource, {
      ...options,
      signal: controller.signal,
    }).then(x => {
      fetchMap.delete(num)
      console.log(`Resolved`, fetchLog)
      return x
    })
  } finally {
    clearTimeout(id)
  }

  return response
}
*/
