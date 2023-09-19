import { Paper, Typography } from '@mui/material'

export function EventPicker() {
  return (
    <Paper
      elevation={2}
      sx={{
        height: '200px',
        width: '100%',
        boxShadow: '0 -0.5rem 2rem #0004',
        borderTop: '1px solid #fff2',
        p: 1,
      }}
    >
      <Typography variant="subtitle2">Add Event</Typography>
    </Paper>
  )
}
