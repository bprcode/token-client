import { Box } from '@mui/material'
import { CatalogSyncMonitor } from './CatalogSync'
import { EventSyncMonitor } from './EventSync'
import { useHeartbeatQuery } from './HeartbeatPanel'
import { useCacheList } from './cacheTracker'
import { useMobileBarCheck, useNarrowCheck } from './LayoutContext'
import { useSearchParams } from 'react-router-dom'
import log from '../log'

export default function SyncMonitor() {
  const isNarrow = useNarrowCheck()
  const needMobileBar = useMobileBarCheck()
  const { data: heartbeat } = useHeartbeatQuery()
  const cacheList = useCacheList()

  const [searchParams] = useSearchParams()
  if (searchParams.get('a') === 'register') {
    log('%cbypassing SyncMonitor', 'color:magenta')
    return <></>
  }

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
          {cacheList.map(c =>
            c !== 'demo-calendar' ? <EventSyncMonitor key={c} id={c} /> : null
          )}
        </>
      )}
    </Box>
  )
}
