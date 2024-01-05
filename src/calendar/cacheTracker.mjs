import { useEffect, useState } from 'react'
import { debounce } from '../debounce.mjs'
import { touchList } from './reconcile.mjs'

const lastUpdated = new Map()
const listeners = new Set()
const gcTime = 20 * 1000
const tidyTime = 10 * 1000

function readList() {
  return [...lastUpdated.keys()]
}

// todo next: gc
const tidyUp = (queryClient, id) => () => {
  const now = Date.now()
  const age = now - lastUpdated.get(id)
  const t = touchList(queryClient.getQueryData(['primary cache', id])?.stored)

  if (age < gcTime || t.length !== 0) {
    debounce(`expire cache ${id}`, tidyUp(queryClient, id), tidyTime)()
    return
  }

  lastUpdated.delete(id)
  const arrayed = readList()

  for (const listen of listeners) {
    listen(arrayed)
  }
}

export function updateCacheData(queryClient, id, updater) {
  const now = Date.now()
  queryClient.setQueryData(['primary cache', id], updater)
  lastUpdated.set(id, now)

  const arrayed = readList()

  for (const listen of listeners) {
    listen(arrayed)
  }

  debounce(`expire cache ${id}`, tidyUp(queryClient, id), tidyTime)()
}

export function useCacheList() {
  const [caches, setCaches] = useState(readList)

  useEffect(() => {
    listeners.add(setCaches)

    return () => {
      listeners.delete(setCaches)
    }
  }, [])

  return caches
}
