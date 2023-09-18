import { ThemeProvider } from '@mui/material/styles'
import {
  Container,
  Typography,
  CssBaseline,
  Collapse,
  Divider,
} from '@mui/material'
import digitalTheme from './blueDigitalTheme'
import { useRef, useState } from 'react'
import * as dayjs from 'dayjs'
import { TransitionGroup } from 'react-transition-group'
import { useEventList } from './calendar/mockCalendar.mjs'
import { WeeklyCalendar } from './calendar/WeeklyCalendar'
import { MonthlyCalendar } from './calendar/MonthlyCalendar'
import { DayPage } from './calendar/DayPage'

const currentDate = dayjs()

function Demo() {
  const [eventList, dispatchEventList] = useEventList()
  const [mode, setMode] = useState('month')
  const containerRef = useRef(null)
  const [expandedDate, setExpandedDate] = useState(null)
  return (
    <Container maxWidth="sm" ref={containerRef}>
      <Typography variant="h6" color="primary.dark" mt={4}>
        Component testing
      </Typography>
      <Divider sx={{ mb: 6 }} />

      <TransitionGroup>
        {mode === 'month' && (
          <Collapse timeout={350}>
            <MonthlyCalendar
              initialDate={currentDate}
              unfilteredEvents={eventList}
              onExpand={date => {
                setExpandedDate(date)
                setMode('week')
              }}
            />
          </Collapse>
        )}
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
              onUpdate={updates =>
                dispatchEventList({
                  type: 'update',
                  id: updates.id,
                  updates,
                })
              }
              onDelete={id =>
                dispatchEventList({
                  type: 'delete',
                  id: id,
                })
              }
            />
          </Collapse>
        )}
      </TransitionGroup>
    </Container>
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
