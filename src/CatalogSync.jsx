import SyncIcon from '@mui/icons-material/Sync'
import CircularProgress from '@mui/material/CircularProgress'
import { Box, Button, IconButton, List, ListItem } from '@mui/material'
import { useCatalogQuery } from './calendar/routes/Catalog'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { goFetch } from './go-fetch'
import { useRef } from 'react'

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

export function CatalogSync() {
  const queryClient = useQueryClient()
  const controllerRef = useRef(new AbortController())
  const controllerNumRef = useRef(0)
  const list = useTouchList()

  const itemMutation = useMutation({
    onMutate: variables => {
      console.log('Item mutation started / ', controllerNumRef.current)
      // Extend the variables object to expose the current abort signal
      variables.original = { ...variables }
      variables.signal = controllerRef.current.signal
    },
    mutationFn: variables => {
      console.log('Making request from record:', variables.original)
      return makeCalendarFetch(variables.original, variables.signal)
    },
    onSuccess: (data, variables) =>
      handleCalendarSuccess({
        result: data,
        original: variables.original,
        queryClient,
      }),
    onSettled: () => {
      console.log('Item mutation settled')
    },
  })

  const bundleMutation = useMutation({
    retry: 0,
    onMutate: () => {
      controllerRef.current.abort()
      controllerNumRef.current++
      controllerRef.current = new AbortController()

      console.log('🌒 About to start promise bundle')
    },
    mutationFn: variables =>
      Promise.all(
        // Important to clone the record, rather than passing it directly,
        // since the mutate method also modifies the variables it receives.
        variables.map(c => itemMutation.mutateAsync({ ...c }))
      ),
    onSettled: () => {
      console.log('☀️ Promise bundle finished')
    },
  })

  return (
    <Box sx={{ backgroundColor: '#420' }}>
      {bundleMutation.status} / {bundleMutation.error?.message} /{' '}
      {bundleMutation.data ? 'Data ✅' : 'No data ⭕'}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Box sx={{}}>Touch list ({list.length}):</Box>
        <IconButton
          sx={{ marginLeft: 'auto' }}
          onClick={() => bundleMutation.mutate(list)}
          disabled={list.length === 0}
        >
          {bundleMutation.isPending ? (
            <CircularProgress size="20px" color="inherit" />
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
      <Button variant="contained" onClick={() => controllerNumRef.current++}>
        +
      </Button>
    </Box>
  )
}
