import { ThemeProvider } from '@mui/material/styles'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import MenuIcon from '@mui/icons-material/Menu'
import {
  Container,
  Typography,
  CssBaseline,
  Collapse,
  Divider,
  useMediaQuery,
  Drawer,
  List,
  ListItemButton,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  IconButton,
  Paper,
  Button,
  Grow,
  Slide,
} from '@mui/material'
import digitalTheme from './blueDigitalTheme'
import { useContext, useEffect, useRef, useState } from 'react'
import dayjs from 'dayjs'
import { TransitionGroup } from 'react-transition-group'
import { useEventListHistory } from './calendar/mockCalendar.mjs'
import { WeeklyCalendar } from './calendar/WeeklyCalendar'
import { MonthlyCalendar } from './calendar/MonthlyCalendar'
import { DayPage } from './calendar/DayPage'
import { LayoutContext } from './calendar/LayoutContext.mjs'
import { PreferencesContext } from './calendar/PreferencesContext.mjs'

const currentDate = dayjs()

function RootLayout({ children }) {
  const layoutQuery = useMediaQuery('(max-width: 600px)') ? 'mobile' : 'wide'

  return (
    <LayoutContext.Provider value={layoutQuery}>
      <Container
        maxWidth="md"
        disableGutters
        sx={{ border: '3px solid purple', height: '100vh', overflow: 'hidden' }}
      >
        <Box
          sx={{
            border: '4px solid red',
            height: '100%',
            display: 'flex',
          }}
        >
          <Sidebar />

          <div
            style={{
              border: '2px dashed yellow',
              flexGrow: 1,
            }}
          >
            {children}
          </div>
        </Box>
      </Container>
    </LayoutContext.Provider>
  )
}

function Sidebar({ width = '240px' }) {
  const isNarrow = useMediaQuery('(max-width: 800px)')
  const [menuOpen, setMenuOpen] = useState(false)

  const content = (
    <>
      <Typography variant="h6" px={1} py={2}>
        <CalendarMonthIcon /> Branding
      </Typography>
      <Divider />
      <List disablePadding sx={{}}>
        {['Item One', 'Item Two', 'Item Three'].map(text => (
          <ListItem key={text} disablePadding>
            <ListItemButton>
              <ListItemIcon>
                <CalendarMonthIcon />
              </ListItemIcon>
              <ListItemText primary={text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </>
  )

  return isNarrow ? (
    // Narrow, drawer with icon
    <>
      <IconButton
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 1,
        }}
        onClick={() => setMenuOpen(true)}
      >
        <MenuIcon fontSize="large" />
      </IconButton>
      <Drawer open={menuOpen} onClose={() => setMenuOpen(false)}>
        {content}
        <Divider />
      </Drawer>
    </>
  ) : (
    // Wide, always visible
    <nav style={{ width, flexShrink: 0, backgroundColor: '#0f42' }}>
      {content}
    </nav>
  )
}

function Carousel({ children = [], index }) {
  const [animating, setAnimating] = useState(false)
  const count = Array.isArray(children) ? children.length : 1
  const prev = index - 1 >= 0 ? index - 1 : count - 1
  const next = index + 1 < count ? index + 1 : 0

  useEffect(() => {
    setAnimating(true)
    console.log('start animating')
    setTimeout(() => {
      console.log('stop animating? index=', index)
      setAnimating(false)
    }, 1000)
  }, [index])

  if (count <= 1) return children

  return (
    <div
      style={{
        position: 'relative',
        border: '1px solid limegreen',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {animating && count >= 3 && (
        <div
          key={prev}
          style={{
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            position: 'absolute',
            transform: 'translateX(-100%)',
            transition: 'transform 1s ease-out',
          }}
        >
          {children[prev]}
        </div>
      )}

      <div
        key={index}
        style={{
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          position: 'absolute',
          transform: 'translateX(0)',
          transition: 'transform 1s ease-out',
        }}
      >
        {children[index]}
      </div>

      {animating && count >= 2 && (
        <div
          key={next}
          style={{
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            position: 'absolute',
            transform: 'translateX(100%)',
            transition: 'transform 1s ease-out',
          }}
        >
          {children[next]}
        </div>
      )}
    </div>
  )
}

function Demo() {
  const preferences = useContext(PreferencesContext)
  const [eventListHistory, dispatchEventListHistory] = useEventListHistory()
  const eventList = eventListHistory[eventListHistory.length - 1]
  const dispatchEventList = dispatchEventListHistory
  const canUndo = eventListHistory.length > 1

  const [mode, setMode] = useState('month')
  const [expandedDate, setExpandedDate] = useState(null)

  const [test, setTest] = useState(false)
  const [testIndex, setTestIndex] = useState(0)

  const carouselIndex = {
    month: 0,
    week: 1,
    day: 2,
  }[mode]
  console.log(carouselIndex)

  return (
    <RootLayout>
      <Paper
        elevation={1}
        sx={{
          height: '100%',
        }}
      >
        <Carousel index={carouselIndex}>
          {/* <TransitionGroup>
          {mode === 'month' && (
          <Collapse timeout={350}>*/}
          <MonthlyCalendar
            initialDate={currentDate}
            unfilteredEvents={eventList}
            onExpand={date => {
              setExpandedDate(date)
              setMode('week')
            }}
          />
          {/*</Collapse>
          )}

          {mode === 'week' && (
          <Collapse timeout={350}>*/}
          <WeeklyCalendar
            onBack={() => {
              setExpandedDate(null)
              setMode('month')
            }}
            key={(expandedDate || currentDate).format('MM D')}
            initialDate={expandedDate || currentDate}
            eventList={eventList}
            onExpand={date => {
              setExpandedDate(date)
              setMode('day')
            }}
          />
          {/*</Collapse>
          )}
          {mode === 'day' && ( */}
          {/* <Carousel index={0}> */}
          <DayPage
            onBack={() => setMode('week')}
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
        </Carousel>
        {/* </Carousel> */}
        {/* )}
         </TransitionGroup> */}
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
