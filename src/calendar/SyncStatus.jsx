import { Box } from '@mui/material'
import { CatalogSyncStatus } from '../CatalogSync'
import { EventSyncStatus } from './EventSync'
import { useHeartbeatQuery } from '../HeartbeatPanel'
import { useCacheList } from './cacheTracker.mjs'

export default function SyncStatus() {
  const { data: heartbeat } = useHeartbeatQuery()
  const cacheList = useCacheList()
  console.log('cacheList was',cacheList)

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
          {cacheList.map(c => <EventSyncStatus key={c} id={c} />)}
        </>
      )}
    </Box>
  )
}
