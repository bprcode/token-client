import CircularProgress from '@mui/material/CircularProgress'
import { Box, Typography } from '@mui/material'
import { useCatalogQuery } from './calendar/routes/Catalog'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { goFetch } from './go-fetch'
import { useContext, useEffect, useRef } from 'react'
import {
  bounceEarly,
  backoff,
  leadingDebounce,
  hasDebounce,
} from './debounce.mjs'
import { CatalogMutationContext } from './CatalogMutationContext'

export function CatalogMutationProvider({ children }) {
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

  return (
    <CatalogMutationContext.Provider value={bundleMutation}>
      {children}
    </CatalogMutationContext.Provider>
  )
}

export function touchList(queryClient) {
  const catalog = queryClient.getQueryData(['catalog'])

  const list = []

  for (const c of catalog ?? []) {
    if (c.unsaved || c.etag === 'creating') {
      list.push(c)
    }
  }

  return list
}

function useTouchList() {
  const catalog = useCatalogQuery()
  const list = []

  for (const c of catalog.data ?? []) {
    if (c.unsaved || c.etag === 'creating') {
      list.push(c)
    }
  }

  return list
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

export function CatalogAutosaver() {
  const countRef = useRef(1)
  const { data, isFetching, isError } = useCatalogQuery()

  const queryClient = useQueryClient()
  const { mutate } = useContext(CatalogMutationContext)

  useEffect(() => {
    leadingDebounce(
      `Catalog autosaver`,
      () => {
        countRef.current++

        const list = touchList(queryClient)
        if (list.length > 0) {
          console.log(`♻️ Autosaving... (check # ${countRef.current})`)
          mutate(touchList(queryClient))
        } else {
          console.log(`✅ Autosaver clean. (check # ${countRef.current})`)
        }
      },
      4000
    )()
  }, [data, queryClient, mutate])

  useEffect(() => {
    if (!isFetching && !isError) {
      console.log(`👁️ fetch success. ${Math.floor(Math.random() * 1e9)}`)
      if (hasDebounce(`Catalog autosaver`)) {
        console.log(`Autosaver already ran or running.`)
        return
      }

      leadingDebounce(
        `Catalog autosaver`,
        () => {
          const list = touchList(queryClient)
          if (list.length > 0) {
            console.log(`♻️👁️ Fetch sentinel syncing...`)
            mutate(touchList(queryClient))
          } else {
            console.log(`✅👁️ Fetch sentinel clean.`)
          }
        },
        4000
      )()
    }
  }, [queryClient, mutate, isFetching, isError])

  useEffect(() => {
    return () => {
      console.log('🫧 Unmounting autosave effect')
      bounceEarly(`Catalog autosaver`)
    }
  }, [])
}

export function CatalogSyncStatus() {
  const bundleMutation = useContext(CatalogMutationContext)
  const list = useTouchList()
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
      <CatalogAutosaver />
      <Box>
        <div
          style={{
            display: 'flex',
            justifyContent: 'end',
            padding: '0.25rem 0.25rem',
          }}
        >
          <Box sx={{}}>
            <Typography variant="subtitle2" color={color}>
              {status}
            </Typography>
          </Box>
          {isMutating && (
            <CircularProgress size="20px" sx={{ ml: '1rem', color }} />
          )}
        </div>
      </Box>
    </>
  )
}
