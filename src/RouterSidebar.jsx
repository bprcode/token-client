import HourglassTopIcon from '@mui/icons-material/HourglassTop'
import FolderIcon from '@mui/icons-material/Folder'
import FlareIcon from '@mui/icons-material/Flare'
import {
  Box,
  Divider,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Typography,
  useTheme,
} from '@mui/material'
import { ToggleMenuContext, useNarrowCheck } from './calendar/LayoutContext.mjs'
import { useContext } from 'react'
import hourglassPng from './assets/hourglass2.png'
import { useLocation, useNavigate, useNavigation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'

/**
 * List item link with highlighting based on navigation state,
 * matching the "v=" query parameter, if any.
 */
function ViewLink({ to = '', label, children }) {
  const theme = useTheme()
  const navigate = useNavigate()
  const navigation = useNavigation()
  const location = useLocation()
  const toggleMenu = useContext(ToggleMenuContext)

  const toPathname = to.split('?')[0]
  const navPathname = navigation.location && navigation.location.pathname
  const locPathname = location.pathname
  const toParams = new URLSearchParams(to.split('?')[1] || 'v=')

  const navParams = new URLSearchParams(
    (navigation.location && navigation.location.search) || 'v='
  )
  const locParams = new URLSearchParams(location.search || 'v=')

  const toView = toParams.get('v')
  const navView = navParams.get('v')
  const locView = locParams.get('v')

  const isNavTarget = navPathname === toPathname && toView === navView
  const isCurrentLocation = toPathname === locPathname && toView === locView

  let backgroundColor = undefined

  if (isNavTarget) {
    backgroundColor = theme.palette.primary.main + '88'
  } else if (isCurrentLocation) {
    backgroundColor = '#0128'
  }
  return (
    <ListItem
      sx={{
        boxShadow:
          isCurrentLocation &&
          '4px 0 0 inset' + theme.palette.primary.main + '88',
        backgroundColor,
      }}
      disablePadding
    >
      <ListItemButton
        onClick={() => {
          navigate(to)
          toggleMenu(false)
        }}
      >
        <ListItemIcon>{children}</ListItemIcon>
        <ListItemText primary={label} />
      </ListItemButton>
    </ListItem>
  )
}

function LoginPanel() {
  const { data: loginStatus } = useQuery({
    queryKey: ['login'],
    queryFn: () => fetch('http://localhost:3000/me').then(x => x.json()),
    placeholderData: { notice: 'Placeholder value' },
  })

  return (
    <ListItem
      sx={{
        backgroundColor: '#008',
      }}
      disablePadding
    >
      {loginStatus?.notice || 'No notice yet'}
    </ListItem>
  )
}

function NavSection() {
  const location = useLocation()
  console.log('location=', location)

  const testRoutes = [
    // 'foo',
    // 'bar',
    ['/calendar/123', '123'],
    ['/calendar/456', '456'],
    ['/calendar/123?v=month', '123 monthly'],
    ['/calendar/123?v=week', '123 weekly'],
    ['/calendar/123?v=day', '123 daily'],
  ]

  return (
    <Box
      sx={{
        flexGrow: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
      }}
    >
      <List>
      {testRoutes.map(r => (
          <ViewLink to={r[0]} key={r[0]}>
            {r[1]}
          </ViewLink>
      ))}
      </List>
    </Box>
  )
}

export default function RouterSidebar({ width = '240px', expand }) {
  const theme = useTheme()
  const isNarrow = useNarrowCheck()
  const toggleMenu = useContext(ToggleMenuContext)

  const content = (
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
