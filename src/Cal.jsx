import {
  Box,
  Container,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ThemeProvider,
  Typography,
  styled,
  CssBaseline,
  Collapse,
  Button,
  Divider,
} from '@mui/material'
import digitalTheme from './blueDigitalTheme'
import { useMemo, useRef, useState } from 'react'
import * as dayjs from 'dayjs'
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import { TransitionGroup } from 'react-transition-group'

const log = console.log.bind(console)
const currentDate = dayjs()
const weekdayAbbreviations = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function createSampleEvent({ startTime, endTime, summary }) {
  return {
    // text
    id: String((Math.random() * 1e6).toFixed()),
    // RFC3339-compatible datetime
    created: dayjs(),
    // RFC3339-compatible datetime
    updated: dayjs(),
    // text
    summary: summary || 'Default Title',
    // text
    description: 'Detailed description',
    // object: creator: id <string> -- not yet exposed
    // object
    start: {
      // RFC3339-compatible datetime
      dateTime: startTime,
    },
    // object
    end: {
      // RFC3339-compatible datetime
      dateTime: endTime || startTime.add(1, 'hour'),
    },
    // array
    //recurrence: ['string'], c.f. RFC 5545 -- not yet implemented
  }
}

function createSampleWeek(aroundDate) {
  const labels = ['Work', 'Study', 'Exercise']
  const startOfPriorWeek = aroundDate.subtract(1, 'week').startOf('week')
  const sampleEvents = []

  log('check: ', startOfPriorWeek.add(23, 'hours').format('MMM DD HH:mm:ss'))
  for (let i = 0; i < 180; i++) {
    // Split a three-week interval into random 15-minute chunks:
    const offsetMinutes = Math.trunc(Math.random() * 2016) * 15
    const startTime = startOfPriorWeek.add(offsetMinutes, 'minutes')
    const eventDuration = Math.trunc(Math.random() * 16 + 1) * 15
    const endTime = startTime.add(eventDuration, 'minutes')
    const summary = labels[Math.trunc(Math.random() * labels.length)]

    sampleEvents.push(createSampleEvent({ startTime, endTime, summary }))
  }

  log(
    sampleEvents.map(
      e =>
        `${e.summary}: ${e.start.dateTime.format(
          'MMM DD HH:mm:ss'
        )} - ${e.end.dateTime.format('MMM DD HH:mm:ss')}`
    )
  )

  return sampleEvents
}

const sampleEvents = createSampleWeek(dayjs())
log('Of those, the overlaps with today are:')
log(
  sampleEvents
    .filter(e =>
      isOverlap(
        dayjs().startOf('day'),
        dayjs().endOf('day'),
        e.start.dateTime,
        e.end.dateTime
      )
    )
    .map(
      o =>
        `${o.summary} ${o.start.dateTime.format(
          'MMM DD HH:mm:ss'
        )} -- ${o.end.dateTime.format('MMM DD HH:mm:ss')}`
    )
)

/**
 * Determine if two time intervals overlap.
 * Edge-only intersections are not counted as overlapping.
 */
function isOverlap(firstStart, firstEnd, secondStart, secondEnd) {
  if (!firstStart.isBefore(secondEnd)) return false
  if (!firstEnd.isAfter(secondStart)) return false
  return true
}

const mockStyles = new Map([
  ['Work', { backgroundColor: '#5283a8', fontSize: '0.75em' }],
  ['Study', { backgroundColor: '#e9a47d', fontSize: '0.75em' }],
  ['Exercise', { backgroundColor: '#d0518e', fontSize: '0.75em' }],
  ['Default', { backgroundColor: 'midnightblue', fontSize: '0.75em' }],
])

function EventWindow({ initial, final, event, indent = 0, columns = 1 }) {
  if (!event) return null

  // Crop the event duration to fit the window
  const fragmentStart = initial.isBefore(event.start.dateTime)
    ? event.start.dateTime
    : initial
  const fragmentEnd = final.isAfter(event.end.dateTime)
    ? event.end.dateTime
    : final

  const topOffset = fragmentStart.diff(initial)
  const windowLength = fragmentEnd.diff(fragmentStart)
  const intervalSize = final.diff(initial)

  return (
    <div
      style={{
        ...mockStyles.get(event.summary),
        position: 'absolute',
        top: (topOffset / intervalSize) * 100 + '%',
        left: indent * (100 / columns) + '%',
        boxShadow: '0px 0px 16px inset #008',
        borderRadius: '8px',
        height: (windowLength / intervalSize) * 100 + '%',
        width: 100 / columns + '%',
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        padding: '0.5rem',
      }}
    >
      {event.summary}<br />
      {event.start.dateTime.format('MMM DD HH:mm:ss')}
      -- {event.end.dateTime.format('MMM DD HH:mm:ss')}
      <br /> indent: {indent}
    </div>
  )
}

function DayBreakdown({ day, unfilteredEvents }) {
  console.time('DayBreakdown rendering')
  const startOfDay = day.startOf('day')
  const endOfDay = day.endOf('day')

  const relevantEvents = unfilteredEvents.filter(e =>
    isOverlap(startOfDay, endOfDay, e.start.dateTime, e.end.dateTime)
  )

  relevantEvents.forEach(e => {
    e.indent = 0
    e.overlaps = 0
  })

  // Calculate indentation in case of overlapping events
  const columns = []
  // Place each event in a position which does not overlap any other event
  for (const e of relevantEvents) {
    // Find the first unoccupied column for this event

    let placed = false

    for (const column of columns) {
      let available = true

      // If any prior element of this column overlaps, the column is unavailable
      for (const entry of column) {
        if (
          isOverlap(
            entry.start.dateTime,
            entry.end.dateTime,
            e.start.dateTime,
            e.end.dateTime
          )
        ) {
          available = false
          break
        } 
      }

      if (available) {
        column.push(e)
        placed = true
        break
      }
    }

    if (!placed) {
      log('creating new column for ', e)
      columns.push([e])
    }
  }

  // Record the calculated indentation values
  for (const [indent, column] of columns.entries()) {
    for (const event of column) {
      event.indent = indent
    }
  }

  log('relevantEvents: ', relevantEvents)

  // debug -- temporary
  // later add support for double-booking, more efficient structure
  const blocks = Array(24 * 4).fill(null)

  //log('Working with this list of relevant events:', relevantEvents)

  let t = startOfDay
  for (let i = 0; i < blocks.length; i++) {
    blocks[i] = (
      <div key={i} style={{...mockStyles.get('Default'), opacity: 0.5}}>
        {t.format('HH:mm')}
      </div>
    )

    for (const e of relevantEvents) {
      if (
        isOverlap(e.start.dateTime, e.end.dateTime, t, t.add(15, 'minutes'))
      ) {
        blocks[i] = (
          <div key={i} style={{...mockStyles.get(e.summary), opacity: 0.5}}>
            {t.format('HH:mm')} {e.summary}
          </div>
        )
      }
    }
    t = t.add(15, 'minutes')
  }

  console.timeEnd('DayBreakdown rendering')
  return (
    <div style={{ position: 'relative' }}>
      {blocks}
      {relevantEvents.map((r, i) => (
        <EventWindow
          key={i}
          initial={startOfDay}
          final={endOfDay}
          event={r}
          columns={columns.length}
          indent={r.indent}
        />
      ))}
    </div>
  )
}

function Demo() {
  const containerRef = useRef(null)
  const [expandedDate, setExpandedDate] = useState(null)
  return (
    <Container maxWidth="sm" ref={containerRef}>
      <Typography variant="h6" color="primary.dark" mt={4}>
        Component testing
      </Typography>
      <Divider sx={{ mb: 6 }} />

      <DayBreakdown day={dayjs()} unfilteredEvents={sampleEvents} />
      <TransitionGroup>
        {!expandedDate && (
          <Collapse timeout={350}>
            <div>
              <MonthlyCalendar
                initialDate={currentDate}
                onExpand={date => setExpandedDate(date)}
              />
            </div>
          </Collapse>
        )}
        {expandedDate && (
          <Collapse timeout={350}>
            <div>
              <WeeklyCalendar
                key={(expandedDate || currentDate).format('MM D')}
                initialDate={expandedDate || currentDate}
              />
              <Button onClick={() => setExpandedDate(null)}>Back</Button>
            </div>
          </Collapse>
        )}
      </TransitionGroup>
    </Container>
  )
}

function WeeklyCalendar({ initialDate }) {
  const [active, setActive] = useState(initialDate)

  const calendarBody = useMemo(() => {
    log(`📆 (${(Math.random() * 1000).toFixed()}) memoizing week display`)
    const days = []
    const startOfWeek = active.startOf('week')
    const endOfWeek = active.endOf('week')

    let d = startOfWeek
    while (d.isBefore(endOfWeek)) {
      days.push(d)
      d = d.add(1, 'day')
    }

    return (
      <TableBody>
        <TableRow>
          {days.map(d => (
            <TableCell key={d.format('MM D')}>
              <Typography sx={{ wordBreak: 'break-all' }}>
                {d.format('D')} ...
              </Typography>
            </TableCell>
          ))}
        </TableRow>
      </TableBody>
    )
  }, [active])

  log(`(${(Math.random() * 1000).toFixed()}) Rendering weekly calendar`)
  return (
    <Box>
      <Paper elevation={1} sx={{ px: 2, py: 2 }}>
        <Stack direction="row">
          <IconButton
            aria-label="previous week"
            onClick={() => setActive(active.subtract(1, 'week'))}
          >
            <NavigateBeforeIcon />
          </IconButton>

          <Stack direction="row" flexWrap="wrap" sx={{ mt: 1, mb: 4 }}>
            <Typography
              variant="h5"
              component="div"
              sx={{ width: '100%', mb: 3 }}
            >
              Week of {active.startOf('week').format('MMMM D, YYYY')}
            </Typography>

            <TableContainer component={Paper}>
              <Table>
                <ExpandedWeekHeader sunday={active.startOf('week')} />
                {calendarBody}
              </Table>
            </TableContainer>
          </Stack>

          <IconButton
            aria-label="next week"
            onClick={() => setActive(active.add(1, 'week'))}
          >
            <NavigateNextIcon />
          </IconButton>
        </Stack>
      </Paper>
    </Box>
  )
}

const HoverableRow = styled(TableRow)(({ theme }) => ({
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}))

function WeekdayHeader() {
  return (
    <TableHead>
      <TableRow>
        {weekdayAbbreviations.map(d => (
          <TableCell key={d}>{d}</TableCell>
        ))}
      </TableRow>
    </TableHead>
  )
}

function ExpandedWeekHeader({ sunday }) {
  const headingCells = []
  const endOfWeek = sunday.endOf('week')
  let d = sunday

  while (d.isBefore(endOfWeek)) {
    headingCells.push(
      <TableCell align="center" key={d.format('D')}>
        <Typography variant="caption">{d.format('ddd')}</Typography>
        <Typography variant="h5">{d.format('D')}</Typography>
      </TableCell>
    )
    d = d.add(1, 'day')
  }

  return (
    <TableHead>
      <TableRow>{headingCells}</TableRow>
    </TableHead>
  )
}

function MonthlyCalendar({ initialDate, onExpand }) {
  const [active, setActive] = useState(initialDate)
  const month = active.format('MMMM')
  const year = active.year()

  const calendarBody = useMemo(() => {
    log(`📆 (${(Math.random() * 1000).toFixed()}) memoizing month display`)
    const days = []
    const startOfMonth = active.startOf('month')
    const endOfMonth = active.endOf('month')

    let d = startOfMonth
    let pad = d.day(0)

    while (pad.isBefore(d)) {
      days.push(pad)
      pad = pad.add(1, 'day')
    }

    while (d.isBefore(endOfMonth)) {
      days.push(d)
      d = d.add(1, 'day')
    }

    while (d.day() !== 0) {
      days.push(d)
      d = d.add(1, 'day')
    }

    const body = []

    // Build a TableRow for every week
    for (let i = 0; i < days.length; i += 7) {
      const week = []
      for (let j = i; j < i + 7; j++) {
        const day = days[j]
        week.push(
          <TableCell key={day.format('MM D')}>
            <Typography
              sx={{
                opacity:
                  day.isBefore(startOfMonth) || day.isAfter(endOfMonth)
                    ? 0.2
                    : undefined,
              }}
            >
              {day.format('D')}
            </Typography>
          </TableCell>
        )
      }

      body.push(
        <HoverableRow
          key={days[i].format('MM D')}
          onClick={() => onExpand(days[i])}
        >
          {week}
        </HoverableRow>
      )
    }

    return <TableBody>{body}</TableBody>
  }, [active, onExpand])

  log(`(${(Math.random() * 1000).toFixed()}) Rendering monthly calendar`)
  return (
    <Box>
      <Paper elevation={1} sx={{ px: 2, py: 2 }}>
        <Stack direction="row">
          <IconButton
            aria-label="previous month"
            onClick={() => setActive(active.subtract(1, 'month'))}
          >
            <NavigateBeforeIcon />
          </IconButton>

          <Stack direction="row" flexWrap="wrap" sx={{ mt: 1, mb: 4 }}>
            <Typography
              variant="h4"
              component="div"
              sx={{ width: '100%', mb: 3 }}
            >
              {month} {year}
            </Typography>

            <TableContainer component={Paper}>
              <Table>
                <WeekdayHeader />
                {calendarBody}
              </Table>
            </TableContainer>
          </Stack>

          <IconButton
            aria-label="next month"
            onClick={() => setActive(active.add(1, 'month'))}
          >
            <NavigateNextIcon />
          </IconButton>
        </Stack>
      </Paper>
    </Box>
  )
}

function Wrap() {
  return (
    <ThemeProvider theme={digitalTheme}>
      <CssBaseline>
        <Demo />
      </CssBaseline>
    </ThemeProvider>
  )
}

export default Wrap
