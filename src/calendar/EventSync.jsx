import UploadIcon from '@mui/icons-material/Upload'
import { IconButton, Typography } from '@mui/material'

export function EventSyncStatus() {
  return (
    <Typography variant="subtitle2" color={'info.main'}>
      Event sync placeholder
      <IconButton onClick={() => console.log('upload placeholder')}>
        <UploadIcon />
      </IconButton>
    </Typography>
  )
}
