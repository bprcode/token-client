import { useReducer, useContext, createContext } from 'react'

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
    if (!map.has(key)) {
      return key
    }
  }
}

async function fetchLogged(request, statusList, dispatch) {
  if (!request.resource) {
    throw Error('No resource specified for request.')
  }
  const resource = request.resource
  const num = findUnusedKey(statusList)
  const method = request.method || 'GET'
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
    expireStatus(tag + ' timed out', 'purple')
    controller.abort('Fetch timed out. ' + tag)
  }, request.timeout || defaultTime)

  // Chain additional AbortSignal, if provided
  if (request.signal) {
    request.signal.addEventListener(
      'abort',
      () => {
        expireStatus(tag + ' cancelled', 'red')
        controller.abort(request.signal.reason)
        clearTimeout(tid)
      },
      { signal: controller.signal }
    )
  }

  dispatch({ type: 'set', id: num, message: tag })
  let response

  try {
    response = await fetch(resource, {
      ...request,
      signal: controller.signal,
    }).then(result => {
      expireStatus(tag + ' OK', 'green')
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

export function useWrapFetch() {
  const fetchStatus = useContext(FetchStatusContext)
  const fetchStatusDispatch = useContext(FetchStatusDispatchContext)

  // wrapFetch(request)...
  return request => {
    // ... yields a fetcher function...
    return argument => {
      // ... the fetcher will resolve dynamic requests:
      if (typeof request === 'function') {
        return fetchLogged(
          request(argument),
          fetchStatus,
          fetchStatusDispatch
        ).then(result => result.json())
      }

      // ... or use static request objects as provided:
      return fetchLogged(
        { ...request, signal: argument.signal },
        fetchStatus,
        fetchStatusDispatch
      ).then(result => result.json())
    }
  }
}
