import { Alert, Container, Button } from '@mui/material'

export function LoadingError({ show, onRetry, message }) {
  if (!show) {
    return
  }

  return (
    <Container maxWidth="sm">
      <Alert
        severity="error"
        sx={{ mt: 4 }}
        action={
          <Button onClick={onRetry} sx={{ ml: 2, mt: -0.5 }}>
            Retry
          </Button>
        }
      >
        <span>{message || 'Failed to load. Please try again later.'}</span>
      </Alert>
    </Container>
  )
}
