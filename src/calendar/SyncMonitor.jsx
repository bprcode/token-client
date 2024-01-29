import { Box } from '@mui/material'
import { CatalogSyncMonitor } from '../CatalogSync'
import { EventSyncMonitor } from './EventSync'
import { useHeartbeatQuery } from '../HeartbeatPanel'
import { useCacheList } from './cacheTracker.mjs'
import { useMobileBarCheck, useNarrowCheck } from './LayoutContext.mjs'

export default function SyncMonitor() {
  const isNarrow = useNarrowCheck()
  const needMobileBar = useMobileBarCheck()
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
        mb: needMobileBar ? '3.5rem' : undefined,
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
