import { Stack } from '@mui/material'

export function ViewContainer({ children, containOverflow = true }) {
  return (
    <Stack
      direction="column"
      className="view-container"
      sx={{
        height: containOverflow ? '100%' : undefined,
        overflowY: containOverflow ? 'auto' : undefined,
      }}
    >
      {children}
    </Stack>
  )
}
