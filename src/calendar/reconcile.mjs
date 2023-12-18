import { useEffect, useState } from 'react'

const noop = () => {}

const listeners = new Set()
const conflicts = []
let lastId = 0

export function clearConflicts() {
  conflicts.length = 0
  onConflict()
}

function onConflict(...latest) {
  const maxLength = 100

  if (latest.length) {
    conflicts.push({
      id: lastId++,
      timestamp: Date.now(),
      message: latest.map(a => a.toString()).join(''),
    })
    if (conflicts.length > maxLength) {
      conflicts.shift()
    }
  }

  for (const f of listeners) {
    f([...conflicts])
  }
}

export function useConflictList() {
  const [list, setList] = useState(() => [...conflicts])

  useEffect(() => {
    listeners.add(setList)

    return () => {
      listeners.delete(setList)
    }
  }, [])

  return list
}

export function reconcile({
  localData,
  serverData,
  key,
  log = noop,
  allowRevival = false,
}) {
  const chillTime = 60 * 1000
  const merged = []
  const serverMap = new Map(serverData.map(data => [data[key], data]))
  const localMap = new Map(localData.map(data => [data[key], data]))

  log('mapified local:', localMap)
  log('mapified server:', serverMap)

  const now = Date.now()

  const isRecent = entry => entry.unsaved && now - entry.unsaved < chillTime

  for (const local of localData) {
    const remote = serverMap.get(local[key])
    const originTag = local.originTag ?? local.etag

    if (originTag === remote?.etag) {
      // Local origin matches remote; keep local copy.
      log(
        `Local origin matches remote (${local.etag}).` + ` Keeping local copy.`
      )

      merged.push(local)

      continue
    }

    if (
      originTag === 'creating' ||
      (local.etag === 'creating' && isRecent(local))
    ) {
      // Persist record creation.
      log('Persisting creation event', local[key], '🌿')
      merged.push(local)

      continue
    }

    if (local.isDeleting && !serverMap.has(local[key])) {
      // Unwanted record is gone; omit it.
      log(`👋 unwanted event gone; omitting (${local[key]})`)

      continue
    }

    if (isRecent(local)) {
      // Treat record as "hot," allow it to overwrite remote state.
      log(
        'treating',
        local[key],
        `as hot 🔥. (${Math.round(
          (chillTime - (now - local.unsaved)) / 1000
        )}s left)`
      )

      if (!allowRevival && !serverMap.has(local[key])) {
        // ... despite priority, yield to a remotely-deleted record
        // (optional -- allows revival of deleted records.)
        onConflict('yielding to remote-delete despite recency 🚭')
        log('yielding to remote-delete despite recency 🚭')
        continue
      }

      // etag could be missing if the record was deleted remotely
      const newTag = serverMap.get(local[key])?.etag ?? 'creating'

      let overwrite = null

      if (originTag !== newTag) {
        overwrite = { etag: newTag, originTag }
      }

      if (newTag === 'creating') {
        overwrite.stableKey = local.stableKey ?? local[key]
        log('>> applying stableKey=', overwrite.stableKey)
      }

      merged.push({
        ...local,
        ...overwrite,
      })

      continue
    }

    // Treat record as "cold": yield to server state in case of conflict.
    const pre = 'treating ' + local[key] + ' as cold 🧊'

    if (!serverMap.has(local[key])) {
      // Record was deleted remotely; omit it.
      onConflict(pre, '... yielding to remote-delete ✖️')
      log(pre, '... yielding to remote-delete ✖️')

      continue
    }

    // etags do not match; yield to the server state.
    onConflict(
      pre,
      `...etag mismatch (${originTag} / ${remote.etag}). ` +
        `Yielding to server copy.`
    )
    log(
      pre,
      `...etag mismatch (${originTag} / ${remote.etag}). ` +
        `Yielding to server copy.`
    )
    merged.push(remote)
  }

  for (const remote of serverData) {
    if (!localMap.has(remote[key])) {
      // Local state was missing a remote record. Add it.
      // debug -- not generally a conflict, just testing notifier
      onConflict('local state was missing ', remote[key], ' -- adding.')
      log('local state was missing ', remote[key], ' -- adding.')
      merged.push(remote)
    }
  }

  return merged
}

export function touchList(records) {
  const list = []

  for (const c of records ?? []) {
    if (c.unsaved || c.etag === 'creating' || c.isDeleting) {
      list.push(c)
    }
  }

  return list
}
