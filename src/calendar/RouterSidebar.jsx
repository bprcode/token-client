import HourglassTopIcon from '@mui/icons-material/HourglassTop'
import HomeIcon from '@mui/icons-material/Home'
import {
  Box,
  Divider,
  Drawer,
  List,
  Paper,
  Typography,
  useTheme,
} from '@mui/material'
import { ToggleMenuContext, useNarrowCheck } from './LayoutContext.mjs'
import { useContext } from 'react'
import hourglassPng from '../assets/hourglass2.png'

import { CalendarFolder } from '../CalendarFolder'
import { HeartbeatPanel, useHeartbeatQuery } from '../HeartbeatPanel'
import { TopNavLink } from '../TopNavLink'
import { useCatalogQuery } from './routes/Catalog'

function NavSection() {
  const catalog = useCatalogQuery()

  return (
    <Box
      sx={{
        flexGrow: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
      }}
    >
      <List disablePadding>
        {catalog.data && (
          <TopNavLink route="/catalog">
            <HomeIcon sx={{ mr: 1 }} />
            All Calendars
          </TopNavLink>
        )}
        {catalog.data?.map(c => {
          const key = c.stableKey ?? c.calendar_id
          if (c.isDeleting || c.etag === 'creating') return
          return (
            <CalendarFolder
              route={`/calendars/${c.calendar_id}`}
              key={key}
              title={c.summary}
            />
          )
        })}
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
      <HeartbeatPanel>
        <NavSection />
      </HeartbeatPanel>
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
