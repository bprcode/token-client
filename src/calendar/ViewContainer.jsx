import { Stack } from '@mui/material'

export function ViewContainer({ children }) {
  return (
    <Stack
      direction="column"
      sx={{
        height: '100%',
        overflowY: 'auto',
      }}
    >
      {children}
    </Stack>
  )
}
