import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { goFetch } from '../go-fetch'
import { useCallback, useRef } from 'react'
import dayjs from 'dayjs'
import { touchList } from './reconcile.mjs'
import { resetViewsToCache } from './routes/Calendar'
import { Autosaver, AutosaverStatus } from '../Autosaver'
import { backoff, debounce } from '../debounce.mjs'
import { updateCacheData } from './cacheTracker.mjs'

const log = (...args) => console.log('%cEventSync>', 'color:silver', ...args)

function makeBatchEntry(event) {
  if (event.etag === 'creating') {
    return {
      action: 'POST',
      body: {
        key: event.id,
        start_time: event.startTime.toISOString(),
        end_time: event.endTime.toISOString(),
        summary: event.summary,
        description: event.description,
        color_id: event.colorId,
      },
    }
  }
  if (event.isDeleting) {
    return {
      action: 'DELETE',
      event_id: event.id,
      body: {
        etag: event.etag,
      },
    }
  }

  return {
    action: 'PUT',
    event_id: event.id,
    body: {
      etag: event.etag,
      start_time: event.startTime.toISOString(),
      end_time: event.endTime.toISOString(),
      summary: event.summary,
      description: event.description,
      color_id: event.colorId,
    },
  }
}

function useEventBatchMutation(calendarId) {
  const queryClient = useQueryClient()
  const abortRef = useRef(new AbortController())

  const batchMutation = useMutation({
    mutationKey: ['batched event updates', calendarId],
    onMutate: variables => {
      abortRef.current.abort()
      abortRef.current = new AbortController()

      variables.batch = variables.map(makeBatchEntry)
      variables.signal = abortRef.current.signal
    },
    mutationFn: variables => {
      return goFetch(`calendars/${calendarId}/events:batchUpdate`, {
        method: 'POST',
        body: variables.batch,
        timeout: 4000,
        signal: variables.signal,
      })
    },
    onSuccess: (reply, variables) => {
      log('batch update success:', reply)

      if (variables.length !== reply.length) {
        log('🛑 Batch result did not match request size.')
        return backoff(`event error refetch`, () => {
          log(`🍒 event bundle error requesting refetch...`)
          queryClient.refetchQueries({ queryKey: ['views', calendarId] })
        })
      }

      for (let i = 0; i < reply.length; i++) {
        if (reply[i].error) {
          log('⭐ Handling entry error:', reply[i].error)
          log('Variable entry was:', variables[i])
          let status = undefined
          if (reply[i].error === 'No resource matched request.') {
            status = 404
          }
          if (reply[i].error === 'etag mismatch.') {
            status = 409
          }
          handleEventError({
            error: {
              message: reply[i].error,
              status,
              conflict: reply[i].conflict,
            },
            calendarId,
            original: variables[i],
            queryClient,
          })

          continue
        }
        handleEventSuccess({
          calendarId,
          result: reply[i],
          original: variables[i],
          queryClient,
        })
      }
    },
    onError: error => {
      log('🤒 batch error handler placeholder, message=', error.message)
    },
  })

  return { mutate: batchMutation.mutate, isPending: batchMutation.isPending }
}

// function useEventBundleMutation(calendarId) {
//   const abortRef = useRef(new AbortController())

//   const queryClient = useQueryClient()

//   const itemMutation = useMutation({
//     mutationFn: variables => {
//       return makeEventFetch(calendarId, variables)
//     },
//     onSuccess: (data, variables) =>
//       handleEventSuccess({
//         calendarId,
//         result: data,
//         original: variables,
//         queryClient,
//       }),
//     onError: (error, variables) =>
//       handleEventError({
//         error,
//         calendarId,
//         original: variables,
//         queryClient,
//       }),
//   })

//   const bundleMutation = useMutation({
//     retry: 0,
//     mutationKey: ['event bundle', calendarId],
//     onMutate: variables => {
//       abortRef.current.abort()
//       abortRef.current = new AbortController()

//       log(
//         `🍢 should start bundle with events (${variables.length}):`,
//         variables.map(v => v.id).join(', ')
//       )
//     },
//     mutationFn: variables =>
//       Promise.all(
//         variables.map(c =>
//           itemMutation.mutateAsync({
//             ...c,
//             signal: abortRef.current.signal,
//           })
//         )
//       ),
//     onError: error => {
//       if (error?.status === 409 || error?.status === 404) {
//         // Delay slightly to encourage pending requests to resolve
//         // before a refetch, for smoother conflict resolution.
//         setTimeout(() => {
//           backoff(`event error refetch`, () => {
//             log(`🍒 event bundle error requesting refetch...`)
//             queryClient.refetchQueries({ queryKey: ['views', calendarId] })
//           })
//         }, 500)
//       }
//     },
//   })

//   return bundleMutation
// }

function updateStored(queryClient, calendarId, transform) {
  updateCacheData(queryClient, calendarId, data => ({
    ...data,
    stored: transform(data.stored),
  }))

  resetViewsToCache(queryClient, calendarId)
}

export function isEventDuplicate(local, remote) {
  return (
    local.colorId === remote.colorId &&
    local.summary === remote.summary &&
    local.description === remote.description &&
    local.startTime.toISOString() === remote.startTime.toISOString() &&
    local.endTime.toISOString() === remote.endTime.toISOString()
  )
}

function reviveServedEvent(served) {
  return {
    ...served,
    colorId: served.color_id,
    startTime: dayjs(served.start_time),
    endTime: dayjs(served.end_time),
  }
}

function hasSameContent(local, served) {
  return isEventDuplicate(local, reviveServedEvent(served))
}

function handleEventSuccess({ calendarId, result, original, queryClient }) {
  const current = queryClient
    .getQueryData(['primary cache', calendarId])
    ?.stored.find(e => e.id === original.id)

  // Creation success
  if (original.etag === 'creating') {
    log(`🩶 Handling create success ${result.event_id}, original=`, original)

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
    log('🩶 Handling delete success, original=', original)
    updateStored(queryClient, calendarId, stored =>
      stored.filter(e => e.id !== original.id)
    )

    return
  }

  // Update success
  log('🩶 Handling update success, original=', original)
  if (current.etag !== original.etag) {
    return
  }

  let resolution = {}
  if (current.unsaved === original.unsaved) {
    resolution = {
      id: original.id,
      summary: result.summary,
      description: result.description,
      startTime: dayjs(result.start_time),
      endTime: dayjs(result.end_time),
      colorId: result.color_id,
      etag: result.etag,

      stableKey: current.stableKey,
    }
  } else {
    resolution = {
      ...current,
      etag: result.etag,
    }
  }

  updateStored(queryClient, calendarId, stored =>
    stored.map(e => (e.id === original.id ? resolution : e))
  )
}

function handleEventError({ calendarId, error, original, queryClient }) {
  log('handleEventError acting on error:', error, 'and original:', original)
  if (error.status === 409) {
    const conflict = error.conflict && reviveServedEvent(error.conflict)
    log('🩶⚔️ Handling 409, original=', original)
    log('and conflict=', conflict)

    // If etags mismatched, but the server state reflects the local
    // desired changes, resolve the conflict locally.
    if (conflict && isEventDuplicate(original, conflict)) {
      log('💛💛 409, but content matched anyway. Resolving...')

      const resolution = {
        ...conflict,
        id: original.id,
        stableKey: original.stableKey,
      }

      updateStored(queryClient, calendarId, stored =>
        stored.map(e => (e.id === original.id ? resolution : e))
      )

      return
    }

    // If the 409 represents a true content mismatch,
    // refetch and let the reconciler to decide how to proceed.
    debounce(
      'refetch views',
      () =>
        backoff(`event error refetch`, () => {
          log(`🍒 event bundle error requesting refetch...`)
          queryClient.refetchQueries({ queryKey: ['views', calendarId] })
        }),

      1000
    )()
    return
  }
  // Tried to delete something that doesn't exist
  if (original.isDeleting && error.status === 404) {
    log('🩶✖️ Handling delete 404, original=', original)
    // Reflect the absence in the primary cache and active views
    updateStored(queryClient, calendarId, stored =>
      stored.filter(e => e.id !== original.id)
    )

    return
  }
}

// function makeEventFetch(calendarId, variables) {
//   const endpoint = `calendars`
//   const timeout = 5000
//   const signal = variables.signal

//   if (variables.etag === 'creating') {
//     return goFetch(`${endpoint}/${calendarId}/events`, {
//       method: 'POST',
//       body: {
//         key: variables.id,
//         start_time: variables.startTime.toISOString(),
//         end_time: variables.endTime.toISOString(),
//         summary: variables.summary,
//         description: variables.description,
//         color_id: variables.colorId,
//       },
//       timeout,
//       signal,
//     })
//   }

//   if (variables.isDeleting) {
//     return goFetch(`${endpoint}/events/${variables.id}`, {
//       method: 'DELETE',
//       body: {
//         etag: variables.etag,
//       },
//       timeout,
//       signal,
//     })
//   }

//   return goFetch(`${endpoint}/events/${variables.id}`, {
//     method: 'PUT',
//     body: {
//       etag: variables.etag,
//       start_time: variables.startTime.toISOString(),
//       end_time: variables.endTime.toISOString(),
//       summary: variables.summary,
//       description: variables.description,
//       color_id: variables.colorId,
//     },
//     timeout,
//     signal,
//   })
// }

const autosaveLogger = (...args) =>
  console.log('%cEvent Autosaver>', 'color:orange', ...args)

export function EventSyncStatus({ id }) {
  const { mutate: mutateBatch, isPending: isBatchPending } =
    useEventBatchMutation(id)
  // const { mutate: mutateBundle, isPending } = useEventBundleMutation(id)
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
      <Autosaver
        debounceKey={`Event autosaver ${id}`}
        mutate={mutateBatch}
        log={autosaveLogger}
        // isFetching and isError props omitted since primaryCacheData
        // does not maintain referential integrity on refetch anyway.
        data={primaryCacheData}
        getTouchList={getEventTouchList}
      />
      <AutosaverStatus
        touchList={touched}
        isPending={isBatchPending}
        label="Events"
      />
    </>
  )
}
