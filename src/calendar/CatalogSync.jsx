import { useCatalogQuery } from './routes/Catalog'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { goFetch } from '../go-fetch'
import { useRef } from 'react'
import { backoff } from '../debounce'
import { touchList } from './reconcile'
import { Autosaver, AutosaverStatus } from './Autosaver'
import log from '../log'

function useCatalogBundleMutation() {
  const abortRef = useRef(new AbortController())

  const queryClient = useQueryClient()

  const itemMutation = useMutation({
    onMutate: variables => {
      log(`initiating item mutation with variables=`, variables)
      return { ...variables }
    },
    mutationFn: variables => {
      log(`fetching item mutation with unsaved=`, variables.unsaved)
      return makeCalendarFetch(variables)
    },
    onSuccess: (data, variables, context) => {
      log(`item success, variables=`, variables)
      log(`and context=`, context)

      handleCalendarSuccess({
        result: data,
        original: variables,
        queryClient,
      })
    },
    onError: (error, variables) => {
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
      log(
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
          log('Bundle got 409, but no touched records; no refetch.')
          return
        }

        log(`Had outstanding changes; refetching.`)
        backoff(`catalog conflict refetch`, () => {
          log(`⛔ Bundle refetching.`)
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
    log('comparing original/conflict:', original, conflict)
    if (conflict && isCalendarDuplicate(original, conflict)) {
      log('🔰 Detected self-conflict; resolving 409')
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
      log('🔗 content equivalent, clearing unsaved:', original.unsaved)
      delete update.unsaved
    } else {
      log('✖️ content mismatch:', current?.summary, result.summary)
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
  const timeout = 4000
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

const blueLog = (...args) =>
  log('%cCatalog Autosaver>', 'color:#08f', ...args)

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
        log={blueLog}
      />
      <AutosaverStatus
        touchList={list}
        isPending={bundleMutation.isPending}
        label="Catalog"
      />
    </>
  )
}
