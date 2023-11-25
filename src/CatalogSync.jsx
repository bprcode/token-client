import SyncIcon from '@mui/icons-material/Sync'
import CircularProgress from '@mui/material/CircularProgress'
import { Box, IconButton, List, ListItem } from '@mui/material'
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

export function CatalogSync() {
  const controllerRef = useRef(new AbortController())
  const controllerNumRef = useRef(0)
  const list = useTouchList()

  const itemMutation = useMutation({
    onMutate: variables => {
      console.log('Item mutation started / ', controllerNumRef.current)
      variables.num = controllerNumRef.current
      variables.signal = controllerRef.current.signal
    },
    mutationFn: variables => {
      console.log('sending item mutation with variables: ', variables)
      return goFetch(variables.endpoint, {signal: variables.signal})
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
      const endpoints = ['me', 'timeout', 'coinflip']

      return Promise.all(
        variables.map((c,i) => itemMutation.mutateAsync({
          id: c.calendar_id,
          endpoint: endpoints[i % endpoints.length],
        }
      )))

    },
    onSettled: () => {
      console.log('☀️ Promise bundle finished')
    }

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
          {bundleMutation.isPending ? 
          <CircularProgress size="20px" color="inherit" />
          :
          <SyncIcon />}
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
  )
}
