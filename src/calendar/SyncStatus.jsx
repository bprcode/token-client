import { Box } from '@mui/material'
import { CatalogSyncMonitor } from '../CatalogSync'
import { EventSyncMonitor } from './EventSync'
import { useHeartbeatQuery } from '../HeartbeatPanel'
import { useCacheList } from './cacheTracker.mjs'
import { useNarrowCheck } from './LayoutContext.mjs'

export default function SyncStatus() {
  const isNarrow = useNarrowCheck()
  const { data: heartbeat } = useHeartbeatQuery()
  const cacheList = useCacheList()

  return (
    <Box
      sx={{
        pointerEvents: 'none',
        zIndex: 4,
        position: isNarrow ? 'fixed' : 'absolute',
        right: 0,
        bottom: 0,
        mb: isNarrow ? '4rem' : undefined,
      }}
    >
      {heartbeat && (
        <>
          <CatalogSyncMonitor />
          {cacheList.map(c => (
            <EventSyncMonitor key={c} id={c} />
          ))}
        </>
      )}
    </Box>
  )
}
