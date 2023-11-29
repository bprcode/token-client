import SyncIcon from '@mui/icons-material/Sync'
import CircularProgress from '@mui/material/CircularProgress'
import { Box, IconButton, List, ListItem } from '@mui/material'
import { useCatalogQuery } from './calendar/routes/Catalog'
import {
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { goFetch } from './go-fetch'
import { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { bounceEarly, debounce, leadingDebounce } from './debounce.mjs'
import { CatalogMutationContext } from './CatalogMutationContext'


export function CatalogMutationProvider({ children }) {
  const queryClient = useQueryClient()
  const controllerRef = useRef(new AbortController())

  const itemMutation = useMutation({
    onMutate: variables => {
      // Extend the variables object to expose the current abort signal
      variables.original = { ...variables }
      variables.signal = controllerRef.current.signal
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
      controllerRef.current.abort()
      controllerRef.current = new AbortController()
    },
    mutationFn: variables =>
      Promise.all(
        // Important to clone the record, rather than passing it directly,
        // since the mutate method also modifies the variables it receives.
        variables.map(c => itemMutation.mutateAsync({ ...c }))
      ),
    onSettled: () => {
      // Promise bundle finished
    },
  })

  return (
    <CatalogMutationContext.Provider value={bundleMutation}>
      {children}
    </CatalogMutationContext.Provider>
  )
}

function useSaveCatalogData() {
  const queryClient = useQueryClient()
  const bundleMutation = useContext(CatalogMutationContext)

  if (!bundleMutation) {
    throw Error('CatalogMutationProvider required.')
  }

  return debounce(
    `catalog save`,
    () => {
      console.log('⚽⚽ debounced save activated')
      bundleMutation.mutate(touchList(queryClient))
    },
    3000
  )

}

export function useSyncCatalogData() {
  const queryClient = useQueryClient()
  const bundleMutation = useContext(CatalogMutationContext)

  if (!bundleMutation) {
    throw Error('CatalogMutationProvider required.')
  }

  return (queryKey, updater) => {
    console.log(`Initiating cache update and debounced sync...`)

    queryClient.setQueryData(queryKey, updater)
    leadingDebounce(
      `catalog sync`,
      () => {
        console.log('⚽ debounced sync activated')
        bundleMutation.mutate(touchList(queryClient))
      },
      3000
    )()
  }
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
    resolution = result[0]
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

// const debouncedSave = debounce(
//   `Catalog autosaver`,
//   (queryClient, mutate, countRef) => {
//     console.log(`♻️ Autosaver triggered (time # ${countRef.current})`)
//     countRef.current++

//     const list = touchList(queryClient)
//     if (list.length > 0) {
//       mutate(touchList(queryClient))
//     }
//   },
//   4000
// )

export function CatalogAutosaver() {
  const countRef = useRef(1)
  const { data } = useCatalogQuery()

  const queryClient = useQueryClient()
  const {mutate } = useContext(CatalogMutationContext)

  const [debouncedSave] = useState(() => debounce(
    `Catalog autosaver`,
    (queryClient, mutate, countRef) => {
      console.log(`♻️ Autosaver triggered (time # ${countRef.current})`)
      countRef.current++
  
      const list = touchList(queryClient)
      if (list.length > 0) {
        mutate(touchList(queryClient))
      }
    },
    4000
  ))

  useEffect(() => {
    debouncedSave(queryClient, mutate, countRef)
  }, [data, queryClient, mutate])

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

  return (<>
  <CatalogAutosaver />
    <Box>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '0.25rem 1rem',
        }}
      >
        <Box sx={{}}>Touch list ({list.length}):</Box>
        <IconButton
          sx={{ marginLeft: 'auto' }}
          // onClick={() => bundleMutation.mutate(list)}
          disabled={list.length === 0}
        >
          {isMutating ? (
            <CircularProgress size="24px" color="inherit" />
          ) : (
            <SyncIcon />
          )}
        </IconButton>
      </div>
      <List>
        {list.map(e => (
          <ListItem key={e.calendar_id} disablePadding>
            {e.calendar_id}
          </ListItem>
        ))}
      </List>
    </Box>
    </>
  )
}
