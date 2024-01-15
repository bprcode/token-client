import { Stack } from '@mui/material'

export function ViewContainer({ children }) {
  return (
    <Stack
      direction="column"
      className="view-container"
      sx={{
        height: '100%',
        overflowY: 'auto',
      }}
    >
      {children}
    </Stack>
  )
}
