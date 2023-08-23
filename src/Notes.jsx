import { useState, useEffect, useRef } from 'react'
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
  Grid,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
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

function createRequest({ key, title, content, uid }) {
  return {
    resource: import.meta.env.VITE_BACKEND + `users/${uid}/notebook`,
    method: 'POST',
    body: JSON.stringify({ key, title, content }),
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
    credentials: 'include',
  }
}

function deleteRequest(nid) {
  return {
    resource: import.meta.env.VITE_BACKEND + `notes/${nid}`,
    method: 'DELETE',
    credentials: 'include',
  }
}

export default function NotebookRoot({ uid, name, email }) {
  const queryClient = useQueryClient()
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

  const { mutate: deleteNote } = useMutation({
    mutationFn: wrapFetch(deleteRequest),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(['note list', uid], list =>
        list.filter(entry => entry.note_id !== variables)
      )
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['note list', uid] })
    },
    retry: 2,
  })

  const noteList = listQuery.data || []

  useEffect(() => {
    log('🌻 ', (Math.random() * 100).toFixed(0) + ' listQuery.data updated')
    if (listQuery.data && !listQuery.data.error) {
      sessionStorage['noteList-' + uid] = JSON.stringify(listQuery.data)
    }
  }, [uid, listQuery.data])

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
              uid={uid}
              notes={noteList}
              onExpand={id => {
                setMode('edit note')
                setActiveNote(id)
                setLoadingTitle(noteList.find(n => n.note_id === id).title)
              }}
              onDelete={deleteNote}
              onNew={async data => {
                await queryClient.cancelQueries({
                  queryKey: ['note list', uid],
                })
                if (noteList.some(n => n.note_id === data.note_id)) {
                  return log('🌸 Already had note in list.')
                }
                queryClient.setQueryData(['note list', uid], list => [
                  ...list,
                  data,
                ])
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

function Notebook({ uid, notes, onExpand, onNew, onDelete }) {
  const queryClient = useQueryClient()
  const wrapFetch = useWrapFetch()
  const createMutation = useMutation({
    mutationFn: wrapFetch(data => {
      log('check: using idem key: ', data)
      return createRequest({
        uid,
        key: data,
        title: 'New note',
        content: '',
      })
    }),
    onSuccess: data => {
      log('Mutation outcome: ', data)
      sessionStorage.idempotentKey = crypto.randomUUID()
      onNew(data)
    },
    retry: 2,
  })

  const list = notes.map(item => {
    const stored = JSON.parse(sessionStorage['note-' + item.note_id] || '{}')
    return (
      <Grid item key={item.note_id}>
        <NoteSummary
          title={stored.title || item.title}
          summary={stored.content ? <em>Unsaved draft</em> : item.summary}
          deleting={item.deleting}
          onExpand={() => onExpand(item.note_id)}
          onDelete={() => {
            log('deleting ', item.note_id)
            onDelete(item.note_id)
            queryClient.setQueryData(['note list', uid], data =>
              data.map(n =>
                n.note_id !== item.note_id
                  ? n
                  : { ...n, title: 'Deleting...', deleting: true }
              )
            )
          }}
          draft={!!sessionStorage['note-' + item.note_id]}
        />
      </Grid>
    )
  })

    list.push(
      <Grid item key={'create'}>
        <NoteCreationCard
          disabled={createMutation.isLoading}
          onCreate={() => {
            createMutation.mutate(sessionStorage.idempotentKey)
          }}
        />
      </Grid>
    )

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
      {list.length ? (
        <Grid container spacing={4}>
          {list}
        </Grid>
      ) : (
        <>No notes yet.</>
      )}
    </Card>
  )
}

function NoteCreationCard({ onCreate, disabled }) {
  const theme = useTheme()
  const accent = disabled
    ? theme.palette.primary.dark
    : theme.palette.primary.main
  const opacity = disabled ? 0.2 : 1.0
  const styles = { width: '100px', height: '100px', opacity }
  const icon = disabled ? (
    <div
      style={{
        width: '100px',
        height: '100px',
        display: 'grid',
        placeItems: 'center',
      }}
    >
      <CircularProgress />
    </div>
  ) : (
    <AddCircleOutlineIcon sx={styles} />
  )

  return (
    <Card
      sx={{ width: 240, height: 300, borderLeft: `4px solid ${accent}` }}
      elevation={4}
    >
      <CardActionArea
        disabled={disabled}
        onClick={onCreate}
        sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      >
        {icon}
        <CardContent>
          <Typography variant="h6" sx={{ mb: '1rem', opacity }}>
            {disabled ? 'Creating...' : 'New note'}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  )
}

function NoteSummary({ title, summary, deleting, draft, onExpand, onDelete }) {
  const theme = useTheme()
  let accent = draft ? theme.palette.warning.main : theme.palette.primary.main
  if (deleting) accent = theme.palette.primary.dark
  return (
    <Card
      sx={{
        width: 240,
        height: 300,
        borderLeft: `4px solid ${accent}`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        opacity: deleting ? 0.2 : 1.0,
        transition: 'opacity 0.5s ease-out',
      }}
      elevation={4}
    >
      <CardActionArea onClick={onExpand} disabled={deleting}>
        <CardMedia component="img" height="100" image={calendarPhoto} alt="" />
        <CardContent>
          <Typography
            variant="h6"
            sx={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {title}
          </Typography>
          {summary}
        </CardContent>
      </CardActionArea>
      {!deleting && (
        <CardActions>
          <Button size="small" onClick={onExpand} sx={{ color: accent }}>
            {draft ? 'Unsaved' : 'Expand'}
          </Button>
          <Box ml="auto">
            <IconButton aria-label="Delete" onClick={onDelete}>
              <DeleteIcon sx={{ color: accent }} />
            </IconButton>
          </Box>
        </CardActions>
      )}
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

  const saveMutation = useMutation({
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

      if (result.title === title && result.content === content) {
        log('✅ saved record matches current state')
        sessionStorage.removeItem('note-' + id)
        setUnsaved(false)
      } else {
        log('⚠️ but saved record is behind current version')
      }

      queryClient.setQueryData(['note', id], result)
      setLastSaved(new Date().toLocaleTimeString())
      queryClient.invalidateQueries(['note list'])
    },
    onError: result => {
      log('😢 Mutation failed: ', result)
    },
    retry: 2,
  })

  const mutate = saveMutation.mutate

  useEffect(() => {
    log('draft-check mutation triggered')
    if (sessionStorage['note-' + id]) {
      log('Sending stored draft...')
      mutate({ note_id: id, title: initialTitle, content: initialContent })
    }
  }, [mutate, id, initialTitle, initialContent])

  const debounceUpdate = debounce(
    'put',
    changes => {
      mutate({ note_id: id, ...changes })
    },
    3000
  )

  function storeEdits({ title, content }) {
    sessionStorage['note-' + id] = JSON.stringify({ title, content })
  }

  let statusColor = 'success.main'
  if (unsaved) statusColor = 'warning.main'
  if (failure) statusColor = 'error.main'

  let statusText = 'Saved'
  if (unsaved) statusText = 'Unsaved'
  if (saveMutation.isLoading) statusText = 'Autosaving...'

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
        <Typography variant="caption" color={statusColor}>
          {statusText}
        </Typography>
        <Typography variant="caption">
          {lastSaved &&
            !saveMutation.isLoading &&
            (unsaved ? (
              <>&nbsp;since {lastSaved}</>
            ) : (
              <>&nbsp;at: {lastSaved}</>
            ))}
        </Typography>
      </Box>
    </Stack>
  )
}
