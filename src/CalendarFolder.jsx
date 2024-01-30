import CalendarViewMonthIcon from '@mui/icons-material/CalendarViewMonth'
import CalendarViewWeekIcon from '@mui/icons-material/CalendarViewWeek'
import CalendarViewDayIcon from '@mui/icons-material/CalendarViewDay'
import {
  Box,
  Collapse,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  useTheme,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { ToggleMenuContext } from './calendar/LayoutContext.mjs'
import { useContext } from 'react'
import {
  Link,
  useLocation,
  useNavigation,
  useSearchParams,
} from 'react-router-dom'
import { TopNavLink } from './TopNavLink'

export const openColor = '#0116'
export const activeColor = '#153244cc'

export function CalendarFolder({ route, title }) {
  const location = useLocation()
  const navigation = useNavigation()
  const theme = useTheme()
  const [sp] = useSearchParams()
  const dayQuery = sp.has('d') ? '&d=' + sp.get('d') : ''

  const isOpen =
    (location.pathname.endsWith(route) && !navigation.location) ||
    (navigation.location && navigation.location.pathname.endsWith(route))

  return (
    <ListItem disablePadding>
      <List
        disablePadding
        sx={{
          color: alpha(theme.palette.text.primary, isOpen ? 1.0 : 0.775),

          width: '100%',
          maxWidth: 360,
          bgcolor: 'background.paper',
          borderBottom: isOpen ? `1px solid #ffffff28` : `1px solid #0008`,
        }}
        aria-label={`Nested folder ${route}`}
      >
        {isOpen && <Divider />}
        <TopNavLink route={route}>
          <Box
            sx={{
              textOverflow: 'ellipsis',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
            }}
          >
            {title}
          </Box>
        </TopNavLink>
        <Collapse in={isOpen} timeout={350} unmountOnExit>
          <List disablePadding>
            <ViewLink to={`${route}?v=month${dayQuery}`} label="Month">
              <CalendarViewMonthIcon />
            </ViewLink>
            <ViewLink to={`${route}?v=week${dayQuery}`} label="Week">
              <CalendarViewWeekIcon />
            </ViewLink>
            <ViewLink to={`${route}?v=day${dayQuery}`} label="Day">
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

  const isNavTarget = navPathname?.endsWith(toPathname) && toView === navView
  const isCurrentLocation =
    locPathname.endsWith(toPathname) && toView === locView

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
            minWidth: '48px',
          }}
        >
          {children}
        </ListItemIcon>
        {label}
      </ListItemButton>
    </ListItem>
  )
}
