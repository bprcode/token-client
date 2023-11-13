import HourglassTopIcon from '@mui/icons-material/HourglassTop'
import {
  Box,
  Divider,
  Drawer,
  List,
  ListItem,
  Paper,
  Typography,
  useTheme,
} from '@mui/material'
import { ToggleMenuContext, useNarrowCheck } from './calendar/LayoutContext.mjs'
import { useContext } from 'react'
import hourglassPng from './assets/hourglass2.png'
import { useQuery } from '@tanstack/react-query'
import { CalendarFolder } from './CalendarFolder'
import { goFetch, goResolve } from './go-fetch'

function LoginPanel() {
  const { data: loginStatus, isPending: mePending, error: meError } = useQuery({
    queryKey: ['login'],
    queryFn: ({ queryKey }) => {
      console.log('/me query key was: ', queryKey)
      return goFetch('http://localhost:3000/me').then(x => x.json())
    },
    placeholderData: { notice: 'Placeholder value' },
  })

  const ac = new AbortController()
  const {data: timeoutData, isPending: timeoutPending, error: timeoutError, status: timeoutStatus, } = useQuery({
    queryKey: ['tortoise'],
    queryFn: () =>
      goResolve('http://localhost:3000/timeout', { signal: ac.signal }),
  })
  setTimeout(ac.abort.bind(ac), 1000)

  console.log('loginStatus is : ', loginStatus)

  return (<List>
    {/* <ListItem sx={{ backgroundColor: '#408',
    }} disablePadding>
      mePending: {mePending} meError: {meError?.message}
  </ListItem>*/}
    <ListItem sx={{ backgroundColor: '#408',
    }} disablePadding>
      <div>
        timeoutData.status: {timeoutData?.status} <br/>
        timeoutData.ok: {timeoutData?.ok ? 'sure' : 'nope'} <br/>
        timeoutStatus: {timeoutStatus} <br/>
      timeoutPending: {timeoutPending ? 'yeah' : 'no'}<br/>timeoutError: {timeoutError?.message}
      </div>
      {/* timeoutPending: {timeoutPending} timeoutError: {timeoutError?.message} */}
    </ListItem>
    <ListItem
      sx={{
        backgroundColor: '#008',
      }}
      disablePadding
    >
      {loginStatus?.notice || 'No notice yet'}
    </ListItem>
    </ List>
  )
}

function NavSection() {
  return (
    <Box
      sx={{
        flexGrow: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
      }}
    >
      <List disablePadding>
        <CalendarFolder route={'/calendar/123'} title="Calendar 123" />
        <CalendarFolder route={'/calendar/456'} title="Calendar 456" />
        <CalendarFolder route={'/calendar/789'} title="Calendar 789" />
      </List>
    </Box>
  )
}

function HourglassHeader() {
  return (
    <>
      <Box
        sx={{
          height: '64px',
          px: 2,
          py: 2,
          backgroundImage: `url(${hourglassPng})`,
          backgroundColor: '#00182575',
        }}
      >
        <HourglassTopIcon
          sx={{ transform: 'translateY(5px)', mr: 1, opacity: 0.75 }}
        />
        <Typography
          variant="h6"
          component="span"
          sx={{ fontWeight: 500, textShadow: '2px -1px 4px #000' }}
        >
          Clear
        </Typography>
        <Typography
          variant="h6"
          component="span"
          sx={{
            fontWeight: 300,
            opacity: 0.9,
            textShadow: '1px -1px 4px #000',
          }}
        >
          Time
        </Typography>
      </Box>
      <Divider />
    </>
  )
}

export default function RouterSidebar({ width = '240px', expand }) {
  const theme = useTheme()
  const isNarrow = useNarrowCheck()
  const toggleMenu = useContext(ToggleMenuContext)

  const content = (
    <>
      <HourglassHeader />
      <NavSection />
      <LoginPanel />
    </>
  )

  return isNarrow ? (
    <Drawer
      open={expand}
      onClose={() => toggleMenu(false)}
      sx={{
        '& .MuiDrawer-paper': {
          width,
          flexShrink: 0,
          borderRight: `1px solid ${theme.palette.divider}`,
          backgroundImage: 'unset',
          backgroundColor: '#101b1d',
        },
      }}
    >
      {content}
      <Divider />
    </Drawer>
  ) : (
    <Paper
      component="nav"
      elevation={0}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        width,
        flexShrink: 0,
        borderRight: `1px solid ${theme.palette.divider}`,
        borderLeft: `1px solid ${theme.palette.divider}`,
      }}
    >
      {content}
    </Paper>
  )
}
