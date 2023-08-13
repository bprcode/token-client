import { useState } from 'react'
import {
  Box,
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
  Paper,
  useTheme,
  IconButton,
  CardActionArea,
  Skeleton,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
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

function fetchNote(id) {
  return fetch(import.meta.env.VITE_BACKEND + `notes/${id}`).then(result =>
    result.json()
  )
}

export default function NotebookRoot({ uid, name, email }) {
  const [mode, setMode] = useState('note list')
  const [activeNote, setActiveNote] = useState('')

  const listQuery = useQuery({
    queryKey: ['note list', uid],
    queryFn: async () => fetchNoteList(uid),
  })

  const noteList = listQuery.data || []

  let content = <></>

  switch (mode) {
    case 'edit note':
      content = (
        <ExpandedNode id={activeNote} onReturn={() => setMode('note list')}>
          Editing
        </ExpandedNode>
      )
      break
    default:
      content = (
        <Notebook
          notes={noteList}
          onExpand={id => {
            setMode('edit note')
            setActiveNote(id)
          }}
        />
      )
  }

  return (
    <>
      <Backdrop open={listQuery.status === 'loading'}>
        <CircularProgress />
      </Backdrop>
      <LoadingError
        show={listQuery.status === 'error'}
        onRetry={listQuery.refetch}
      />

      {content}

      <Typography variant="h6" color="primary">
        Query: {listQuery.status}
      </Typography>
    </>
  )
}

function Notebook({ notes, onExpand }) {
  let list = notes.map(item => (
    <NoteSummary
      {...item}
      key={item.note_id}
      onExpand={() => onExpand(item.note_id)}
    />
  ))

  if (list.length === 0) { list = <>No notes yet.</>}

  return (
    <Card
      elevation={0}
      sx={{
        mt: 6,
        p: 4,
      }}
    >
      <Typography variant="h4" mb={4}>
        My Notebook
      </Typography>
      <Stack direction="row" spacing={4}>
        {list}
      </Stack>
    </Card>
  )
}

function NoteSummary({ note_id, summary, onExpand }) {
  return (
    <Card sx={{ maxWidth: 250 }} elevation={4}>
      <CardActionArea onClick={onExpand}>
        <CardMedia component="img" height="100" image={calendarPhoto} alt="" />
        <CardContent>
          ID: {note_id}, summary: {summary}
        </CardContent>
      </CardActionArea>
      <CardActions>
        <Button size="small" onClick={onExpand}>
          Expand
        </Button>
        <Box ml="auto">
          <IconButton
            aria-label="Delete"
            onClick={() => console.log('Delete placeholder')}
          >
            <DeleteIcon color="primary" />
          </IconButton>
        </Box>
      </CardActions>
    </Card>
  )
}

function ExpandedNode({ id, onReturn }) {
  const noteQuery = useQuery({
    queryKey: ['note', id],
    queryFn: async () => fetchNote(id),
  })

  const noteData = noteQuery.data
  console.log('got note data:')
  console.log(noteData)

  let body = <></>

  if (noteQuery.status === 'loading') {
    body = (
      <>
        <Skeleton variant="text" width="50%" />
        <Skeleton variant="text" width="50%" />
        <Skeleton variant="text" width="40%" />
      </>
    )
  }
  if (noteQuery.status === 'success') {
    body = <>{noteData.content}</>
  }
  if (noteQuery.status === 'error') {
    body = (
      <Box maxWidth={410}>
        <Alert
          severity="error"
          sx={{ mt: 4 }}
          action={
            <Button onClick={noteQuery.refetch} sx={{ ml: 0, mt: -0.5 }}>
              Retry
            </Button>
          }
        >
          <span>Unable to load note. Please try again later.</span>
        </Alert>
      </Box>
    )
  }

  return (
    <Card
      elevation={0}
      sx={{
        mt: 6,
        px: 2,
        py: 2,
      }}
    >
      <Paper elevation={1} sx={{ p: 2 }}>
        <Typography variant="h4" mb={4}>
          Note #{id} -- {noteQuery.status}
        </Typography>
        <Box minHeight={100}>
          <Typography variant="body">{body}</Typography>
        </Box>
      </Paper>
      <Button onClick={onReturn} sx={{ mt: 4 }}>
        Back to List
      </Button>
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
