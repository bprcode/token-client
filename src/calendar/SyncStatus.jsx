import { Box } from '@mui/material'
import { CatalogSyncStatus } from '../CatalogSync'
import { EventSyncStatus } from './EventSync'

export default function SyncStatus() {

  return (
        <Box
          sx={{
            pointerEvents: 'none',
            zIndex: 4,
            position: 'absolute',
            right: 0,
            bottom: 0,
          }}
        >
          <CatalogSyncStatus />
          <EventSyncStatus />
        </Box>
  )
}
