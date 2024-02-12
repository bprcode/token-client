import { useEffect, useState } from 'react'
import { debounce } from '../debounce.mjs'
import { touchList } from './reconcile.mjs'
import dayjs from 'dayjs'

const lastUpdated = new Map()
const listeners = new Set()
const gcTime = 20 * 1000
const tidyTime = 10 * 1000

function readList() {
  return [...lastUpdated.keys()]
}

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

export function reviveEvents(stringified) {
  return stringified.map(e => ({
    ...e,
    created: dayjs(e.created),
    startTime: dayjs(e.startTime),
    endTime: dayjs(e.endTime),
  }))
}

export function reviveSessionCache(id) {
  try {
    const last = JSON.parse(sessionStorage['primary cache ' + id])

    last.sortedViews = last.sortedViews.map(v => ({
      ...v,
      from: dayjs(v.from),
      to: dayjs(v.to),
    }))

    last.stored = reviveEvents(last.stored)

    console.log('session cache was:', last)
    return last
  } catch (e) {
    console.log('no session cache /', e.message)
    return null
  }
}

export function updateCacheData(queryClient, id, updater) {
  const now = Date.now()
  queryClient.setQueryData(['primary cache', id], updater)

  console.log(
    '%cSet primary cache to:',
    'color:#0fa',
    queryClient.getQueryData(['primary cache', id])
  )
  sessionStorage['primary cache ' + id] = JSON.stringify(
    queryClient.getQueryData(['primary cache', id])
  )

  lastUpdated.set(id, now)

  const arrayed = readList()

  for (const listen of listeners) {
    listen(arrayed)
  }

  debounce(`expire cache ${id}`, tidyUp(queryClient, id), tidyTime)()

  console.log('updateCacheData ran in ', Date.now() - now, 'ms')
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
