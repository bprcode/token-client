import CircularProgress from '@mui/material/CircularProgress'
import { Typography } from '@mui/material'
import { useCatalogQuery } from './calendar/routes/Catalog'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { goFetch } from './go-fetch'
import { useEffect, useRef } from 'react'
import {
  bounceEarly,
  backoff,
  leadingDebounce,
  hasDebounce,
} from './debounce.mjs'
import { touchList } from './calendar/reconcile.mjs'

function useCatalogBundleMutation() {
  const abortRef = useRef(new AbortController())

  const queryClient = useQueryClient()

  const itemMutation = useMutation({
    mutationFn: variables => {
      return makeCalendarFetch(variables)
    },
    onSuccess: (data, variables) =>
      handleCalendarSuccess({
        result: data,
        original: variables,
        queryClient,
      }),
    onError: (error, variables) =>
      handleCalendarError({
        error,
        original: variables,
        queryClient,
      }),
  })

  const bundleMutation = useMutation({
    retry: 0,
    mutationKey: ['catalog bundle'],
    onMutate: variables => {
      abortRef.current.abort()
      abortRef.current = new AbortController()
      console.log(
        `🟧 Starting bundle mutation with calendars (${variables.length})`,
        variables.map(c => c.calendar_id).join(', ')
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
          `⛔ Bundle mutation resulted in ${error.status}. ` +
            `Backoff-refetching...`
        )
        backoff(`catalog conflict refetch`, () => {
          console.log(`⛔ Bundle refetching.`)
          queryClient.refetchQueries({ queryKey: ['catalog'] })
        })
      }
    },
  })

  return bundleMutation
}

function handleCalendarError({ error, original, queryClient }) {
  // Tried to delete something that doesn't exist yet
  if (original.isDeleting && error.status === 404) {
    queryClient.setQueryData(['catalog'], catalog =>
      catalog.filter(c => c.calendar_id !== original.calendar_id)
    )
    return
  }
}

function handleCalendarSuccess({ result, original, queryClient }) {
  const current = queryClient
    .getQueryData(['catalog'])
    .find(c => c.calendar_id === original.calendar_id)

  // Creation success
  if (original.etag === 'creating') {
    // Retain any pending edits
    const update = {
      ...current,
      primary_author_id: result.primary_author_id,
      etag: result.etag,
      created: result.created,
      updated: result.updated,
      calendar_id: result.calendar_id,
    }

    if (current?.unsaved === original.unsaved) {
      delete update.unsaved
    }

    queryClient.setQueryData(['catalog'], catalog =>
      catalog.map(c => (c.calendar_id === original.calendar_id ? update : c))
    )

    return
  }

  // Deletion success
  if (original.isDeleting) {
    queryClient.setQueryData(['catalog'], catalog =>
      catalog.filter(c => c.calendar_id !== original.calendar_id)
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
      ...result[0],
      stableKey: current.stableKey,
    }
  } else {
    resolution = {
      ...current,
      etag: result[0].etag,
    }
  }

  queryClient.setQueryData(['catalog'], catalog =>
    catalog.map(c => (c.calendar_id === original.calendar_id ? resolution : c))
  )
}

function makeCalendarFetch(variables) {
  const endpoint = 'calendars'
  const timeout = 5000
  const signal = variables.signal

  // Omit local fields not needed by the server
  const blanks = {
    signal: undefined,
    unsaved: undefined,
    created: undefined,
    updated: undefined,
    originTag: undefined,
    stableKey: undefined,
    primary_author_id: undefined,
  }

  if (variables.isDeleting) {
    return goFetch(`${endpoint}/${variables.calendar_id}`, {
      method: 'DELETE',
      body: { etag: variables.etag },
      timeout,
      signal,
    })
  }

  if (variables.etag === 'creating') {
    return goFetch(endpoint, {
      method: 'POST',
      body: {
        ...variables,
        ...blanks,
        etag: undefined,
        key: variables.calendar_id,
      },
      timeout,
      signal,
    })
  }

  return goFetch(`${endpoint}/${variables.calendar_id}`, {
    method: 'PUT',
    body: { ...variables, ...blanks },
    timeout,
    signal,
  })
}

const noop = () => {}
export function CatalogAutosaver({
  mutate,
  data,
  isFetching,
  isError,
  log = noop,
}) {
  const countRef = useRef(1)
  const queryClient = useQueryClient()

  useEffect(() => {
    leadingDebounce(
      `Catalog autosaver`,
      () => {
        countRef.current++

        const list = touchList(queryClient.getQueryData(['catalog']))
        if (list.length > 0) {
          log(`♻️ Autosaving... (check # ${countRef.current})`)
          mutate(list)
        } else {
          log(`✅ Autosaver clean. (check # ${countRef.current})`)
        }
      },
      4000
    )()
  }, [data, queryClient, mutate, log])

  useEffect(() => {
    if (!isFetching && !isError) {
      log(`👁️ fetch success. ${Math.floor(Math.random() * 1e9)}`)
      if (hasDebounce(`Catalog autosaver`)) {
        log(`Autosaver already ran or running.`)
        return
      }

      leadingDebounce(
        `Catalog autosaver`,
        () => {
          const list = touchList(queryClient.getQueryData(['catalog']))
          if (list.length > 0) {
            log(`♻️👁️ Fetch sentinel syncing...`)
            mutate(list)
          } else {
            log(`✅👁️ Fetch sentinel clean.`)
          }
        },
        4000
      )()
    }
  }, [queryClient, mutate, isFetching, isError, log])

  useEffect(() => {
    return () => {
      log('🫧 Unmounting autosave effect')
      bounceEarly(`Catalog autosaver`)
    }
  }, [log])
}

export function CatalogSyncStatus() {
  const bundleMutation = useCatalogBundleMutation()
  const { data, isFetching, isError } = useCatalogQuery()
  const list = touchList(data)
  const isMutating = bundleMutation.isPending

  let color = 'success.main'
  let status = 'Saved.'

  if (list.length > 0) {
    color = 'info.main'
    status = `Pending (${list.length})`
  }
  if (isMutating && list.length > 0) {
    color = 'warning.main'
    status = `Autosaving... (${list.length})`
  }

  return (
    <>
      <CatalogAutosaver
        mutate={bundleMutation.mutate}
        isFetching={isFetching}
        isError={isError}
        data={data}
      />
      <div
        style={{
          display: 'flex',
          justifyContent: 'end',
          padding: '0.25rem 0.25rem',
        }}
      >
        <Typography variant="subtitle2" color={color}>
          {status}
        </Typography>
        {isMutating && (
          <CircularProgress size="20px" sx={{ ml: '1rem', color }} />
        )}
      </div>
    </>
  )
}
