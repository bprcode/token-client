import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import ShareIcon from '@mui/icons-material/Share'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import { useQuery, useQueryClient } from '@tanstack/react-query'
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
  IconButton,
  Skeleton,
  TextField,
  Typography,
  useTheme,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import dayjs from 'dayjs'
import { Link, Navigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { debounce, bounceEarly } from '../../debounce.mjs'

function makeCatalogQuery(queryClient) {
  makeCatalogQuery.query ??= {
    queryKey: ['catalog'],
    queryFn: async () => {
      const fetched = await goFetch('calendars', {
        credentials: 'include',
      })
      const local = queryClient.getQueryData(['catalog']) ?? []
      return reconcile({
        localData: local,
        serverData: fetched,
        key: 'calendar_id',
      })
    },
  }
  return makeCatalogQuery.query
}

function reconcile({ localData, serverData, key }) {
  const chillTime = 60 * 1000
  const merged = []
  const serverMap = new Map(serverData.map(data => [data[key], data]))
  const localMap = new Map(localData.map(data => [data[key], data]))

  console.log('mapified local:', localMap)
  console.log('mapified server:', serverMap)

  const now = Date.now()

  const isRecent = entry => entry.unsaved && now - entry.unsaved < chillTime

  for (const local of localData) {
    const remote = serverMap.get(local[key])
    const originTag = local.originTag ?? local.etag

    if (originTag === remote?.etag) {
      console.log(
        `Local origin matches remote (${local.etag}).` + ` Keeping local copy.`
      )

      merged.push(local)

      continue
    }

    if (
      originTag === 'creating' ||
      (local.etag === 'creating' && isRecent(local))
    ) {
      console.log('Persisting creation event', local[key], '🌿')
      merged.push(local)

      continue
    }

    if (local.isDeleting && !serverMap.has(local[key])) {
      console.log(`👋 unwanted event gone; omitting (${local[key]})`)

      continue
    }

    if (isRecent(local)) {
      console.log(
        'treating',
        local[key],
        `as hot 🔥. (${Math.round(
          (chillTime - (now - local.unsaved)) / 1000
        )}s left)`
      )

      // etag could be missing if the record was deleted remotely
      const newTag = serverMap.get(local[key])?.etag ?? 'creating'

      let overwrite = null

      if (originTag !== newTag) {
        overwrite = { etag: newTag, originTag }
      }

      merged.push({
        ...local,
        ...overwrite,
      })

      continue
    }

    const pre = 'treating ' + local[key] + ' as cold 🧊'

    if (!serverMap.has(local[key])) {
      console.log(pre, '... yielding to remote-delete ✖️')

      continue
    }

    console.log(
      pre,
      `...etag mismatch (${originTag} / ${remote.etag}). ` +
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
  const createOptimistic = useCreateOptimistic()
  const [disabled, setDisabled] = useState(false)

  return (
    <CardOuter>
      <CardActionArea
        disabled={disabled}
        onClick={() => {
          setDisabled(true)
          setTimeout(() => setDisabled(false), 500)

          createOptimistic()
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

function useCreateOptimistic() {
  const queryClient = useQueryClient()
  const [idemKey, setIdemKey] = useState(() => randomIdemKey())

  function randomIdemKey() {
    return String(Math.floor(Math.random() * 1e9))
  }

  return () => {
    const temporary = {
      summary: 'Temporary Calendar',
      etag: 'creating',
      calendar_id: idemKey,
    }
    console.log('creating with idemKey: ', temporary.calendar_id)

    queryClient.setQueryData(['catalog'], catalog => [...catalog, temporary])

    const newKey = randomIdemKey()
    console.log('setting new idem key to ', newKey)
    setIdemKey(newKey)
  }
}

function useDeleteOptimistic(id) {
  const queryClient = useQueryClient()

  return () => {
    queryClient.setQueryData(['catalog'], catalog =>
      catalog.map(c =>
        c.calendar_id === id
          ? { ...c, isDeleting: true, unsaved: Date.now() }
          : c
      )
    )
  }
}

function useUpdateOptimistic(id) {
  const queryClient = useQueryClient()

  return updates => {
    queryClient.setQueryData(['catalog'], catalog =>
      catalog.map(c =>
        c.calendar_id === id
          ? {
              ...c,
              ...updates,
              unsaved: Date.now(),
            }
          : c
      )
    )
  }
}

function CalendarCard({ calendar, children }) {
  const deleteOptimistic = useDeleteOptimistic(calendar.calendar_id)
  const updateOptimistic = useUpdateOptimistic(calendar.calendar_id)

  const theme = useTheme()
  const [isEditing, setIsEditing] = useState(false)
  const isCreating = calendar.etag === 'creating'
  const inputRef = useRef(null)

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [isEditing])

  return (
    <CardOuter
      sx={{
        opacity: calendar.isDeleting ? 0.5 : undefined,
      }}
    >
      <Box
        component={isEditing || isCreating ? 'div' : Link}
        to={'/calendars/' + calendar.calendar_id}
        sx={{
          color: 'inherit',
          textDecoration: 'none',
          bgcolor: alpha(theme.palette.primary.dark, 0.3),
          '&:hover': {
            bgcolor: !isCreating && alpha(theme.palette.primary.dark, 0.7),
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
            sx={{width: '100%'}}
              variant="filled"
              inputRef={inputRef}
              defaultValue={calendar.summary || 'Untitled'}
              onClick={e => {
                if (isEditing) {
                  e.preventDefault()
                  console.log('TextField preventDefault')
                }
              }}
              onKeyUp={e => {
                if (e.key === 'Enter') {
                  inputRef.current.blur()
                }
              }}
              onChange={debounce(
                `summary update ${calendar.calendar_id}`,
                e => {
                  updateOptimistic({
                    summary: e.target.value,
                  })
                },
                3500
              )}
              onBlur={() => {
                bounceEarly(`summary update ${calendar.calendar_id}`)
                setIsEditing(false)
              }}
            />
          )}
        </Box>
      </Box>
      <CardContent sx={{ flexGrow: 1, width: '100%' }}>{children}</CardContent>

      <CardActions>
        <Button
          disabled={isCreating}
          component={Link}
          to={`/calendars/${calendar.id}`}
        >
          Open
        </Button>

        <Box ml="auto">
          <IconButton
            disabled={isCreating}
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
            disabled={calendar.isDeleting}
            onClick={() => deleteOptimistic(calendar.calendar_id)}
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

  if (catalog.error) {
    return (
      <ViewContainer>
        {header}
        {loadingPane}
      </ViewContainer>
    )
  }

  if (!catalog.data) {
    return <Navigate to="/login" />
  }

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
          // N.B. index is more stable than calendar_id in the case
          // of an in-creation calendar.
          <CalendarCard key={i} calendar={c}>
            <Typography variant="body2" sx={{ opacity: 0.5 }}>
              Created: {dayjs(c.created).from(now)}
              <br />
              Updated: {dayjs(c.updated).from(now)}
              <br />
              <span
                style={{ color: c.etag === 'creating' ? 'green' : undefined }}
              >
                etag: {c.etag}
              </span>
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
              {c.isDeleting && (
                <>
                  <span style={{ color: 'red' }}>isDeleting</span>
                  <br />
                </>
              )}
              {c.originTag && (
                <span style={{ color: 'orange' }}>
                  originTag: {c.originTag}
                </span>
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
