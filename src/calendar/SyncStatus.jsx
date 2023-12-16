import { Box } from '@mui/material'
import { CatalogSyncStatus } from '../CatalogSync'
import { EventSyncStatus } from './EventSync'
import { useHeartbeatQuery } from '../HeartbeatPanel'

export default function SyncStatus() {
  const { data: heartbeat } = useHeartbeatQuery()

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
      {heartbeat && (
        <>
          <CatalogSyncStatus />
          <EventSyncStatus />
        </>
      )}
    </Box>
  )
}
