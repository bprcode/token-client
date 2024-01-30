import { ListItem, ListItemButton, useTheme } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { Link, useLocation, useNavigation } from 'react-router-dom'
import { activeColor, openColor } from './CalendarFolder'

export function TopNavLink({ route, children }) {
  const location = useLocation()
  const navigation = useNavigation()
  const theme = useTheme()

  const isOpen =
    (location.pathname.endsWith(route) && !navigation.location) ||
    (navigation.location && navigation.location.pathname.endsWith(route))

  const navParams = new URLSearchParams(
    (navigation.location && navigation.location.search) || 'v='
  )
  const locParams = new URLSearchParams(location.search || 'v=')

  const navView = navParams.get('v')
  const locView = locParams.get('v')

  const isBaseView = isOpen && !navView && !locView

  const isNavTarget =
    navigation.location &&
    navigation.location.pathname.endsWith(route) &&
    !navView

  const isCurrentLocation = location.pathname.endsWith(route) && !locView

  return (
    <ListItem disablePadding>
      <ListItemButton
        component={Link}
        to={route}
        sx={{
          backgroundColor: isCurrentLocation
            ? activeColor
            : isOpen
            ? openColor
            : undefined,

          boxShadow:
            (isNavTarget || isBaseView) &&
            '4px 0 0 inset ' + alpha(theme.palette.primary.main, 0.53),

          pr: '0.25rem',
          color: alpha(theme.palette.text.primary, isOpen ? 1.0 : 0.775),
        }}
      >
        {children}
      </ListItemButton>
    </ListItem>
  )
}
