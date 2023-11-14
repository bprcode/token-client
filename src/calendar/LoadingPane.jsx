import { Alert, AlertTitle, Box, Button, CircularProgress } from '@mui/material'
import { useTheme } from '@emotion/react'

function LoadingPane({ query }) {
  const theme = useTheme()

  if (query.isPending) {
    return (
      <Box
        sx={{
          boxShadow: '0 0 1rem inset ' + theme.palette.primary.main + '22',
          height: '100%',
          display: 'grid',
          placeContent: 'center',
        }}
      >
        <CircularProgress />
      </Box>
    )
  }
  if (query.error) {
    return (
      <Box
        sx={{
          boxShadow: '0 0 1rem inset ' + theme.palette.primary.main + '22',
          height: '100%',
          display: 'grid',
          placeContent: 'center',
        }}
      >
        <Alert
          severity="error"
          sx={{
            border: '1px solid ' + theme.palette.error.main + '22',
          }}
          action={
            <Button sx={{ mt: 'auto' }} onClick={query.refetch}>
              Retry
            </Button>
          }
        >
          <AlertTitle>Error</AlertTitle>
          {query.error.message}
        </Alert>
      </Box>
    )
  }
}
export function useLoadingPane(query) {
  if (query.isPending || query.error) return <LoadingPane query={query} />
  return false
}
