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
} from '@mui/material'
import digitalTheme from './blueDigitalTheme'
import { useContext, useState } from 'react'
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
        sx={{ border: '3px solid purple', height: '100vh', overflow: 'hidden', }}
      >
        <Box sx={{ border: '4px solid red', height: '100%', overflow: 'hidden', display: 'flex' }}>
          <Sidebar />

          <div style={{ border: '1px dashed yellow', flexGrow: 1, height: '100%', overflowY: 'auto', }}>
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
          zIndex: 2,
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

function Demo() {
  const preferences = useContext(PreferencesContext)
  const [eventListHistory, dispatchEventListHistory] = useEventListHistory()
  const eventList = eventListHistory[eventListHistory.length - 1]
  const dispatchEventList = dispatchEventListHistory
  const canUndo = eventListHistory.length > 1

  const [mode, setMode] = useState('month')
  const [expandedDate, setExpandedDate] = useState(null)

  return (
    <RootLayout>
      <Paper elevation={1} sx={{
        minHeight: '100%',
        // overflowY: 'auto',
        border: '5px solid green',
        }}>
      {/* <TransitionGroup>
        {mode === 'month' && ( */}
          <Collapse timeout={350} in={true}>
            <MonthlyCalendar
              initialDate={currentDate}
              unfilteredEvents={eventList}
              onExpand={date => {
                setExpandedDate(date)
                setMode('week')
              }}
            />
          </Collapse>
        {/* )}
        {mode === 'week' && (
          <Collapse timeout={350}>
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
          </Collapse>
        )}
        {mode === 'day' && (
          <Collapse timeout={350}>
            <DayPage
              onBack={() => setMode('week')}
              day={expandedDate}
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
          </Collapse>
        )}
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
