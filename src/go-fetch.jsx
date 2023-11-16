import { useEffect, useState } from 'react'

const fetches = new Map()
const listeners = new Set()

function onStatus() {
  const arr = [...fetches.values()]
  for (const f of listeners) {
    f(arr)
  }
}

export function useFetchStatus() {
  const [status, setStatus] = useState([...fetches.values()])

  useEffect(() => {
    listeners.add(setStatus)

    return () => {
      listeners.delete(setStatus)
    }
  }, [])

  return status
}

export function FetchDisplay() {
  const statusList = useFetchStatus()
  if (import.meta.env.VITE_ENV !== 'development') {
    return
  }

  const colors = {
    sent: 'blue',
    'timed out': 'purple',
    aborted: 'orange',
    resolved: 'green',
    failed: 'red',
  }

  return (
    <div style={{ zIndex: 4, position: 'fixed', top: 0, left: 0 }}>
      {statusList.map((s, i) => (
        <div
          key={s.fid}
          style={{
            position: 'fixed',
            top: i * 24,
            left: 0,
            width: 'max-content',
            backgroundColor: colors[s.status] ?? 'gray',

            paddingLeft: '0.25rem',
            paddingRight: '0.25rem',
            transition: 'background-color 0.5s, top 1s, opacity 1s',
            opacity: s.fadeOut ? 0.0 : 1.0,
          }}
        >
          {s.message}
        </div>
      ))}
    </div>
  )
}

function makeFetchId() {
  while (true) {
    const id = Math.floor(Math.random() * 1e3)
    if (!fetches.has(id)) {
      return id
    }
  }
}

function recordFetch(fid, message) {
  fetches.set(fid, { fid, message, status: 'sent' })
  onStatus()
}

function updateFetch(fid, message, status = 'updated') {
  fetches.set(fid, { fid, message, status })
  onStatus()
}

function expireFetch(fid) {
  setTimeout(() => {
    fetches.set(fid, { ...fetches.get(fid), fadeOut: true })
    onStatus()
  }, 4000)

  setTimeout(() => {
    fetches.delete(fid)
    onStatus()
  }, 5000)
}

const defaultFetchOptions = {
  credentials: 'include',
}

export function loggedFetch(resource, options = {}) {
  options = {
    ...defaultFetchOptions,
    ...options,
  }

  if (options.body) {
    options = {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      ...options,
    }
  }

  if (typeof options.body === 'object') {
    options.body = JSON.stringify(options.body)
  }

  if (!resource.startsWith('http')) {
    resource = import.meta.env.VITE_BACKEND + resource
  }

  const fid = makeFetchId()
  const method = options.method || 'GET'
  const tag = fid + ') ' + method + ' > ' + resource
  const abortTime = 4000
  const controller = new AbortController()

  recordFetch(fid, tag)

  const tid = setTimeout(() => {
    controller.abort(Error('Request timed out.'))
  }, abortTime)

  if (options.signal) {
    options.signal.addEventListener(
      'abort',
      () => {
        updateFetch(fid, tag + ' aborted', 'aborted')
        controller.abort(options.signal.reason ?? Error('No reason specified.'))
        clearTimeout(tid)
      },
      { signal: controller.signal }
    )
  }

  return fetch(resource, { ...options, signal: controller.signal })
    .then(result => {
      updateFetch(fid, tag + ` 🡒 ${result.status}`, 'resolved')
      return result
    })
    .catch(e => {
      const isTimeout = e.message.endsWith('timed out.')
      updateFetch(
        fid,
        tag + ' ' + e.message,
        isTimeout ? 'timed out' : 'failed'
      )
      throw e
    })
    .finally(() => {
      expireFetch(fid, tag)
      clearTimeout(tid)
    })
}

class StatusError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

export async function goFetch(resource, options) {
  const response = await loggedFetch(resource, options)
  console.log(
    resource,
    'response had status: ',
    response.status,
    ' and ok: ',
    response.ok
  )

  let json
  try {
    json = await response.json()
  } catch (e) {
    json = {}
  }

  if (!response.ok) {
    throw new StatusError(
      json.error ?? 'Server responded with error.',
      response.status
    )
  }

  return json
}

const noRetryList = [400, 401, 403, 404]
export function retryCheck(failureCount, error) {
  console.log('🏳️ Fetch failure #', failureCount, 'with error:', error.message)
  if (failureCount >= 3) {
    console.log('too many retry attempts. Cancelling.')
    return false
  }
  if (noRetryList.includes(error.status)) {
    console.log('skipping retry on status', error.status)
    return false
  }
  return true
}
