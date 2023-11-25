import SyncIcon from '@mui/icons-material/Sync'
import CircularProgress from '@mui/material/CircularProgress'
import { Box, Button, IconButton, List, ListItem } from '@mui/material'
import { useCatalogQuery } from './calendar/routes/Catalog'
import { useMutation } from '@tanstack/react-query'
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

function makeCalendarRequest(calendar, signal) {
  const endpoint = 'calendars'
  const timeout = 5000

  // Blank out fields not needed by the server
  const blanks = {
    unsaved: undefined,
    created: undefined,
    updated: undefined,
    originTag: undefined,
    primary_author_id: undefined,
  }

  if (calendar.isDeleting) {
    return goFetch(`${endpoint}/${calendar.calendar_id}`, {
      method: 'DELETE',
      body: { etag: calendar.etag },
      timeout,
      signal,
    })
  }

  if (calendar.etag === 'creating') {
    return goFetch(endpoint, {
      method: 'POST',
      body: { ...calendar, ...blanks, key: calendar.calendar_id },
      timeout,
      signal,
    })
  }

  return goFetch(`${endpoint}/${calendar.calendar_id}`, {
    method: 'PUT',
    body: { ...calendar, ...blanks },
    timeout,
    signal,
  })
}

export function CatalogSync() {
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
      return makeCalendarRequest(variables.original, variables.signal)
    },
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
    mutationFn: variables => {
      return Promise.all(variables.map(c => itemMutation.mutateAsync({...c})))
    },
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
