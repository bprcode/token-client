import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import ShareIcon from '@mui/icons-material/Share'
import { useQuery } from '@tanstack/react-query'
import { goFetch } from '../../go-fetch'
import { useLoadingPane } from '../LoadingPane'
import { ViewContainer } from '../ViewContainer'
import { ViewHeader } from '../ViewHeader'
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  IconButton,
  Skeleton,
  Typography,
  useTheme,
} from '@mui/material'
import { alpha} from '@mui/material/styles'
import dayjs from 'dayjs'
import { Link } from 'react-router-dom'

const catalogQuery = {
  queryKey: ['catalog'],
  queryFn: () => {
    console.log('🦕 catalog queryFn called')
    return goFetch(import.meta.env.VITE_BACKEND + 'calendars', {
      credentials: 'include',
    })
  },
}

// debug -- can probably choose await or not here?
export const loader =
  queryClient =>
  ({ request, params }) => {
    console.log('zoo catalog loader?')

    queryClient.fetchQuery(catalogQuery)
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
        gridAutoRows: '200px',
      }}
    >
      {children}
    </Box>
  )
}

function CalendarCard({ title, id, children }) {
  const theme = useTheme()

  return (
    <Card sx={{ display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ bgcolor: alpha(theme.palette.primary.dark, 0.3), px: 2, py: 1 }}>
        <Typography
          variant="h5"
          component="div"
          sx={{
            position: 'relative',
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
          }}
        >
          {title}
        </Typography>
      </Box>
      <CardContent sx={{ flexGrow: 1 }}>{children}</CardContent>
      <CardActions>
        <Button component={Link} to={`/calendar/${id}`}>
          Open
        </Button>

        <Box ml="auto">
          <IconButton
            aria-label="Share"
            onClick={() => console.log('share placeholder')}
          >
            <ShareIcon sx={{ opacity: 0.8 }} />
          </IconButton>
          <IconButton
            aria-label="Rename"
            onClick={() => console.log('rename placeholder')}
          >
            <EditIcon sx={{ opacity: 0.8 }} />
          </IconButton>
          <IconButton
            aria-label="Delete"
            onClick={() => console.log('delete placeholder')}
          >
            <DeleteIcon sx={{ opacity: 0.8 }} />
          </IconButton>
        </Box>
      </CardActions>
    </Card>
  )
}

export function Catalog() {
  const theme = useTheme()
  const catalog = useQuery(catalogQuery)
  const loadingPane = useLoadingPane(catalog)

  console.log('theme=', theme)

  const header = (
    <ViewHeader>
      <Typography variant="h6" component="span">
        Calendars
      </Typography>
    </ViewHeader>
  )

  if (catalog.isLoading) {
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
        {catalog.data.map((c, i) => (
          <CalendarCard
            key={c.calendar_id}
            id={c.calendar_id}
            title={c.summary}
          >
            <Typography variant="body2" sx={{ opacity: 0.5 }}>
              Created: {dayjs(c.created).from(now)}
              <br />
              Updated: {dayjs(c.updated).from(now)}
              <br />
            </Typography>
          </CalendarCard>
        ))}
      </CatalogGrid>
      <br />
      <div>isPending: {catalog.isPending ? 'yeah' : 'nah'}</div>
      <div>catalog query status: {catalog.status}</div>
      <div>catalog error message: {catalog.error?.message}</div>
      <div>catalog error status: {catalog.error?.status}</div>
      <div>records returned: {catalog.data?.length}</div>
      <ul>
        {catalog.data?.length &&
          catalog.data.map((c, i) => (
            <li key={c.calendar_id}>
              {c.calendar_id} {c.summary}
            </li>
          ))}
      </ul>
    </ViewContainer>
  )
}
