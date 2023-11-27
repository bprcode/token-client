import CalendarViewMonthIcon from '@mui/icons-material/CalendarViewMonth'
import CalendarViewWeekIcon from '@mui/icons-material/CalendarViewWeek'
import CalendarViewDayIcon from '@mui/icons-material/CalendarViewDay'
import {
  Collapse,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  useTheme,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { ToggleMenuContext } from './calendar/LayoutContext.mjs'
import { useContext } from 'react'
import { Link, useLocation, useNavigate, useNavigation } from 'react-router-dom'

const openColor = '#0116'
const activeColor = '#153244cc'

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
    <ListItem disablePadding>
      <List
        disablePadding
        sx={{
          color: theme.palette.text.primary + (isOpen ? '' : 'cc'),

          width: '100%',
          maxWidth: 360,
          bgcolor: 'background.paper',
          borderBottom: isOpen ? `1px solid #ffffff28` : `1px solid #0008`,
        }}
        aria-label={`Nested folder ${route}`}
      >
        <ListItem disablePadding>
          <ListItemButton
            component={Link}
            to={route}
            onClick={() => navigate(route)}
            sx={{
              backgroundColor: isCurrentLocation
                ? activeColor
                : isOpen
                ? openColor
                : undefined,

              boxShadow:
                (isNavTarget || isBaseView) &&
                '4px 0 0 inset ' + alpha(theme.palette.primary.main, 0.53),
            }}
          >
            {title}
          </ListItemButton>
        </ListItem>
        <Collapse in={isOpen} timeout={350} unmountOnExit>
          <List disablePadding>
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
    </ListItem>
  )
}
/**
 * List item link with highlighting based on navigation state,
 * matching the "v=" query parameter, if any.
 */
function ViewLink({ to = '', label, children }) {
  const theme = useTheme()
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
      onClick={() => toggleMenu(false)}
      sx={{
        color: 'inherit',
        boxShadow:
          (isNavTarget || (isCurrentLocation && !navigation.location)) &&
          '4px 0 0 inset ' + alpha(theme.palette.primary.main, 0.53),
        backgroundColor: isCurrentLocation ? activeColor : openColor,
      }}
      disablePadding
    >
      <ListItemButton
        component={Link}
        to={to}
        sx={{
          pl: 3,
          '&:hover': {
            backgroundColor: '#aef3',
          },
        }}
      >
        <ListItemIcon
          sx={{
            minWidth: '40px',
          }}
        >
          {children}
        </ListItemIcon>
        {label}
      </ListItemButton>
    </ListItem>
  )
}
