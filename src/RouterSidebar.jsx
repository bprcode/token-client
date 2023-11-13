import HourglassTopIcon from '@mui/icons-material/HourglassTop'
import LogoutIcon from '@mui/icons-material/Logout'
import {
  Box,
  Divider,
  Drawer,
  List,
  ListItem,
  Paper,
  Typography,
  useTheme,
  Button,
  Avatar,
  IconButton,
  CircularProgress,
} from '@mui/material'
import { ToggleMenuContext, useNarrowCheck } from './calendar/LayoutContext.mjs'
import { useContext } from 'react'
import hourglassPng from './assets/hourglass2.png'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarFolder } from './CalendarFolder'
import { goFetch } from './go-fetch'
import { Link } from 'react-router-dom'

function LoginPanel() {
  const queryClient = useQueryClient()
  const theme = useTheme()

  const loginMutation = useMutation({
    mutationFn: () =>
      goFetch(import.meta.env.VITE_BACKEND + 'login', {
        method: 'POST',
        body: JSON.stringify({ email: 'Demo Account', password: '123' }),
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        credentials: 'include',
      }),
    retry: 2,
    onSuccess: data => {
      console.log('mutation success with data: ', data)
      queryClient.setQueryData(['login'], data)
    },
  })

  const logoutMutation = useMutation({
    mutationFn: () => goFetch(import.meta.env.VITE_BACKEND + 'login', {
      method: 'DELETE',
      credentials: 'include'
    }),
    retry: 2,
    onSuccess: data => {
      console.log('logout mutation yielded ', data)
      if(data.ok) { queryClient.setQueryData(['login'], {})}
    }
  })

  const {
    data: loginStatus,
    isPending: mePending,
    error: meError,
  } = useQuery({
    queryKey: ['login'],
    queryFn: ({ queryKey }) => {
      console.log('/me query key was: ', queryKey)
      return goFetch(import.meta.env.VITE_BACKEND + 'me', {
        credentials: 'include',
      })
    },
    placeholderData: { notice: 'Placeholder value' },
  })

  let interactions = <Box sx={{mx: 'auto' }}><CircularProgress size="1.75rem" /></Box>
  if(!loginMutation.isPending && !logoutMutation.isPending) {
    interactions = loginStatus.name ? (
      <>
        <Avatar sx={{ bgcolor: theme.palette.primary.main, mr: 1 }}>
          {loginStatus.name[0]}
        </Avatar>
        <span
          style={{
            overflow: 'hidden',
            flexGrow: 1,
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            verticalAlign: 'center',
          }}
        >
          {loginStatus.name}
        </span>
        <IconButton onClick={logoutMutation.mutate}
        >
          <LogoutIcon />
        </IconButton>
      </>
    ) : (
      <Button variant="contained" onClick={loginMutation.mutate}>
        Login Sample User
      </Button>
    )
  }

  return (
    <List>
      <ListItem sx={{ backgroundColor: '#480' }} disablePadding>
        <div>
          loginMutation.status: {loginMutation.status}
          <br />
          loginMutation.error: {loginMutation.error?.message}
          <br />
          loginMutation.data.status: {loginMutation.data?.status}
          <br />
          loginMutation.data.ok: {loginMutation.data?.ok ? 'Y' : 'N'}
          <br />
          loginMutation.data.error: {loginMutation.data?.error}
          <br />
        </div>
      </ListItem>
      <ListItem
        sx={{
          backgroundColor: '#008',
        }}
        disablePadding
      >
        <Box
          sx={{ width: '100%', display: 'flex', height: '2.5rem',
        alignItems: 'center',
        }}
        >
          {interactions}
        </Box>
      </ListItem>
    </List>
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
        <Link to="/catalog">Catalog</Link>
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
