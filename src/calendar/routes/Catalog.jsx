import SyncIcon from '@mui/icons-material/Sync'
import SyncDisabledIcon from '@mui/icons-material/SyncDisabled'
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
import { leadingDebounce, bounceEarly } from '../../debounce.mjs'

function makeCatalogQuery(queryClient) {
  makeCatalogQuery.query ??= {
    queryKey: ['catalog'],
    queryFn: () => {
      console.log('🦕 catalog queryFn called')
      return goFetch('calendars', {
        credentials: 'include',
      }).then(fetched => {
        const local = queryClient.getQueryData(['catalog']) ?? []
        return reconcile({
          localData: local,
          serverData: fetched,
          key: 'calendar_id',
        })
      })
    },
  }
  return makeCatalogQuery.query
}

// debug -- still needs testing
function reconcile({ localData, serverData, key }) {
  const chillTime = 60 * 1000
  const merged = []
  const serverMap = new Map(serverData.map(data => [data[key], data]))
  const localMap = new Map(localData.map(data => [data[key], data]))

  console.log('mapified local:', localMap)
  console.log('mapified server:', serverMap)

  const now = Date.now()

  for (const local of localData) {
    if (local.etag === 'nascent') {
      console.log('Passing along nascent event', local[key], '🌿')
      merged.push(local)

      continue
    }

    if (local.unsaved && now - local.unsaved < chillTime) {
      console.log('treating', local[key], 'as hot 🔥. Insisting...')

      // Could be missing if it has been deleted remotely during local update:
      const updatedEtag = serverMap.get(local[key])?.etag || 'nascent'
      merged.push({
        ...local,
        etag: updatedEtag,
      })

      continue
    }

    const pre = 'treating ' + local[key] + ' as cold 🧊'

    if (!serverMap.has(local[key])) {
      console.log(pre, '...appears to have been remote-deleted ✖️')

      continue
    }

    const remote = serverMap.get(local[key])

    if (local.etag === remote.etag) {
      console.log(pre, `...etag matches (${local.etag}). Keeping local copy.`)
      merged.push(local)

      continue
    }

    console.log(
      pre,
      `...etag mismatch (${local.etag} / ${remote.etag}). ` +
        `Yielding to server copy.`
    )
    merged.push(remote)
  }

  for (const remote of serverData) {
    if (!localMap.has(remote[key])) {
      console.log('local state was missing ', remote[key], ' -- adding.')
      merged.push(remote)
    }
  }

  return merged
}

// debug -- can probably choose await or not here?
export const loader =
  queryClient =>
  ({ request, params }) => {
    queryClient
      .fetchQuery(makeCatalogQuery(queryClient))
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
        gridAutoRows: '300px',
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
  const queryClient = useQueryClient()
  const [idemKey, setIdemKey] = useState(randomIdemKey)
  const [disabled, setDisabled] = useState(false)

  function randomIdemKey() {
    return String(Math.floor(Math.random() * 1e9))
  }

  console.log('idemKey=', idemKey)

  const creationMutation = useMutation({
    onMutate: () => {
      const temporary = {
        summary: 'Temporary Calendar',
        etag: 'nascent',
        calendar_id: idemKey,
      }

      queryClient.setQueryData(['catalog'], catalog => [...catalog, temporary])

      const newKey = randomIdemKey()
      console.log('setting new idem key to ', newKey)
      setIdemKey(newKey)

      return { temporaryId: idemKey }
    },
    mutationFn: () =>
        goFetch('calendars', {
        method: 'POST',
        body: {
          key: idemKey,
        },
      }),
    onSuccess: (data, _variables, context) => {
      console.log(
        'creation returned data: ',
        data,
        ' - using context:',
        context
      )
      // Take only the server fields from the returned event
      // -- retain any pending edits
      queryClient.setQueryData(['catalog'], catalog =>
        catalog.map(c =>
          c.calendar_id === context.temporaryId
            ? {
                ...c,
                etag: data.etag,
                created: data.created,
                updated: data.updated,
                calendar_id: data.calendar_id,
              }
            : c
        )
      )
    },
  })

  return (
    <CardOuter>
      <CardActionArea
        disabled={disabled}
        onClick={() => {
          setDisabled(true)
          setTimeout(() => setDisabled(false), 500)

          creationMutation.mutate()
        }}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1,
          opacity: disabled ? 0.3 : 1.0,
        }}
      >
        <AddCircleOutlineIcon sx={{ width: '80px', height: '80px' }} />
        <Typography variant="subtitle1">New Calendar</Typography>
      </CardActionArea>
    </CardOuter>
  )
}

function CalendarCard({ calendar, children }) {
  const theme = useTheme()
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const isNascent = calendar.etag === 'nascent'
  const inputRef = useRef(null)

  const updateRef = useRef(null)

  const updateMutation = useMutation({
    onMutate: variables => {
      // Compose the PUT request. Mutate the variables object,
      // so these changes are available to mutationFn:
      Object.assign(variables, { ...calendar, ...variables })

      console.log('Composed mutation variables: ', variables)

      variables.controller = new AbortController()

      // updateRef.current = "old" controller
      updateRef.current?.abort()
      updateRef.current = variables.controller

      return {
        unsaved: calendar.unsaved,
        etag: calendar.etag,
      }
    },
    mutationFn: variables => {
      return goFetch(variables._endpoint ?? `timeout`, {
        signal: variables.controller.signal,
        timeout: 4000,
        method: 'PUT',
        body: {
          ...variables,
          controller: undefined,
          _endpoint: undefined,
          unsaved: undefined,
        },
      })
    },
    onSuccess: (data, variables, context) => {
      if (variables.controller.signal.aborted) {
        console.log('🪭 success. Signal was aborted.')
        return
      }
      console.log(
        `🥂 update success (${variables.calendar_id}) - ` +
          `context etag was ${context.etag}, timestamp = ${context.unsaved}`
      )

      if (context.etag !== calendar.etag) {
        console.log(`🗑️ Outdated etag on mutation result. Discarding.`)
        return
      }

      // Where do I actually get the result of the mutation?
      console.log('Mutation result data was: ', data[0])

      let resolution = {}
      console.log(
        `context unsaved = ${context.unsaved}, calendar unsaved = ${calendar.unsaved}`
      )
      if (context.unsaved === calendar.unsaved) {
        console.log('Timestamp match. Accepting return value.')
        resolution = data[0]
      } else {
        console.log('Timestamp mismatch. Only accepting returned etag.')
        resolution = {
          ...calendar,
          etag: data[0].etag,
        }
      }

      queryClient.setQueryData(['catalog'], data =>
        data.map(c => (c.calendar_id !== calendar.calendar_id ? c : resolution))
      )
    },
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
        component={isEditing || isNascent ? 'div' : Link}
        to={'/calendars/' + calendar.calendar_id}
        sx={{
          color: 'inherit',
          textDecoration: 'none',
          bgcolor: alpha(theme.palette.primary.dark, 0.3),
          '&:hover': {
            bgcolor: !isNascent && alpha(theme.palette.primary.dark, 0.7),
          },
        }}
      >
        <Box
          sx={{
            height: '4rem',

            px: isEditing ? 0 : '12px',
            pt: isEditing ? 0 : '25px',
          }}
        >
          {true && !isEditing ? (
            <Box
              sx={{
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
              }}
            >
              {calendar.summary}
            </Box>
          ) : (
            <TextField
              variant="filled"
              key={calendar.calendar_id + isEditing}
              inputRef={inputRef}
              defaultValue={calendar.summary || 'Untitled'}
              onClick={e => {
                if (isEditing) {
                  e.preventDefault()
                  console.log('TextField preventDefault')
                }
              }}
              onChange={leadingDebounce(
                `summary update ${calendar.calendar_id}`,
                e => {
                  console.log('⚽ debounce landed')
                  queryClient.setQueryData(['catalog'], data =>
                    data.map(c =>
                      c.calendar_id === calendar.calendar_id
                        ? {
                            ...c,
                            summary: e.target.value,
                            unsaved: Date.now(),
                          }
                        : c
                    )
                  )
                },
                350
              )}
              onBlur={e => {
                bounceEarly(`summary update ${calendar.calendar_id}`)
                // updateMutation.mutate({
                //   summary: e.target.value,
                // })
                setIsEditing(false)
              }}
            />
          )}
        </Box>
      </Box>
      <CardContent sx={{ flexGrow: 1, width: '100%' }}>{children}</CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'end' }}>
        <IconButton
          disabled={isNascent}
          onClick={() =>
            updateMutation.mutate({
              summary: calendar.summary,
              _endpoint: `calendars/${calendar.calendar_id}`,
            })
          }
        >
          <SyncIcon />
        </IconButton>
        <IconButton
          disabled={isNascent}
          onClick={() =>
            updateMutation.mutate({
              summary: calendar.summary,
              _endpoint: 'timeout',
            })
          }
        >
          <SyncDisabledIcon />
        </IconButton>
      </Box>
      <CardActions>
        <Button
          disabled={isNascent}
          component={Link}
          to={`/calendars/${calendar.id}`}
        >
          Open
        </Button>

        <Box ml="auto">
          <IconButton
            disabled={isNascent}
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

export function useCatalogQuery() {
  const queryClient = useQueryClient()
  return useQuery(makeCatalogQuery(queryClient))
}

export function Catalog() {
  const catalog = useCatalogQuery()
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

  let emptyPadding = []
  if (catalog.data?.length < 3) {
    emptyPadding = new Array(3 - catalog.data.length)
      .fill(null)
      .map((_, i) => <CardOuter key={i} sx={{ opacity: 0 }} />)
  }

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
            </Typography>
            <Typography variant="body2">
              {c.unsaved && (
                <>
                  <span style={{ color: '#88f' }}>Unsaved: {c.unsaved}</span>
                  <br />
                </>
              )}
            </Typography>
          </CalendarCard>
        ))}
        <CreationCard />
        {emptyPadding}
      </CatalogGrid>
    </ViewContainer>
  )
}
