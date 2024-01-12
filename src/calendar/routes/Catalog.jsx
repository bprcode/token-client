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
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Skeleton,
  TextField,
  Typography,
  useTheme,
} from '@mui/material'
import { alpha, keyframes } from '@mui/material/styles'
import dayjs from 'dayjs'
import { Link } from 'react-router-dom'
import { useEffect, useReducer, useRef, useState } from 'react'
import { reconcile } from '../reconcile.mjs'
import { ConflictDisplay } from '../ConflictDisplay'
import { isCalendarDuplicate } from '../../CatalogSync'

function makeCatalogQuery(queryClient) {
  return {
    staleTime: 1 * 60 * 1000,
    queryKey: ['catalog'],
    queryFn: async () => {
      const fetched = await goFetch('calendars')
      const local = queryClient.getQueryData(['catalog']) ?? []

      return reconcile({
        localData: local,
        serverData: fetched,
        key: 'calendar_id',
        tag: 'calendars',
        isDuplicate: isCalendarDuplicate,
      })
    },
  }
}

export const loader =
  queryClient =>
  ({ request, params }) => {
    queryClient.prefetchQuery(makeCatalogQuery(queryClient))

    return 'unused'

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

const fallbackGradient =
  'linear-gradient(65deg, #151a1ccf -50%, #343d3ecc 55%, #6a868659 90%)'
function CardOuter({ sx, children }) {
  const theme = useTheme()
  const fillColor = alpha(theme.palette.background.paper, 0.8)
  // Firefox has a rendering bug which applies the filter inconsistently:
  const disableBlur = navigator.userAgent.includes('Firefox')

  return (
    <Card
      sx={{
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0.25rem 0.25rem 0.35rem #0006',
        backgroundColor: disableBlur
          ? 'rgba(2, 3, 3, 0.68)'
          : alpha(fillColor, 0.4),
        backdropFilter: disableBlur ? undefined : 'blur(24px)',
        backgroundImage: disableBlur ? fallbackGradient : undefined,
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
      summary: 'New Calendar',
      etag: 'creating',
      calendar_id: idemKey,
      stableKey: idemKey,
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

function DeleteConfirmDialog({ open, onClose, onDelete }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title">
        Delete calendar?
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          All calendar contents will be deleted.
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 2, pt: 2, pb: 3, justifyContent: 'center' }}>
        <Button variant="contained" color="warning" sx={{ mr: 2 }} onClick={onDelete}>
          Delete
        </Button>
        <Button variant="outlined" onClick={onClose} >
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  )
}

const initialGlow = keyframes`
  from {
    box-shadow: 0 0 3rem #afff inset;
  }
  to {
    box-shadow: 0 0 3rem #aff0 inset;
  }
`

const fadeOut = keyframes`
from {
  opacity: 1.0;
  box-shadow: 0 0 0px #0000 inset;
}
to {
  opacity: 0.0;
  box-shadow: 0 0 200px #000f inset;
}
`

const toggle = x => !x

function CalendarCard({ calendar, children }) {
  const deleteOptimistic = useDeleteOptimistic(calendar.calendar_id)
  const updateOptimistic = useUpdateOptimistic(calendar.calendar_id)

  const theme = useTheme()
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirmation, toggleConfirmation] = useReducer(toggle, false)

  const isCreating = calendar.etag === 'creating'
  const inputRef = useRef(null)

  const now = dayjs()
  const isNew = now.diff(calendar.created) < 1000

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [isEditing])

  let animation
  if (isNew) {
    animation = `${initialGlow} 1s ease`
  }
  if (isDeleting) {
    animation = `${fadeOut} 0.5s ease`
  }

  return (
    <CardOuter
      sx={{
        opacity: calendar.isDeleting ? 0.5 : undefined,
        animation,
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
              sx={{ width: '100%' }}
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
              onBlur={e => {
                console.log('☁️ Blur: e.target.value=', e.target.value)
                updateOptimistic({
                  summary: e.target.value,
                })
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
          to={`/calendars/${calendar.calendar_id}`}
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
            onClick={toggleConfirmation}
          >
            <DeleteIcon sx={{ opacity: 0.9 }} />
          </IconButton>
        </Box>
        <DeleteConfirmDialog
          open={showConfirmation}
          onClose={toggleConfirmation}
          onDelete={() => {
            toggleConfirmation()
            setIsDeleting(true)
            setTimeout(() => deleteOptimistic(calendar.calendar_id), 500)
          }}
        />
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

  if (
    catalog.isPending ||
    (catalog.isError && catalog.isFetching) ||
    (!catalog.data && catalog.isFetching)
  ) {
    return (
      <ViewContainer>
        {header}
        <CatalogGrid>
          <CardSkeleton sx={{ opacity: 0.9 }} />
          <CardSkeleton sx={{ opacity: 0.65 }} />
          <CardSkeleton sx={{ opacity: 0.45 }} />
          <CardSkeleton sx={{ opacity: 0.2 }} />
        </CatalogGrid>
      </ViewContainer>
    )
  }

  if (catalog.error || !catalog.data) {
    return (
      <ViewContainer>
        {header}
        {loadingPane}
      </ViewContainer>
    )
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
        {catalog.data?.map?.(c => (
          <CalendarCard key={c.stableKey ?? c.calendar_id} calendar={c}>
            <Typography variant="body2" sx={{ opacity: 0.5 }}>
              Created: {dayjs(c.created).from(now)}
              <br />
              Updated: {dayjs(c.updated).from(now)}
              <br />
            </Typography>
          </CalendarCard>
        ))}
        <CreationCard />
        {emptyPadding}
      </CatalogGrid>
      <ConflictDisplay tag="calendars" />
    </ViewContainer>
  )
}
