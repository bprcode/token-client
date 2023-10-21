import {
  Container,
  Card,
  CardContent,
  Typography,
  CardActions,
  Button,
} from '@mui/material'
import { useNavigate, useRouteError } from 'react-router-dom'

export default function RouterError() {
  const navigate = useNavigate()
  const error = useRouteError()
  console.error(error)

  return (
    <Container maxWidth="sm">
      <Card variant="outlined" sx={{ mt: 6 }}>
        <Typography variant="h5" sx={{ backgroundColor: '#f205', p: '0.5rem' }}>
          Unable to resolve request
        </Typography>
        <CardContent>
          <p>An error has occurred: </p>
          <div
            style={{
              backgroundColor: '#111',
              padding: '0.5rem',
              borderRadius: '4px',
              wordWrap: 'break-word',
              fontFamily: 'monospace',
            }}
          >
            {error.statusText || error.message}
          </div>
        </CardContent>
        <CardActions>
          <Button onClick={() => navigate(-1)}>Back</Button>
        </CardActions>
      </Card>
    </Container>
  )
}
