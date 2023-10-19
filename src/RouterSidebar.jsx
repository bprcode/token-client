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
import { useMatch, useNavigate, useNavigation } from 'react-router-dom'

function NavItem({ to, label, children }) {
  const theme = useTheme()
  const navigate = useNavigate()
  const navigation = useNavigation()
  const isMatch = useMatch(to)

  const isNavigating = navigation.location && navigation.location.pathname.endsWith(to)

  console.log('isMatch ', to, '? ', isMatch)

  return <ListItem sx={{
    backgroundColor: isNavigating ? theme.palette.primary.main+'88' : isMatch ? '#0128' : undefined

  }} disablePadding>
  <ListItemButton onClick={() => navigate(to)}>
    <ListItemIcon>
      {children}
    </ListItemIcon>
    <ListItemText primary={label} />
  </ListItemButton>
</ListItem>
}

export default function RouterSidebar({ width = '240px', expand }) {
  const theme = useTheme()
  const isNarrow = useNarrowCheck()
  const toggleMenu = useContext(ToggleMenuContext)

  const testRoutes = ['foo', 'bar', 'calendar/123', 'calendar/456']

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
      <List
        disablePadding
        sx={{
          backgroundColor: '#182629',
        }}
      >
        {['Item One', 'Item Two', 'Item Three'].map(text => (
          <ListItem key={text} disablePadding>
            <ListItemButton>
              <ListItemIcon sx={{ ml: 1 }}>
                <FolderIcon />
              </ListItemIcon>
              <ListItemText primary={text} />
            </ListItemButton>
          </ListItem>
        ))}
        {testRoutes.map(r => <NavItem key={r} to={r} label={r}><FlareIcon /></NavItem>)}
      </List>
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
