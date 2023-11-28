import { Box } from '@mui/material'
import { CatalogSyncStatus } from '../CatalogSync'

export default function SyncStatus() {
  return (
    <Box
      sx={{
        zIndex: 4,
        backgroundColor: '#520',
        position: 'absolute',
        right: 0,
        bottom: 0,
        width: '20ch',
      }}
    >
      <CatalogSyncStatus />
    </Box>
  )
}
