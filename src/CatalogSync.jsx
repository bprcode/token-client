import { useCatalogQuery } from './calendar/routes/Catalog'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { goFetch } from './go-fetch'
import { useRef } from 'react'
import { backoff } from './debounce.mjs'
import { touchList } from './calendar/reconcile.mjs'
import { Autosaver, AutosaverStatus } from './Autosaver'

function useCatalogBundleMutation() {
  const abortRef = useRef(new AbortController())

  const queryClient = useQueryClient()

  const itemMutation = useMutation({
    onMutate: variables => {
      console.log(`initiating item mutation with variables=`, variables)
      return { ...variables }
    },
    mutationFn: variables => {
      console.log(`fetching item mutation with unsaved=`, variables.unsaved)
      return makeCalendarFetch(variables)
    },
    onSuccess: (data, variables, context) => {
      console.log(`item success, variables=`, variables)
      console.log(`and context=`, context)

      handleCalendarSuccess({
        result: data,
        original: variables,
        queryClient,
      })
    },
    onError: (error, variables, context) => {
      console.log('fields were:', Reflect.ownKeys(error))
      console.log(
        'error fields were:',
        error.message,
        error.status,
        error.conflict
      )
      handleCalendarError({
        error,
        original: variables,
        queryClient,
      })
    },
  })

  const bundleMutation = useMutation({
    retry: 0,
    mutationKey: ['catalog bundle'],
    onMutate: variables => {
      abortRef.current.abort()
      abortRef.current = new AbortController()
      console.log(
        `🟧 Starting bundle mutation with calendars (${variables.length})`,
        variables.map(c => c.calendar_id).join(', '),
        `and variables=`,
        ...variables
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
        const touched = getCatalogTouchList(queryClient)
        if (touched.length === 0) {
          console.log('Bundle got 409, but no touched records; no refetch.')
          return
        }

        console.log(`Had outstanding changes; refetching.`)
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
  if (error.status === 409) {
    const conflict = error.conflict
    console.log('comparing original/conflict:', original, conflict)
    if (conflict && isCalendarDuplicate(original, conflict)) {
      console.log('🔰 should self-resolve 409 here')
      const resolution = {
        ...original,
        etag: conflict.etag,
      }
      delete resolution.unsaved
      queryClient.setQueryData(['catalog'], catalog =>
        catalog.map(c =>
          c.calendar_id === original.calendar_id ? resolution : c
        )
      )
      return
    }
  }
  // Tried to delete something that doesn't exist yet
  if (original.isDeleting && error.status === 404) {
    queryClient.setQueryData(['catalog'], catalog =>
      catalog.filter(c => c.calendar_id !== original.calendar_id)
    )
    return
  }
}

export function isCalendarDuplicate(a, b) {
  return a.summary === b.summary
}

function handleCalendarSuccess({ result, original, queryClient }) {
  const current = queryClient
    .getQueryData(['catalog'])
    .find(c => c.calendar_id === original.calendar_id)

  const hasSameContent = isCalendarDuplicate

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

    if (hasSameContent(result, current)) {
      console.log('🔗 content equivalent, clearing unsaved:', original.unsaved)
      delete update.unsaved
    } else {
      console.log('✖️ content mismatch:', current?.summary, result.summary)
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
  const timeout = 4000 // debug -- unreasonably low to test
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

  if (variables.isDeleting) {
    return goFetch(`${endpoint}/${variables.calendar_id}`, {
      method: 'DELETE',
      body: { etag: variables.etag },
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

const getCatalogTouchList = queryClient =>
  touchList(queryClient.getQueryData(['catalog']))

export function CatalogSyncMonitor() {
  const bundleMutation = useCatalogBundleMutation()
  const { data, isFetching, isError } = useCatalogQuery()
  const list = touchList(data)

  return (
    <>
      <Autosaver
        debounceKey="Catalog autosaver"
        mutate={bundleMutation.mutate}
        isFetching={isFetching}
        isError={isError}
        data={data}
        getTouchList={getCatalogTouchList}
      />
      <AutosaverStatus
        touchList={list}
        isPending={bundleMutation.isPending}
        label="Catalog"
      />
    </>
  )
}
