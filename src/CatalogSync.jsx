import SyncIcon from '@mui/icons-material/Sync'
import { Box, IconButton, List, ListItem } from '@mui/material'
import { useCatalogQuery } from './calendar/routes/Catalog'

function useTouchList() {
  const catalog = useCatalogQuery()
  const list = []

  for (const c of catalog.data || []) {
    if (c.unsaved) {
      list.push(c)
    }
  }

  return list
}

export function CatalogSync() {
  const list = useTouchList()

  return (
    <Box sx={{ backgroundColor: '#420' }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Box sx={{}}>Touch list ({list.length}):</Box>
        <IconButton
          sx={{ marginLeft: 'auto' }}
          onClick={() => console.log('placeholder sync')}
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
