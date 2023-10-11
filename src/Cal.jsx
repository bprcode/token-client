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
import { useContext, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { TransitionGroup } from 'react-transition-group'
import { useEventListHistory } from './calendar/mockCalendar.mjs'
import { WeeklyCalendar } from './calendar/WeeklyCalendar'
import { MonthlyCalendar } from './calendar/MonthlyCalendar'
import { DayPage } from './calendar/DayPage'
import { ToggleMenuContext } from './calendar/LayoutContext.mjs'
import { PreferencesContext } from './calendar/PreferencesContext.mjs'
import { useTheme } from '@emotion/react'
import hourglassPng from './assets/hourglass2.png'
import { LoggerProvider } from './calendar/Logger'
import { isOverlap } from './calendar/dateLogic.mjs'
const currentDate = dayjs()

function RootLayout({ children }) {
  const [expand, setExpand] = useState(false)

  console.log('rendering root')
  return (
    <ToggleMenuContext.Provider value={setExpand}>
      <Container
        maxWidth="md"
        disableGutters
        sx={{
          height: '100vh',
          // N.B. overflowX: hidden causes a persistent address bar
          // on mobile Y-scrolling in the DayPage component.
          // This is intentional, to prevent a "jumpy" interface while
          // scrolling, and also clips the TransitionGroup animations.
          overflowX: 'hidden',
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
      isOverlap(startOfDay, endOfDay, e.start.dateTime, e.end.dateTime)
    )
  }, [view, eventList, expandedDate])

  // return (
  //   <RootLayout>
  //     <Paper
  //       elevation={1}
  //       sx={{
  //         width: '100%',
  //         flexShrink: 0,
  //         position: 'relative',
  //       }}
  //     >
  //       <div style={{
  //         position: 'sticky',
  //         top: 0,
  //         backgroundColor: '#222',
  //         width: '100%',
  //         height: '3.5rem',
  //       }}>Header mockup</div>
  //       <div
  //         style={{
  //           backgroundColor: '#533',
  //           height: '4000px',
  //           flexShrink: 0,
  //         }}
  //       >
  //         Lorem ipsum, dolor sit amet consectetur adipisicing elit. Alias culpa
  //         repellat, eaque natus voluptas fugit perspiciatis sapiente labore
  //         distinctio optio minus! Reiciendis rerum veritatis dolores vel! Omnis
  //         fuga quia dolores numquam consequatur quaerat labore fugit, suscipit
  //         consectetur est, illum dolor obcaecati porro animi assumenda earum
  //         veniam! Commodi dolore sunt, ipsa pariatur, eos corporis quo, nisi
  //         mollitia odit aut deserunt voluptatem.
  //       </div>
  //     </Paper>
  //   </RootLayout>
  // )

  return (
    <LoggerProvider>
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
              <Slide direction="left" timeout={350}>
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
              <Slide direction="left" timeout={350}>
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
              <Slide direction="left" timeout={350}>
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
              </Slide>
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
