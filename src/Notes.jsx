import { useState } from 'react'
import {
  Box,
  Backdrop,
  Stack,
  Button,
  Card,
  CardContent,
  CardActions,
  CardMedia,
  Typography,
  Paper,
  TextField,
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
import { fetchTimeout } from './fetchTimeout.mjs'
import { LoadingError } from './LoadingError'

function fetchNoteList(uid) {
  return fetchTimeout(
    import.meta.env.VITE_BACKEND + `users/${uid}/notebook`
  ).then(result => result.json())
}

function fetchNote(id) {
  return fetchTimeout(import.meta.env.VITE_BACKEND + `notes/${id}`).then(
    result => result.json()
  )
}

export default function NotebookRoot({ uid, name, email }) {
  const [mode, setMode] = useState('note list')
  const [activeNote, setActiveNote] = useState('')

  const listQuery = useQuery({
    retry: 0,
    queryKey: ['note list', uid],
    queryFn: async () => fetchNoteList(uid),
  })

  const noteList = listQuery.data || []

  let content = <></>

  switch (mode) {
    case 'edit note':
      content = (
        <ExpandedNote id={activeNote} onReturn={() => setMode('note list')} />
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
        show={listQuery.status === 'error' && !listQuery.data}
        onRetry={listQuery.refetch}
      />

      {content}
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

  if (list.length === 0) {
    list = <>No notes yet.</>
  }

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

function ExpandedNote({ id, onReturn }) {
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')

  const noteQuery = useQuery({
    retry: 0,
    queryKey: ['note', id],
    queryFn: async () => fetchNote(id),
  })

  const noteData = noteQuery.data

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
  if (
    noteQuery.status === 'success' ||
    (noteQuery.status === 'error' && noteQuery.data)
  ) {
    body = (
      <Stack spacing={4}>
        <TextField
          label="Title"
          sx={{ width: '100%' }}
          value={id}
          defaultValue=" "
          onChange={e => setTitle(e.target.value)}
        />
        <TextField
          sx={{ width: '100%' }}
          minRows={5}
          maxRows={15}
          // value={text}
          defaultValue=" "
          label="Content"
          onChange={e => setText(e.target.value)}
          id="outlined-textarea"
          multiline
        />
      </Stack>
    )
  } else if (noteQuery.status === 'error') {
    body = <LoadingError show={true} onRetry={noteQuery.refetch} />
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

        <Box minHeight={100} width="min(90%,80ch)">
          <Typography variant="body">{body}</Typography>
        </Box>
      </Paper>
      <Button onClick={onReturn} sx={{ mt: 4 }}>
        Back to List
      </Button>
    </Card>
  )
}
