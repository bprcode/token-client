import { useEffect, useState } from 'react'
const log = () => {}

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

function recordStatus(fid, message) {
  fetches.set(fid, { fid, message, status: 'sent' })
  onStatus()
}

function updateStatus(fid, message, status = 'updated') {
  fetches.set(fid, { fid, message, status })
  onStatus()
}

function expireStatus(fid) {
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
  const defaultTimeout = 4000
  const controller = new AbortController()

  recordStatus(fid, tag)

  if (options.signal?.aborted) {
    updateStatus(fid, tag + ' already cancelled', 'aborted')
    expireStatus(fid, tag)
    throw new StatusError('Signal already cancelled', 'aborted')
  }

  const tid = setTimeout(() => {
    log('⌚ timed out: ', tag)
    controller.abort(Error('Request timed out.'))
  }, options.timeout || defaultTimeout)


  const abortListener = () => {
    updateStatus(fid, tag + ' aborted', 'aborted')
    controller.abort(options.signal.reason ?? Error('No reason specified.'))
    clearTimeout(tid)
  }

  if (options.signal) {
    options.signal.addEventListener(
      'abort',
      abortListener,
      { signal: controller.signal }
    )
  }

  return fetch(resource, { ...options, signal: controller.signal })
    .then(result => {
      updateStatus(fid, tag + ` 🡒 ${result.status}`, 'resolved')
      return result
    })
    .catch(e => {
      const isTimeout = e.message.endsWith('timed out.')
      const statusString = isTimeout ? 'timed out' : 'failed'
      updateStatus(
        fid,
        tag + ' ' + e.message,
        statusString
      )
      throw new StatusError(e.message, statusString)
    })
    .finally(() => {
      if(options.signal) {
        options.signal.removeEventListener(
          'abort',
          abortListener
        )
      }

      expireStatus(fid, tag)
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
  log(
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
      json.error ?? json.notice ?? 'Server responded with error.',
      response.status
    )
  }

  return json
}

const noRetryList = [400, 401, 403, 404, 409]
export function retryCheck(failureCount, error) {
  log(
    '🏳️ Fetch failure #',
    failureCount,
    'with error:',
    error.message,
    'and status: ',
    error.status
  )
  if(error.status === 'aborted') {
    log('🟨 Fetch aborted. Will not retry.')
    return false
  }
  if (failureCount >= 3) {
    log('too many retry attempts. Cancelling.')
    return false
  }
  if (noRetryList.includes(error.status)) {
    log('skipping retry on status', error.status)
    return false
  }
  return true
}
