import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import ShareIcon from '@mui/icons-material/Share'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { goFetch } from '../../go-fetch'
import { useLoadingPane } from '../LoadingPane'
import { ViewContainer } from '../ViewContainer'
import { ViewHeader } from '../ViewHeader'
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardActions,
  CardContent,
  CircularProgress,
  IconButton,
  Skeleton,
  TextField,
  Typography,
  useTheme,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import dayjs from 'dayjs'
import { Link } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import debounce from '../../debounce.mjs'

const catalogQuery = {
  queryKey: ['catalog'],
  queryFn: () => {
    console.log('🦕 catalog queryFn called')
    return goFetch('calendars', {
      credentials: 'include',
    }).then(x => {
      console.log('🤷‍♂️ placeholder -- reconcile data here')
      return x
    })
  },
}

// debug -- can probably choose await or not here?
export const loader =
  queryClient =>
  ({ request, params }) => {
    queryClient
      .fetchQuery(catalogQuery)
      .catch(e => console.log('Catalog loader caught: ', e.message))
    return false

    // Don't do this. 👇 Makes direct URL navigation hang 10s+.
    // return queryClient.ensureQueryData(catalogQuery)
  }

function CardSkeleton({ sx }) {
  return (
    <Box sx={sx}>
      <Skeleton
        variant="rounded"
        height="2rem"
        animation="wave"
        sx={{ mb: 1 }}
      />

      <Skeleton
        variant="rounded"
        sx={{
          height: 'calc(100% - 3rem)',
        }}
      />
    </Box>
  )
}

function CatalogGrid({ children }) {
  return (
    <Box
      sx={{
        gridAutoFlow: 'row',
        display: 'grid',
        width: '100%',
        padding: 2,
        gap: 2,
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gridAutoRows: '240px',
      }}
    >
      {children}
    </Box>
  )
}

function CardOuter({ sx, children }) {
  return (
    <Card
      sx={{
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0.25rem 0.25rem 0.35rem #0006',
        ...sx,
      }}
    >
      {children}
    </Card>
  )
}

function CreationCard() {
  const theme = useTheme()
  const queryClient = useQueryClient()
  const [idemKey, setIdemKey] = useState(randomIdemKey)

  function randomIdemKey() {
    return String(Math.floor(Math.random() * 1e9))
  }

  console.log('idemKey=', idemKey)
  const creationMutation = useMutation({
    mutationFn: () =>
      goFetch('calendars', {
        method: 'POST',
        body: {
          key: idemKey,
        },
      }),
    onSuccess: data => {
      const newKey = randomIdemKey()
      console.log('setting new idem key to ', newKey)
      setIdemKey(newKey)
      console.log('creation returned data: ', data)
      queryClient.setQueryData(['catalog'], catalog => [...catalog, data])
    },
  })

  return (
    <CardOuter>
      <CardActionArea
        disabled={creationMutation.isPending}
        onClick={() => {
          console.log('Creation placeholder')
          creationMutation.mutate()
        }}
        sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}
      >
        {creationMutation.isPending ? (
          <CircularProgress />
        ) : (
          <>
            <AddCircleOutlineIcon sx={{ width: '80px', height: '80px' }} />
            <Typography variant="subtitle1">New Calendar</Typography>
          </>
        )}
      </CardActionArea>
    </CardOuter>
  )
}

function CalendarCard({ calendar, children }) {
  const theme = useTheme()
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const inputRef = useRef(null)

  const updateMutation = useMutation({
    mutationFn: updates => {
      const updated = { ...calendar, ...updates }

      // Show optimism
      const optimism = {
        ...updated,
        etag: 'temporary',
        // Clearing the 'revised' field presumes
        // that the change will be accepted.
        // It should be replaced if the fetch fails.
        revised: undefined,
      }
      queryClient.setQueryData(['catalog'], data =>
        data.map(x => (x.calendar_id !== calendar.calendar_id ? x : optimism))
      )
      // Request change
      return goFetch(`timeout`, {
      // return goFetch(`calendars/${calendar.calendar_id}`, {
        method: 'PUT',
        body: updated,
      })
    },
    onError: (_err, variables, _context) =>{
      console.log(
        'updateMutation error handler, responsibility for restoring ' +
          'revision tag goes here'
      )
      queryClient.setQueryData(['catalog'], data =>
          data.map(x => (x.calendar_id !== calendar.calendar_id ? x : {...x, revised: variables.revised}))
        )
    }
  })

  const deleteMutation = useMutation({
    mutationFn: () =>
      goFetch(`calendars/${calendar.calendar_id}`, {
        method: 'DELETE',
        body: { etag: calendar.etag },
      }),

    onSuccess: data => {
      if (data.length) {
        // Outcome certain: The event was definitely deleted from the server.
        console.log('deleted ', data)
        queryClient.setQueryData(['catalog'], data =>
          data.filter(c => c.calendar_id !== calendar.calendar_id)
        )
      } else {
        // Outcome unknown: May already be deleted, may have failed
        // due to remote update.
        queryClient.invalidateQueries(['catalog'])
        console.log('nothing deleted')
      }
    },
    onError: e => {
      console.log('Delete Error!', e.status, e.message)
    },
  })

  useEffect(() => {
    if (isEditing) inputRef.current?.focus()
  }, [isEditing])

  return (
    <CardOuter
      sx={{
        opacity: deleteMutation.isPending ? 0.3 : undefined,
      }}
    >
      <Box
        component={isEditing ? 'div' : Link}
        to={'/calendars/' + calendar.calendar_id}
        sx={{
          color: 'inherit',
          textDecoration: 'none',
          bgcolor: alpha(theme.palette.primary.dark, 0.3),
          '&:hover': {
            bgcolor: alpha(theme.palette.primary.dark, 0.7),
          },
        }}
      >
        {/* <Typography
          variant="h5"
          component="div"
          sx={{
            position: 'relative',
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
          }}
        >
          {title || 'Untitled'}
        </Typography> */}
        <TextField
          // Key is required to prevent browser retention of stale input value
          key={calendar.etag + (calendar.optimistic ? '-temporary' : '')}
          inputRef={inputRef}
          sx={{
            width: '100%',
          }}
          defaultValue={calendar.summary || 'Untitled'}
          inputProps={{ readOnly: !isEditing }}
          onClick={e => {
            if (isEditing) {
              e.preventDefault()
              console.log('TextField preventDefault')
            }
          }}
          onChange={
            debounce('summary update', e => {
              console.log('change: ', e.target.value)

              queryClient.setQueryData(['catalog'], data =>
                data.map(c =>
                  c.calendar_id !== calendar.calendar_id
                    ? c
                    : { ...c, summary: e.target.value, revised: Date.now() }
                )
              )
            })
          }
          onBlur={e => {
            console.log('☁️ text field blur / ', e.target.value)
            updateMutation.mutate({ summary: e.target.value, revised: calendar.revised })
            setIsEditing(false)
          }}
        />
      </Box>
      <CardContent sx={{ flexGrow: 1, width: '100%' }}>{children}</CardContent>
      <CardActions>
        <Button component={Link} to={`/calendars/${calendar.id}`}>
          Open
        </Button>

        <Box ml="auto">
          <IconButton
            aria-label="Share"
            onClick={() => console.log('share placeholder')}
          >
            <ShareIcon sx={{ opacity: 0.9 }} />
          </IconButton>
          <IconButton
            aria-label="Rename"
            onClick={() => {
              console.log('renaming...')
              setIsEditing(true)
            }}
          >
            <EditIcon sx={{ opacity: 0.9 }} />
          </IconButton>
          <IconButton
            aria-label="Delete"
            disabled={deleteMutation.isPending}
            onClick={deleteMutation.mutate}
          >
            <DeleteIcon sx={{ opacity: 0.9 }} />
          </IconButton>
        </Box>
      </CardActions>
    </CardOuter>
  )
}

export function Catalog() {
  const catalog = useQuery(catalogQuery)
  const loadingPane = useLoadingPane(catalog)

  const header = (
    <ViewHeader>
      <Typography variant="h6" component="span">
        My Calendars
      </Typography>
    </ViewHeader>
  )

  if (catalog.isPending || (catalog.isError && catalog.isFetching)) {
    return (
      <ViewContainer>
        {header}
        <CatalogGrid>
          <CardSkeleton sx={{ opacity: 0.8 }} />
          <CardSkeleton sx={{ opacity: 0.45 }} />
          <CardSkeleton sx={{ opacity: 0.225 }} />
          <CardSkeleton sx={{ opacity: 0.1 }} />
        </CatalogGrid>
      </ViewContainer>
    )
  }

  if (catalog.error)
    return (
      <ViewContainer>
        {header}
        {loadingPane}
      </ViewContainer>
    )

  const now = dayjs()

  return (
    <ViewContainer>
      {header}
      <CatalogGrid>
        {catalog.data?.map?.((c, i) => (
          <CalendarCard key={c.calendar_id} calendar={c}>
            <Typography variant="body2" sx={{ opacity: 0.5 }}>
              Created: {dayjs(c.created).from(now)}
              <br />
              Updated: {dayjs(c.updated).from(now)}
              <br />
              etag: {c.etag}
              <br />
              &ldquo;{c.summary}&rdquo;
              <br />
              {c.revised && (
                <span style={{ color: 'orange' }}>Revised: {c.revised}</span>
              )}
            </Typography>
          </CalendarCard>
        ))}
        <CreationCard />
      </CatalogGrid>
    </ViewContainer>
  )
}
