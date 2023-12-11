import UploadIcon from '@mui/icons-material/Upload'
import SendIcon from '@mui/icons-material/Send'
import { CircularProgress, IconButton, Typography } from '@mui/material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams, useSearchParams } from 'react-router-dom'
import { goFetch } from '../go-fetch'
import { useRef } from 'react'
import { createSampleWeek } from './calendarLogic.mjs'
import dayjs from 'dayjs'
import { touchList } from './reconcile.mjs'

const log = console.log.bind(console)

function useEventBundleMutation(calendarId) {
  const abortRef = useRef(new AbortController())

  const queryClient = useQueryClient()

  const itemMutation = useMutation({
    mutationFn: variables => {
      return makeEventFetch(calendarId, variables)
    },
    onSuccess: (data, variables) => 'not implemented',
    // handleCalendarSuccess({
    //   result: data,
    //   original: variables,
    //   queryClient,
    // }),
    onError: (error, variables) =>
      handleEventError(calendarId, {
        error,
        original: variables,
        queryClient,
      })
    // handleCalendarError({
    //   error,
    //   original: variables,
    //   queryClient,
    // }),
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
      if (error?.status === 409) {
        console.log(
          `⛔ Event bundle mutation resulted in ${error.status}. ` +
            `No backoff-refetch implemented yet.`
        )

        // backoff(`catalog conflict refetch`, () => {
        //   console.log(`⛔ Bundle refetching.`)
        //   queryClient.refetchQueries({ queryKey: ['catalog'] })
        // })
      }
    },
  })

  return bundleMutation
}

function handleEventError(calendarId, { error, original, queryClient }) {
  // Tried to delete something that doesn't exist
  if (original.isDeleting && error.status === 404) {
    // Reflect the absence in the primary cache and active views
    queryClient.setQueryData(['primary cache', calendarId], data =>
      ({
        ...data,
        stored: data.stored.filter(e => e.id !== original.id)
      })
    )

    queryClient.setQueriesData({queryKey: ['views']}, events =>
      events.filter(e => e.id !== original.id))
      
    return
  }
}

function makeEventFetch(calendarId, variables) {
  const endpoint = `calendars`
  const timeout = 5000
  const signal = variables.signal

  if(variables.isDeleting) {
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

function EventSyncContents({ id }) {
  const { mutate, isPending } = useEventBundleMutation(id)
  const { data: primaryCacheData } = useQuery({
    queryKey: ['primary cache', id],
    enabled: false,
  })
  const touched = touchList(primaryCacheData?.stored)

  return (
    <Typography variant="subtitle2" color={'info.main'}>
      Events {touched.length ? `(${touched.length})` : `clean`}
      {isPending ? (
        <CircularProgress size="16px" sx={{ ml: 2 }} />
      ) : (
        <IconButton onClick={() => mutate(touched)}>
          <UploadIcon />
        </IconButton>
      )}
    </Typography>
  )
}

export function EventSyncStatus() {
  const { id } = useParams()
  return id && <EventSyncContents id={id} />
}
