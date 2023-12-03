import SyncIcon from '@mui/icons-material/Sync'
import CircularProgress from '@mui/material/CircularProgress'
import { Box, IconButton, List, ListItem, Typography } from '@mui/material'
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
  const queryClient = useQueryClient()

  const itemMutation = useMutation({
    onMutate: variables => {
      // Extend the variables object to expose the current abort signal
      variables.original = { ...variables }
    },
    mutationFn: variables =>
      makeCalendarFetch(variables.original, variables.signal),
    onSuccess: (data, variables) =>
      handleCalendarSuccess({
        result: data,
        original: variables.original,
        queryClient,
      }),
    onError: (error, variables) =>
      handleCalendarError({
        error,
        original: variables.original,
        queryClient,
      }),
  })

  const bundleMutation = useMutation({
    retry: 0,
    mutationKey: ['catalog bundle'],
    onMutate: variables => {
      console.log(
        `☢️ Starting bundle mutation with calendars (${variables.length})`,
        variables.map(c => c.calendar_id).join(', ')
      )
    },
    mutationFn: variables =>
      Promise.all(
        // Important to clone the record, rather than passing it directly,
        // since the mutate method also modifies the variables it receives.
        variables.map(c => itemMutation.mutateAsync({ ...c }))
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

function makeCalendarFetch(original, signal) {
  const endpoint = 'calendars'
  const timeout = 5000

  // Omit fields not needed by the server
  const blanks = {
    unsaved: undefined,
    created: undefined,
    updated: undefined,
    originTag: undefined,
    stableKey: undefined,
    primary_author_id: undefined,
  }

  if (original.isDeleting) {
    return goFetch(`${endpoint}/${original.calendar_id}`, {
      method: 'DELETE',
      body: { etag: original.etag },
      timeout,
      signal,
    })
  }

  if (original.etag === 'creating') {
    return goFetch(endpoint, {
      method: 'POST',
      body: {
        ...original,
        ...blanks,
        etag: undefined,
        key: original.calendar_id,
      },
      timeout,
      signal,
    })
  }

  return goFetch(`${endpoint}/${original.calendar_id}`, {
    method: 'PUT',
    body: { ...original, ...blanks },
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
  if (isMutating) {
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
            alignItems: 'center',
            padding: '0.25rem 1rem',
          }}
        >
          <Box sx={{}}>
            <Typography variant="subtitle2" color={color}>
              {status}
            </Typography>
          </Box>
          {isMutating && (
            <CircularProgress size="20px" sx={{ ml: 'auto', color }} />
          )}
        </div>
      </Box>
    </>
  )
}
