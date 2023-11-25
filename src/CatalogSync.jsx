import SyncIcon from '@mui/icons-material/Sync'
import { Box, IconButton, List, ListItem } from '@mui/material'
import { useCatalogQuery } from './calendar/routes/Catalog'
import { useMutation } from '@tanstack/react-query'
import { goFetch } from './go-fetch'

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

function SendRequests(requests) {}

export function CatalogSync() {
  const list = useTouchList()

  const testMutation = useMutation({
    mutationFn: variables => {
      console.log('sending test mutation with variables: ', variables)
      return goFetch(variables.endpoint)
    },
  })

  return (
    <Box sx={{ backgroundColor: '#420' }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Box sx={{}}>Touch list ({list.length}):</Box>
        <IconButton
          sx={{ marginLeft: 'auto' }}
          onClick={() => {
            for (const [i, c] of list.entries()) {
              testMutation.mutate({
                id: c.calendar_id,
                endpoint: i % 2 ? 'timeout' : 'unfound',
              })
            }
          }}
          disabled={list.length === 0}
        >
          <SyncIcon />
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
