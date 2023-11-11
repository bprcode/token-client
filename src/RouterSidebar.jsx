import HourglassTopIcon from '@mui/icons-material/HourglassTop'
import CalendarViewMonthIcon from '@mui/icons-material/CalendarViewMonth'
import CalendarViewWeekIcon from '@mui/icons-material/CalendarViewWeek'
import CalendarViewDayIcon from '@mui/icons-material/CalendarViewDay'
import {
  Box,
  Collapse,
  Divider,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  Paper,
  Typography,
  useTheme,
} from '@mui/material'
import { styled } from '@mui/material/styles'
import { ToggleMenuContext, useNarrowCheck } from './calendar/LayoutContext.mjs'
import { useContext } from 'react'
import hourglassPng from './assets/hourglass2.png'
import { Link, useLocation, useNavigate, useNavigation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'

const openColor = '#0116'
const activeColor = '#153244cc'

const PlainLink = styled(Link)({
  color: 'inherit',
  textDecoration: 'none',
})

export function CalendarFolder({ route, title }) {
  const location = useLocation()
  const navigation = useNavigation()
  const navigate = useNavigate()
  const theme = useTheme()

  const isOpen =
    (location.pathname === route && !navigation.location) ||
    (navigation.location && navigation.location.pathname === route)

  const navParams = new URLSearchParams(
    (navigation.location && navigation.location.search) || 'v='
  )
  const locParams = new URLSearchParams(location.search || 'v=')

  const navView = navParams.get('v')
  const locView = locParams.get('v')

  const isBaseView = isOpen && !navView && !locView

  const isNavTarget =
    navigation.location && navigation.location.pathname === route && !navView

  const isCurrentLocation = location.pathname === route && !locView

  return (
    <List
      disablePadding
      sx={{
        color: theme.palette.text.primary + (isOpen ? '' : 'cc'),

        width: '100%',
        maxWidth: 360,
        bgcolor: 'background.paper',
        borderBottom: isOpen ? `1px solid #ffffff28` : `1px solid #0008`,
      }}
      component="section"
      aria-label="Nested folder"
    >
      <ListItemButton
        onClick={() => navigate(route)}
        sx={{
          backgroundColor: isCurrentLocation
            ? activeColor
            : isOpen
            ? openColor
            : false,

          boxShadow:
            (isNavTarget || isBaseView) &&
            '4px 0 0 inset' + theme.palette.primary.main + '88',
        }}
      >
        <PlainLink to={route}>{title}</PlainLink>
      </ListItemButton>
      <Collapse in={isOpen} timeout={350} unmountOnExit>
        <List component="div" disablePadding>
          <ViewLink to={`${route}?v=month`} label="Month">
            <CalendarViewMonthIcon />
          </ViewLink>
          <ViewLink to={`${route}?v=week`} label="Week">
            <CalendarViewWeekIcon />
          </ViewLink>
          <ViewLink to={`${route}?v=day`} label="Day">
            <CalendarViewDayIcon />
          </ViewLink>
        </List>
      </Collapse>
    </List>
  )
}

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

  return (
    <ListItem
      sx={{
        boxShadow:
          (isNavTarget || (isCurrentLocation && !navigation.location)) &&
          '4px 0 0 inset' + theme.palette.primary.main + '88',
        backgroundColor: isCurrentLocation ? activeColor : openColor,
      }}
      disablePadding
    >
      <ListItemButton
        sx={{
          pl: 3,
          '&:hover': {
            backgroundColor: '#aef3',
          },
        }}
        onClick={() => {
          navigate(to)
          toggleMenu(false)
        }}
      >
        <ListItemIcon
          sx={{
            minWidth: '40px',
          }}
        >
          {children}
        </ListItemIcon>
        <PlainLink to={to}>{label}</PlainLink>
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
