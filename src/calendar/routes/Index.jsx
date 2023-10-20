import { Box, Stack } from '@mui/material'
import { ViewHeader } from '../ViewHeader'

export default function Index() {
  return (
    <Stack
      direction="column"
      sx={{
        mx: 'auto',
        width: '100%',
        height: '100%',
        overflowY: 'auto',
      }}
    >
      <ViewHeader>Header for index</ViewHeader>
      <Box sx={{ p: 3 }}>Body for index</Box>
    </Stack>
  )
}
