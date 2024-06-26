import HomeIcon from '@mui/icons-material/Home'
import {
  Box,
  Divider,
  Drawer,
  List,
  Paper,
  Skeleton,
  useTheme,
} from '@mui/material'
import { ToggleMenuContext, useNarrowCheck } from './LayoutContext'
import { useContext } from 'react'
import hourglassPng from '../assets/hourglass2p.png'
import logoSvg from '../assets/silver-logo.svg'

import { CalendarFolder } from './CalendarFolder'
import { HeartbeatPanel } from './HeartbeatPanel'
import { TopNavLink } from './TopNavLink'
import { useCatalogQuery } from './routes/Catalog'
import { DemoContext } from './DemoContext'
import { useLocation } from 'react-router-dom'

function SkeletonFolders() {
  const skeletons = Array(5).fill(0)

  return (
    <Box
      sx={{
        flexGrow: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        p: 2,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {skeletons.map((_, i) => (
        <div
          key={i}
          style={{ display: 'flex', alignItems: 'center', height: '40px' }}
        >
          <Skeleton
            variant="rounded"
            width={16}
            height={16}
            sx={{ display: 'inline-block', mr: 1 }}
          />
          <Skeleton sx={{ display: 'inline-block', flexGrow: 1 }} />
        </div>
      ))}
    </Box>
  )
}

function NavSection() {
  const isDemo = useContext(DemoContext)
  const catalog = useCatalogQuery()

  if (catalog.isPending) {
    return <SkeletonFolders />
  }

  return (
    <Box
      sx={{
        flexGrow: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
      }}
    >
      <List disablePadding>
        {catalog.data && !isDemo && (
          <TopNavLink route="catalog">
            <HomeIcon sx={{ mr: 1 }} />
            All Calendars
          </TopNavLink>
        )}
        {catalog.data?.map(c => {
          const key = c.stableKey ?? c.calendar_id
          if (c.isDeleting || c.etag === 'creating') return
          return (
            <CalendarFolder
              route={`calendars/${c.calendar_id}`}
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
        <img src={logoSvg} style={{
          marginLeft: '0.5rem',
        }} />
        
      </Box>
      <Divider />
    </>
  )
}

export default function RouterSidebar({ width = '240px', expand }) {
  const theme = useTheme()
  const isNarrow = useNarrowCheck()
  const toggleMenu = useContext(ToggleMenuContext)

  const location = useLocation()
  if (location.pathname === '/login') {
    return <></>
  }

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
