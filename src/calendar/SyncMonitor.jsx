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
          {/* <div>
            <div>Cache List:</div>
            {cacheList.map(c=><div key={c}>{c}</div>)}
          </div> */}
          <CatalogSyncMonitor />
          {cacheList.map(c => (
            c !== 'demo-calendar' ?
            <EventSyncMonitor key={c} id={c} />
            : null
          ))}
        </>
      )}
    </Box>
  )
}
