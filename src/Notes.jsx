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
  IconButton,
  CardActionArea,
  Skeleton,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import CircularProgress from '@mui/material/CircularProgress'

import {
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import calendarPhoto from './assets/notebook-unsplash.jpg'
import { fetchTimeout } from './fetchTimeout.mjs'
import { LoadingError } from './LoadingError'
import debounce from './debounce.mjs'

const log = console.log.bind(console)

function fetchNoteList(uid) {
  return fetchTimeout(import.meta.env.VITE_BACKEND + `users/${uid}/notebook`, {
    credentials: 'include'
  }).then(result => result.json())
}

function fetchNote(id) {
  return fetchTimeout(import.meta.env.VITE_BACKEND + `notes/${id}`, {
    credentials: 'include'
  }).then(result => result.json())
}

function updateNote(data) {
  log('updating with data: ', JSON.stringify(data))

  return fetchTimeout(import.meta.env.VITE_BACKEND + `notes/${data.note_id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
    credentials: 'include'
  }).then(result => result.json())
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
        <ExpandedNote
          id={activeNote}
          onReturn={() => setMode('note list')}
        />
      )
      break
    default:
      content = (
        <>
          {noteList.error ? (
            noteList.error
          ) : (
            <Notebook
              notes={noteList}
              onExpand={id => {
                setMode('edit note')
                setActiveNote(id)
              }}
            />
          )}
        </>
      )
  }

  return (
    <>
      <Backdrop open={listQuery.status === 'loading'}>
        <CircularProgress />
      </Backdrop>
      <LoadingError
        show={listQuery.status !== 'loading' && !listQuery.data}
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

function NoteSummary({ note_id, title, summary, onExpand }) {
  return (
    <Card sx={{ width: 250 }} elevation={4}>
      <CardActionArea onClick={onExpand}>
        <CardMedia component="img" height="100" image={calendarPhoto} alt="" />
        <CardContent>
          <Typography variant="h6">{title}</Typography>
          summary: {summary}
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
  const queryClient = useQueryClient()

  const noteQuery = useQuery({
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

  if (noteData) {
    body = (
      <EditableContents
        initialTitle={noteData.title}
        initialContent={noteData.content}
      />
    )
  }

  if (noteData && noteData.error) {
    body = <>Permission error: {noteData.error}</>
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
          <LoadingError
            show={!noteData && noteQuery.status !== 'loading'}
            onRetry={noteQuery.refetch}
          />
        </Box>
      </Paper>
      <Button onClick={onReturn} sx={{ mt: 4 }}>
        Back to List
      </Button>
    </Card>
  )
}

function EditableContents({ initialTitle, initialContent }) {
  const [title, setTitle] = useState(initialTitle || '')
  const [content, setContent] = useState(initialContent || '')
  const [lastSaved, setLastSaved] = useState('')
  const [unsaved, setUnsaved] = useState(false)

  const [color, setColor] = useState(true)

  const debounced = debounce('put', (...stuff) => {
    console.log('Mock PUT: ', ...stuff)
    // ...await verified mutation, then:
    setLastSaved('Mock: ' + new Date().toLocaleTimeString())
    setUnsaved(false)
  })

  return (
    <Stack spacing={4}>
      <TextField
        label="Title"
        value={title}
        onChange={e => {
          setTitle(e.target.value)
          setUnsaved(true)
          debounced({ content, title: e.target.value })
        }}
        sx={{ width: '100%' }}
      />
      <TextField
        label="Content"
        value={content}
        onChange={e => {
          setContent(e.target.value)
          setUnsaved(true)
          debounced({ content: e.target.value, title })
        }}
        sx={{ width: '100%' }}
        minRows={5}
        maxRows={15}
        // onChange={e =>
        //   mutation.mutate({ ...noteData, content: e.target.value })
        // }
        id="outlined-textarea"
        multiline
      />
      <Box sx={{ display: 'flex', justifyContent: 'end' }}>
        <Typography variant="caption" color={unsaved ? "warning.main" : 'success.main'}>
          {unsaved ? 'Unsaved' : 'Saved'}&nbsp;
        </Typography>
        <Typography variant="caption">
          {lastSaved && (unsaved ? 'since '+lastSaved : 'at: ' + lastSaved)}
        </Typography>
      </Box>
    </Stack>
  )
}
