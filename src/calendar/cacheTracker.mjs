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
  console.log(`%cu was`, 'color:#08f', id, age / 1000, 'seconds ago')
  console.log(`touch list was:`, t)

  if (age < gcTime || t.length !== 0) {
    console.log(`should not gc yet`)
    debounce(`expire cache ${id}`, tidyUp(queryClient, id), tidyTime)()
    return
  }

  console.log(`should gc now`)
  lastUpdated.delete(id)
  const arrayed = readList()

  for (const listen of listeners) {
    console.log(`%clistening after delete`, `color:#08f`, listen)
    listen(arrayed)
  }
}

export function updateCacheData(queryClient, id, updater) {
  const now = Date.now()
  queryClient.setQueryData(['primary cache', id], updater)
  lastUpdated.set(id, now)
  console.log(`%cupdating cache ${id}`, `color:#08f`)

  const arrayed = readList()

  for (const listen of listeners) {
    console.log(`%clistening`, `color:#08f`, listen)
    listen(arrayed)
  }

  debounce(`expire cache ${id}`, tidyUp(queryClient, id), tidyTime)()
}

export function useCacheList() {
  const [caches, setCaches] = useState(readList)

  useEffect(() => {
    console.log(`%clistening with`, `color:#08f`, setCaches)
    listeners.add(setCaches)

    return () => {
      console.log(`%csilencing`, `color:#08f`, setCaches)
      listeners.delete(setCaches)
    }
  }, [])

  return caches
}
