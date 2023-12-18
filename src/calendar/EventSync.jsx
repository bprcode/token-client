import UploadIcon from '@mui/icons-material/Upload'
import { CircularProgress, IconButton, Typography } from '@mui/material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams, useSearchParams } from 'react-router-dom'
import { goFetch } from '../go-fetch'
import { useCallback, useRef } from 'react'
import { createSampleWeek } from './calendarLogic.mjs'
import dayjs from 'dayjs'
import { touchList } from './reconcile.mjs'
import { resetViewsToCache } from './routes/Calendar'
import { Autosaver, AutosaverStatus } from '../Autosaver'
import { backoff } from '../debounce.mjs'
import { updateCacheData } from './cacheTracker.mjs'

const log = console.log.bind(console)

function useEventBundleMutation(calendarId) {
  const abortRef = useRef(new AbortController())

  const queryClient = useQueryClient()

  const itemMutation = useMutation({
    mutationFn: variables => {
      return makeEventFetch(calendarId, variables)
    },
    onSuccess: (data, variables) =>
      handleEventSuccess({
        calendarId,
        result: data,
        original: variables,
        queryClient,
      }),
    onError: (error, variables) =>
      handleEventError({
        error,
        calendarId,
        original: variables,
        queryClient,
      }),
  })

  const bundleMutation = useMutation({
    retry: 0,
    mutationKey: ['event bundle', calendarId],
    onMutate: variables => {
      abortRef.current.abort()
      abortRef.current = new AbortController()

      log(
        `🍢 should start bundle with events:`,
        variables.map(v => v.id).join(', ')
      )
    },
    mutationFn: variables =>
      Promise.all(
        variables.map(c =>
          itemMutation.mutateAsync({
            ...c,
            signal: abortRef.current.signal,
          })
        )
      ),
    onError: error => {
      if (error?.status === 409 || error?.status === 404) {
        backoff(`event error refetch`, () => {
          console.log(`🍒 event bundle error requesting refetch...`)
          queryClient.refetchQueries({ queryKey: ['views', calendarId] })
        })
      }
    },
  })

  return bundleMutation
}

function updateStored(queryClient, calendarId, transform) {
  updateCacheData(queryClient, calendarId, data => ({
    ...data,
    stored: transform(data.stored),
  }))

  resetViewsToCache(queryClient, calendarId)
}

function handleEventSuccess({ calendarId, result, original, queryClient }) {
  const current = queryClient
    .getQueryData(['primary cache', calendarId])
    ?.stored.find(e => e.id === original.id)

  function hasSameContent(local, served) {
    return (
      local.colorId === served.color_id &&
      local.summary === served.summary &&
      local.description === served.description &&
      local.startTime.toISOString() === served.start_time &&
      local.endTime.toISOString() === served.end_time
    )
  }

  // Creation success
  if (original.etag === 'creating') {
    // Retain any pending edits
    const update = {
      ...current,
      id: result.event_id,
      etag: result.etag,
      created: dayjs(result.created),
    }

    if (hasSameContent(current, result)) {
      delete update.unsaved
    }

    updateStored(queryClient, calendarId, stored =>
      stored.map(e => (e.id === original.id ? update : e))
    )

    return
  }

  // Deletion success
  if (original.isDeleting) {
    updateStored(queryClient, calendarId, stored =>
      stored.filter(e => e.id !== original.id)
    )

    return
  }

  // Update success
  if (current.etag !== original.etag) {
    return
  }

  let resolution = {}
  if (current.unsaved === original.unsaved) {
    resolution = {
      id: original.id,
      summary: result[0].summary,
      description: result[0].description,
      startTime: dayjs(result[0].start_time),
      endTime: dayjs(result[0].end_time),
      colorId: result[0].color_id,
      etag: result[0].etag,

      stableKey: current.stableKey,
    }
  } else {
    resolution = {
      ...current,
      etag: result[0].etag,
    }
  }

  updateStored(queryClient, calendarId, stored =>
    stored.map(e => (e.id === original.id ? resolution : e))
  )
}

function handleEventError({ calendarId, error, original, queryClient }) {
  // Tried to delete something that doesn't exist
  if (original.isDeleting && error.status === 404) {
    // Reflect the absence in the primary cache and active views
    updateStored(queryClient, calendarId, stored =>
      stored.filter(e => e.id !== original.id)
    )

    return
  }
}

function makeEventFetch(calendarId, variables) {
  const endpoint = `calendars`
  const timeout = 5000
  const signal = variables.signal

  if (variables.isDeleting) {
    return goFetch(`${endpoint}/events/${variables.id}`, {
      method: 'DELETE',
      body: {
        etag: variables.etag,
      },
      timeout,
      signal,
    })
  }

  if (variables.etag === 'creating') {
    return goFetch(`${endpoint}/${calendarId}/events`, {
      method: 'POST',
      body: {
        key: variables.id,
        start_time: variables.startTime.toISOString(),
        end_time: variables.endTime.toISOString(),
        summary: variables.summary,
        description: variables.description,
        color_id: variables.colorId,
      },
      timeout,
      signal,
    })
  }

  return goFetch(`${endpoint}/events/${variables.id}`, {
    method: 'PUT',
    body: {
      etag: variables.etag,
      start_time: variables.startTime.toISOString(),
      end_time: variables.endTime.toISOString(),
      summary: variables.summary,
      description: variables.description,
      color_id: variables.colorId,
    },
    timeout,
    signal,
  })
}

function useUploadMockEvents() {
  const [searchParams] = useSearchParams()

  function randomIdemKey() {
    return String(Math.floor(Math.random() * 1e9))
  }

  const idemKey = useRef(null)
  const timeout = 5000
  const { id } = useParams()
  const endpoint = `calendars/${id}/events`

  const mockEventMutation = useMutation({
    onMutate: variables => {
      idemKey.current = randomIdemKey()
      variables.key = idemKey.current

      // console.log('🟩 mock mutation had variables:', variables)
    },
    mutationFn: variables => {
      const datum = variables
      // console.log('key for mutation:', variables.key)
      return goFetch(endpoint, {
        method: 'POST',
        body: {
          summary: datum.summary,
          description: datum.description,
          start_time: datum.startTime,
          end_time: datum.endTime,
          color_id: datum.colorId,
          key: variables.key,
        },
        timeout,
        // signal,
      })
    },
  })

  const mockEventBundle = useMutation({
    retry: 0,
    onMutate: variables => {
      const d = searchParams.get('d')?.replaceAll('_', ':')
      const day = dayjs(d ?? undefined)
      variables.mockEvents = createSampleWeek(day, 10)
    },
    mutationFn: variables => {
      console.log('bundle mockEvents = ', variables.mockEvents)
      return Promise.all(
        variables.mockEvents.map(e => mockEventMutation.mutateAsync({ ...e }))
      )
    },
  })

  return mockEventBundle
}

const eventLogger = (...args) =>
  console.log('%cEventSync>', 'color:orange', ...args)

export function EventSyncStatus({ id }) {
  const { mutate: mutateBundle, isPending } = useEventBundleMutation(id)
  const { data: primaryCacheData } = useQuery({
    queryKey: ['primary cache', id],
    enabled: false,
  })
  const touched = touchList(primaryCacheData?.stored)
  const getEventTouchList = useCallback(
    queryClient =>
      touchList(queryClient.getQueryData(['primary cache', id]).stored),
    [id]
  )

  return (
    <>
      <div>Autosaver for {id}</div>
      <Autosaver
        debounceKey={`Event autosaver ${id}`}
        mutate={mutateBundle}
        log={eventLogger}
        // isFetching and isError props omitted since primaryCacheData
        // does not maintain referential integrity on refetch anyway.
        data={primaryCacheData}
        getTouchList={getEventTouchList}
      />
      <AutosaverStatus
        touchList={touched}
        isPending={isPending}
        label="Events"
      />
    </>
  )
}
