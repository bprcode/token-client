import {
  Alert,
  Backdrop,
  Stack,
  Container,
  Button,
  Card,
  CardContent,
  CardActions,
  CardMedia,
  Typography,
  useTheme,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import CircularProgress from '@mui/material/CircularProgress'

import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
} from '@tanstack/react-query'

import calendarPhoto from './assets/notebook-unsplash.jpg'

function fetchNoteList(uid) {
  return fetch(import.meta.env.VITE_BACKEND + `users/${uid}/notebook`).then(
    result => result.json()
  )
}

export default function Notes({ uid, name, email }) {
  const noteQuery = useQuery({
    queryKey: ['noteList', uid],
    queryFn: async () => fetchNoteList(uid),
  })

  const noteList = noteQuery.data || []

  return (
    <>
      <Backdrop open={noteQuery.status === 'loading'}>
        <CircularProgress />
      </Backdrop>
      <LoadingError
        show={noteQuery.status === 'error'}
        onRetry={noteQuery.refetch}
      />

      <Notebook notes={noteList} />
      <Typography variant="h6" color="primary">
        Query: {noteQuery.status}
      </Typography>
    </>
  )
}

function Notebook({ notes }) {
  const theme = useTheme()

  return (
    <Card
      sx={{
        mt: 6,
        p: 4,
        backgroundColor: alpha(theme.palette.background.paper, 0.6),
        backdropFilter: 'blur(4px)',
      }}
    >
      <Typography variant="h4" mb={4}>
        My Notebook
      </Typography>
      <Stack direction="row" spacing={4}>
        {notes.map(item => (
          <Note {...item} key={item.note_id} />
        ))}
      </Stack>
    </Card>
  )
}

function Note({ note_id, summary }) {
  return (
    <Card sx={{ maxWidth: 250 }}>
      <CardMedia component="img" height="100" image={calendarPhoto} alt="" />
      <CardContent>
        ID: {note_id}, summary: {summary}
      </CardContent>
      <CardActions>
        <Button size="small">Expand</Button>
      </CardActions>
    </Card>
  )
}

function LoadingError({ show, onRetry }) {
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
        <span>Notebook failed to load. Please try again later.</span>
      </Alert>
    </Container>
  )
}
