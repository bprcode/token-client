import { ThemeProvider } from '@mui/material/styles'
import HourglassTopIcon from '@mui/icons-material/HourglassTop'
import FolderIcon from '@mui/icons-material/Folder'
import {
  Container,
  Typography,
  CssBaseline,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  Paper,
  Fade,
  Slide,
} from '@mui/material'
import digitalTheme from './blueDigitalTheme'
import { useContext, useMemo, useRef, useState } from 'react'
import dayjs from 'dayjs'
import { TransitionGroup } from 'react-transition-group'
import { useEventListHistory, isOverlap } from './calendar/calendarLogic.mjs'
import { WeeklyView } from './calendar/WeeklyView'
import { MonthlyView } from './calendar/MonthlyView'
import { DailyView } from './calendar/DailyView'
import { ToggleMenuContext, useNarrowCheck } from './calendar/LayoutContext.mjs'
import { PreferencesContext } from './calendar/PreferencesContext.mjs'
import { useTheme } from '@mui/material'
import hourglassPng from './assets/hourglass2.png'
import { LoggerProvider } from './calendar/Logger'

const currentDate = dayjs()

function RootLayout({ children }) {
  const isNarrow = useNarrowCheck()
  const [expand, setExpand] = useState(false)

  console.log('rendering root')
  return (
    <ToggleMenuContext.Provider value={setExpand}>
      <Container
        className="root-container"
        maxWidth="md"
        disableGutters
        sx={{
          height: '100vh',
          // N.B. overflowX: hidden causes a persistent address bar
          // on mobile Y-scrolling in the DailyView component.
          overflowX: isNarrow ? undefined : 'hidden',
        }}
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
  )
}

export function Sidebar({ width = '240px', expand }) {
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

function ResponsiveTransition(props) {
  const isNarrow = useNarrowCheck()
  if (isNarrow) {
    return <Fade timeout={350} {...props} />
  }

  return (
    <Slide
      timeout={350}
      direction="left"
      mountOnEnter
      unmountOnExit
      {...props}
    />
  )
}

function Demo() {
  const preferences = useContext(PreferencesContext)
  const [eventListHistory, dispatchEventListHistory] = useEventListHistory()
  const eventList = eventListHistory[eventListHistory.length - 1]
  const dispatchAction = dispatchEventListHistory
  const canUndo = eventListHistory.length > 1

  const [view, setView] = useState('month')
  const [expandedDate, setExpandedDate] = useState(null)

  const dayEvents = useMemo(() => {
    if (view !== 'day') {
      return null
    }

    const startOfDay = expandedDate.startOf('day')
    const endOfDay = expandedDate.endOf('day')
    return eventList.filter(e =>
      isOverlap(startOfDay, endOfDay, e.startTime, e.endTime)
    )
  }, [view, eventList, expandedDate])

  const boxRef = useRef(null)

  return (
    <LoggerProvider>
      <RootLayout>
        <Paper
          ref={boxRef}
          elevation={1}
          sx={{
            height: '100%',
            width: '100%',
            position: 'relative',
          }}
        >
          <TransitionGroup>
            {view === 'month' && (
              <ResponsiveTransition container={boxRef.current}>
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    width: '100%',
                    height: '100%',
                  }}
                >
                  <MonthlyView
                    initialDate={currentDate}
                    unfilteredEvents={eventList}
                    onExpand={date => {
                      setExpandedDate(date)
                      setView('week')
                    }}
                  />
                </div>
              </ResponsiveTransition>
            )}
            {view === 'week' && (
              <ResponsiveTransition container={boxRef.current}>
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    width: '100%',
                    height: '100%',
                  }}
                >
                  <WeeklyView
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
              </ResponsiveTransition>
            )}
            {view === 'day' && (
              <ResponsiveTransition container={boxRef.current}>
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    width: '100%',
                    height: '100%',
                  }}
                >
                  <DailyView
                    onBack={() => setView('week')}
                    day={expandedDate || dayjs()}
                    unfilteredEvents={eventList}
                    filteredEvents={dayEvents}
                    onCreate={addition =>
                      dispatchAction({
                        type: 'create',
                        merge: preferences.merge,
                        addition,
                      })
                    }
                    onUpdate={updates =>
                      dispatchAction({
                        type: 'update',
                        id: updates.id,
                        merge: preferences.merge,
                        updates,
                      })
                    }
                    onDelete={id =>
                      dispatchAction({
                        type: 'delete',
                        id: id,
                      })
                    }
                    onUndo={() => dispatchAction({ type: 'undo' })}
                    canUndo={canUndo}
                  />
                </div>
              </ResponsiveTransition>
            )}
          </TransitionGroup>
        </Paper>
      </RootLayout>
    </LoggerProvider>
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
