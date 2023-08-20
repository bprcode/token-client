import { useState, useEffect, useCallback, useRef } from 'react'
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
  useTheme,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import CircularProgress from '@mui/material/CircularProgress'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import calendarPhoto from './assets/notebook-unsplash.jpg'
import { useWrapFetch } from './fetchTimeout.jsx'
import { LoadingError } from './LoadingError'
import debounce from './debounce.mjs'

const log = console.log.bind(console)

function noteListRequest(uid) {
  return {
    resource: import.meta.env.VITE_BACKEND + `users/${uid}/notebook`,
    credentials: 'include',
  }
}

function noteRequest(nid) {
  return {
    resource: import.meta.env.VITE_BACKEND + `notes/${nid}`,
    credentials: 'include',
  }
}

function updateRequest(replacement) {
  return {
    resource: import.meta.env.VITE_BACKEND + `notes/${replacement.note_id}`,
    method: 'PUT',
    body: JSON.stringify(replacement),
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
    credentials: 'include',
  }
}

export default function NotebookRoot({ uid, name, email }) {
  const wrapFetch = useWrapFetch()
  const [mode, setMode] = useState('note list')
  const [activeNote, setActiveNote] = useState('')
  const [loadingTitle, setLoadingTitle] = useState('')

  const listQuery = useQuery({
    queryKey: ['note list', uid],
    queryFn: wrapFetch(noteListRequest(uid)),
    staleTime: 30 * 1000,
    placeholderData: () => {
      if (sessionStorage['noteList-' + uid]) {
        return JSON.parse(sessionStorage['noteList-' + uid])
      }
    },
  })

  useEffect(() => {
    log('🌻 ', (Math.random() * 100).toFixed(0) + ' listQuery.data updated')
    if (listQuery.data) {
      sessionStorage['noteList-' + uid] = JSON.stringify(listQuery.data)
    }
  }, [uid, listQuery.data])

  const noteList = listQuery.data || []
  let content = <></>

  switch (mode) {
    case 'edit note':
      content = (
        <ExpandedNote
          id={activeNote}
          title={loadingTitle}
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
                setLoadingTitle(noteList.find(n => n.note_id === id).title)
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
  let list = notes.map(item => {
    const stored = JSON.parse(sessionStorage['note-' + item.note_id] || '{}')
    return (
      <NoteSummary
        title={stored.title || item.title}
        summary={stored.content ? <em>Unsaved draft</em> : item.summary}
        key={item.note_id}
        onExpand={() => onExpand(item.note_id)}
        draft={!!sessionStorage['note-' + item.note_id]}
      />
    )
  })

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

function NoteSummary({ title, summary, onExpand, draft }) {
  const theme = useTheme()
  const accent = draft ? theme.palette.warning.main : theme.palette.primary.main
  return (
    <Card sx={{ width: 250, borderLeft: `4px solid ${accent}` }} elevation={4}>
      <CardActionArea onClick={onExpand}>
        <CardMedia component="img" height="100" image={calendarPhoto} alt="" />
        <CardContent>
          <Typography variant="h6">{title}</Typography>
          {summary}
        </CardContent>
      </CardActionArea>
      <CardActions>
        <Button size="small" onClick={onExpand} sx={{ color: accent }}>
          {draft ? 'Unsaved' : 'Expand'}
        </Button>
        <Box ml="auto">
          <IconButton
            aria-label="Delete"
            onClick={() => console.log('Delete placeholder')}
          >
            <DeleteIcon sx={{ color: accent }} />
          </IconButton>
        </Box>
      </CardActions>
    </Card>
  )
}

function ExpandedNote({ id, title, onReturn }) {
  // If session data was stored, give it priority over data from the server--
  // it represents unsaved work, and still needs to be submitted.
  const unsavedWork = sessionStorage['note-' + id]
    ? JSON.parse(sessionStorage['note-' + id])
    : undefined

  const wrapFetch = useWrapFetch()
  const noteQuery = useQuery({
    queryKey: ['note', id],
    queryFn: wrapFetch(noteRequest(id)),
    staleTime: 30 * 1000,
    initialData: unsavedWork,
    enabled: !unsavedWork,
  })

  const noteData = noteQuery.data

  let body = <></>

  if (noteQuery.status === 'loading') {
    body = (
      <Stack spacing={4}>
        <TextField
          disabled
          label="Title"
          value={title}
          sx={{ width: '100%' }}
        />
        <div>
          <Skeleton variant="text" width="70%" />
          <Skeleton variant="text" width="80%" />
          <Skeleton variant="text" width="60%" />
        </div>
      </Stack>
    )
  }

  if (noteData) {
    body = (
      <EditableContents
        id={id}
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
      <Paper elevation={1} sx={{ py: 2, px: 2 }}>
        <Typography variant="h4" mb={4}>
          Edit Note
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

function EditableContents({ id, initialTitle, initialContent }) {
  const titleRef = useRef(null)
  const queryClient = useQueryClient()
  const wrapFetch = useWrapFetch()
  const [title, setTitle] = useState(initialTitle || '')
  const [content, setContent] = useState(initialContent || '')
  const [lastSaved, setLastSaved] = useState('')
  const [unsaved, setUnsaved] = useState(!!sessionStorage['note-' + id])
  const [failure, setFailure] = useState(false)

  const { mutate } = useMutation({
    mutationFn: wrapFetch(updateRequest),
    onMutate: () => setFailure(false),
    onSuccess: result => {
      if (result.error) {
        log('🤒 Failed to save:', result.error)
        setFailure(true)
        queryClient.refetchQueries({ queryKey: ['heartbeat'] })
        return
      }

      log('😊 Mutation succeeded: ', result)

      sessionStorage.removeItem('note-' + id)
      queryClient.setQueryData(['note', id], result)
      queryClient.invalidateQueries(['note list'])
      setLastSaved(new Date().toLocaleTimeString())
      setUnsaved(false)
    },
    onError: result => {
      log('😢 Mutation failed: ', result)
    },
    retry: 2,
  })

  useEffect(() => {
    if (sessionStorage['note-' + id]) {
      log('Sending stored draft...')
      mutate({ note_id: id, title: initialTitle, content: initialContent })
    }
  }, [mutate, id, initialTitle, initialContent])

  const debounceUpdate = debounce('put', changes => {
    mutate({ note_id: id, ...changes })
  })

  function storeEdits({ title, content }) {
    sessionStorage['note-' + id] = JSON.stringify({ title, content })
  }

  return (
    <Stack spacing={4}>
      <TextField
        label="Title"
        value={title}
        onChange={e => {
          setUnsaved(true)
          setTitle(e.target.value)
          storeEdits({ title: e.target.value, content })
          debounceUpdate({ title: e.target.value, content })
        }}
        sx={{ width: '100%' }}
        inputRef={titleRef}
      />
      <TextField
        label="Content"
        value={content}
        onChange={e => {
          setUnsaved(true)
          setContent(e.target.value)
          storeEdits({ title, content: e.target.value })
          debounceUpdate({ title, content: e.target.value })
        }}
        sx={{ width: '100%' }}
        minRows={5}
        maxRows={15}
        id="outlined-textarea"
        multiline
      />
      <Box sx={{ display: 'flex', justifyContent: 'end' }}>
        <Typography
          variant="caption"
          color={
            failure ? 'error.main' : unsaved ? 'warning.main' : 'success.main'
          }
        >
          {unsaved ? 'Unsaved' : 'Saved'}&nbsp;
        </Typography>
        <Typography variant="caption">
          {lastSaved && (unsaved ? 'since ' + lastSaved : 'at: ' + lastSaved)}
        </Typography>
      </Box>
    </Stack>
  )
}
