import { ThemeProvider } from '@mui/material/styles'

import HourglassTopIcon from '@mui/icons-material/HourglassTop'
import FolderIcon from '@mui/icons-material/Folder'
import {
  Container,
  Typography,
  CssBaseline,
  Divider,
  useMediaQuery,
  Drawer,
  List,
  ListItemButton,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  Paper,
  Slide,
} from '@mui/material'
import digitalTheme from './blueDigitalTheme'
import { useContext, useState } from 'react'
import dayjs from 'dayjs'
import { TransitionGroup } from 'react-transition-group'
import { useEventListHistory } from './calendar/mockCalendar.mjs'
import { WeeklyCalendar } from './calendar/WeeklyCalendar'
import { MonthlyCalendar } from './calendar/MonthlyCalendar'
import { DayPage } from './calendar/DayPage'
import { ToggleMenuContext, LayoutContext } from './calendar/LayoutContext.mjs'
import { PreferencesContext } from './calendar/PreferencesContext.mjs'
import { useTheme } from '@emotion/react'
import hourglassPng from './assets/hourglass2.png'
const currentDate = dayjs()

function RootLayout({ children }) {
  const [expand, setExpand] = useState(false)
  const layoutQuery = useMediaQuery('(max-width: 600px)') ? 'mobile' : 'wide'

  return (
    <LayoutContext.Provider value={layoutQuery}>
      <ToggleMenuContext.Provider value={setExpand}>
        <Container
          maxWidth="md"
          disableGutters
          sx={{ height: '100vh', overflow: 'hidden' }}
        >
          <Box
            sx={{
              height: '100%',
              display: 'flex',
            }}
          >
            <Sidebar expand={expand} />

            <div
              style={{
                flexGrow: 1,
              }}
            >
              {children}
            </div>
          </Box>
        </Container>
      </ToggleMenuContext.Provider>
    </LayoutContext.Provider>
  )
}

function Sidebar({ width = '240px', expand }) {
  const theme = useTheme()
  const isNarrow = useMediaQuery('(max-width: 800px)')
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
          sx={{ fontWeight: 300, opacity: 0.9, textShadow: '1px -1px 4px #000' }}
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
      }}
    >
      {content}
    </Paper>
  )
}

function Demo() {
  const preferences = useContext(PreferencesContext)
  const [eventListHistory, dispatchEventListHistory] = useEventListHistory()
  const eventList = eventListHistory[eventListHistory.length - 1]
  const dispatchEventList = dispatchEventListHistory
  const canUndo = eventListHistory.length > 1

  const [view, setView] = useState('month')
  const [expandedDate, setExpandedDate] = useState(null)

  return (
    <RootLayout>
      <Paper
        elevation={1}
        sx={{
          height: '100%',
          width: '100%',
          position: 'relative',
        }}
      >
        <TransitionGroup>
          {view === 'month' && (
            <Slide
              direction="left"
              timeout={350}
              sx={{
                position: 'relative',
                width: '100%',
                height: '100%',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  width: '100%',
                  height: '100%',
                }}
              >
                <MonthlyCalendar
                  initialDate={currentDate}
                  unfilteredEvents={eventList}
                  onExpand={date => {
                    setExpandedDate(date)
                    setView('week')
                  }}
                />
              </div>
            </Slide>
          )}
          {view === 'week' && (
            <Slide
              direction="left"
              timeout={350}
              sx={{
                position: 'relative',
                width: '100%',
                height: '100%',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  width: '100%',
                  height: '100%',
                }}
              >
                <WeeklyCalendar
                  onBack={() => {
                    setExpandedDate(null)
                    setView('month')
                  }}
                  key={(expandedDate || currentDate).format('MM D')}
                  initialDate={expandedDate || currentDate}
                  eventList={eventList}
                  onExpand={date => {
                    setExpandedDate(date)
                    setView('day')
                  }}
                />
              </div>
            </Slide>
          )}
          {view === 'day' && (
            <Slide
              direction="left"
              timeout={350}
              sx={{
                position: 'relative',
                width: '100%',
                height: '100%',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  width: '100%',
                  height: '100%',
                }}
              >
                <DayPage
                  onBack={() => setView('week')}
                  day={expandedDate || dayjs()}
                  unfilteredEvents={eventList}
                  onCreate={addition =>
                    dispatchEventList({
                      type: 'create',
                      merge: preferences.merge,
                      addition,
                    })
                  }
                  onUpdate={updates =>
                    dispatchEventList({
                      type: 'update',
                      id: updates.id,
                      merge: preferences.merge,
                      updates,
                    })
                  }
                  onDelete={id =>
                    dispatchEventList({
                      type: 'delete',
                      id: id,
                    })
                  }
                  onUndo={() => dispatchEventList({ type: 'undo' })}
                  canUndo={canUndo}
                />
              </div>
            </Slide>
          )}
        </TransitionGroup>
      </Paper>
    </RootLayout>
  )
}

function Wrap() {
  return (
    <ThemeProvider theme={digitalTheme}>
      <CssBaseline enableColorScheme>
        <Demo />
      </CssBaseline>
    </ThemeProvider>
  )
}

export default Wrap
