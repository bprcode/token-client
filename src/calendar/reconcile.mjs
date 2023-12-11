const noop = () => {}

export function reconcile({ localData, serverData, key, log = noop }) {
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
      log('Persisting creation event', local[key], '🌿')
      merged.push(local)

      continue
    }

    if (local.isDeleting && !serverMap.has(local[key])) {
      log(`👋 unwanted event gone; omitting (${local[key]})`)

      continue
    }

    if (isRecent(local)) {
      log(
        'treating',
        local[key],
        `as hot 🔥. (${Math.round(
          (chillTime - (now - local.unsaved)) / 1000
        )}s left)`
      )

      // debug -- the following condition should be removed for
      // event processing, to allow revival of deleted events,
      // but yielding is necessary for calendar objects,
      // due to broken, unretrievable calendar references.
      if (!serverMap.has(local[key])) {
        log('<calendar only> yielding to remote-delete despite recency 🚭')

        continue
      }

      // etag could be missing if the record was deleted remotely
      const newTag = serverMap.get(local[key])?.etag ?? 'creating'

      let overwrite = null

      if (originTag !== newTag) {
        overwrite = { etag: newTag, originTag }
      }

      if (newTag === 'creating') {
        overwrite.stableKey = local.stableKey ?? local.calendar_id
        log('>> applying stableKey=', overwrite.stableKey)
      }

      merged.push({
        ...local,
        ...overwrite,
      })

      continue
    }

    const pre = 'treating ' + local[key] + ' as cold 🧊'

    if (!serverMap.has(local[key])) {
      log(pre, '... yielding to remote-delete ✖️')

      continue
    }

    log(
      pre,
      `...etag mismatch (${originTag} / ${remote.etag}). ` +
        `Yielding to server copy.`
    )
    merged.push(remote)
  }

  for (const remote of serverData) {
    if (!localMap.has(remote[key])) {
      log('local state was missing ', remote[key], ' -- adding.')
      merged.push(remote)
    }
  }

  return merged
}

export function touchList(records) {
  const list = []

  for (const c of records ?? []) {
    if (c.unsaved || c.etag === 'creating') {
      list.push(c)
    }
  }

  return list
}
