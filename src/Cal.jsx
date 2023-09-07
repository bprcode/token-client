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
  Divider,
  createTheme,
} from '@mui/material'
import digitalTheme from './blueDigitalTheme'
import { useMemo, useRef, useState } from 'react'
import * as dayjs from 'dayjs'
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import KeyboardDoubleArrowUpIcon from '@mui/icons-material/KeyboardDoubleArrowUp'
import KeyboardDoubleArrowDownIcon from '@mui/icons-material/KeyboardDoubleArrowDown'
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
    description: summary !== 'Exercise' && 'Detailed description',
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

// Using MUI utility method augmentColor to generate palette entries
const defaultTheme = createTheme({
  palette: { tonalOffset: 0.25 },
})
const mockStyles = new Map([
  [
    'Work',
    {
      accentColor: '#5283a8',
      fontSize: '0.75em',
      augmentedColors: defaultTheme.palette.augmentColor({
        color: { main: '#5283a8' },
      }),
    },
  ],
  [
    'Study',
    {
      accentColor: '#e9a47d',
      fontSize: '0.75em',
      augmentedColors: defaultTheme.palette.augmentColor({
        color: { main: '#e9a47d' },
      }),
    },
  ],
  [
    'Exercise',
    {
      accentColor: '#d0518e',
      fontSize: '0.75em',
      augmentedColors: defaultTheme.palette.augmentColor({
        color: { main: '#d0518e' },
      }),
    },
  ],
  [
    'Default',
    {
      accentColor: '#00004C',
      fontSize: '0.75em',
      augmentedColors: defaultTheme.palette.augmentColor({
        color: { main: '#00004C' },
      }),
    },
  ],
])

function EventPane({
  initial,
  final,
  event,
  indent = 0,
  columns = 1,
  label = 'detailed',
}) {
  if (!event) return null

  const overflowBefore = event.start.dateTime.isBefore(initial)
  const overflowAfter = event.end.dateTime.isAfter(final)
  // Crop the event duration to fit the window
  const fragmentStart = overflowBefore ? initial : event.start.dateTime
  const fragmentEnd = overflowAfter ? final : event.end.dateTime

  const topOffset = fragmentStart.diff(initial)
  const windowLength = fragmentEnd.diff(fragmentStart)
  const intervalSize = final.diff(initial)

  const referenceStyle = mockStyles.get(event.summary) || {}
  const accentColor = referenceStyle.augmentedColors.main || 'gray'
  const shadeColor = referenceStyle.augmentedColors.dark || '#111'

  const borderStyles =
    label !== 'none'
      ? {
          borderLeft: `0.125rem ${accentColor} solid`,
          borderRight: `0.125rem ${accentColor} solid`,
          borderTop:
            `0.125rem ${accentColor} ` + (overflowBefore ? 'dashed' : 'solid'),
          borderBottom:
            `0.125rem ${accentColor} ` + (overflowAfter ? 'dashed' : 'solid'),
        }
      : {}

  let header = null
  let details = null

  if (label === 'brief') {
    header = event.summary
  }

  if (label === 'detailed') {
    header = event.summary
    details = (
      <div
        style={{
          paddingLeft: '0.25rem',
          paddingRight: '0.25rem',
        }}
      >
        {event.start.dateTime.format('MMM DD HH:mm:ss')} &ndash;{' '}
        {event.end.dateTime.format('MMM DD HH:mm:ss')}
        {event.description && (
          <>
            <br />
            {event.description}
            &mdash;Lorem ipsum dolor sit, amet consectetur adipisicing elit.
            Dolor, qui illum dolorum, quaerat corporis dolores optio
            exercitationem totam perspiciatis libero aliquid provident ullam
            similique aut in temporibus autem eligendi obcaecati vel facere at!
            Temporibus eius, iure voluptatibus est dolorem porro. Adipisci
            blanditiis tempora ad architecto reprehenderit deleniti dolor sunt
            officia?
            <br />
          </>
        )}
      </div>
    )
  }

  const overflowArrows = (
    <>
      {overflowBefore && (
        <div
          style={{
            position: 'absolute',
            left: 'calc(50% - 8px)',
            top: -24,
          }}
        >
          <KeyboardDoubleArrowUpIcon
            sx={{ fontSize: 16, mb: -0.5, color: accentColor }}
          />
        </div>
      )}
      {overflowAfter && (
        <div
          style={{
            position: 'absolute',
            left: 'calc(50% - 8px)',
            top: '100%',
          }}
        >
          <KeyboardDoubleArrowDownIcon
            sx={{ fontSize: 16, mb: -0.5, color: accentColor }}
          />
        </div>
      )}
    </>
  )

  return (
    <>
      <div
        style={{
          position: 'absolute',
          top: (topOffset / intervalSize) * 100 + '%',
          left: indent * (100 / columns) + '%',
          height: (windowLength / intervalSize) * 100 + '%',
          width: 100 / columns + '%',
          zIndex: 1,
        }}
      >
        {overflowArrows}

        {/* Inner container -- overflow hidden */}
        <div
          style={{
            boxShadow: label === 'none' && `0px 0px 1rem ${shadeColor} inset`,
            ...borderStyles,
            ...referenceStyle,
            backgroundColor: label === 'detailed' ? '#223' : accentColor,

            overflow: 'hidden',
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* pane header */}
          <div
            style={{
              backgroundColor: accentColor,
              color: referenceStyle.augmentedColors.contrastText,
              paddingLeft: '0.25rem',
              paddingRight: '0.25rem',
              whiteSpace: 'nowrap',
            }}
          >
            {header}
          </div>
          {/* pane body */}
          {details && (
            <div
              style={{
                display: 'flex',
                flexGrow: 1,
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              {details}

              {event.description && (
                // fade-out overlay to indicate possible overflowing text:
                <div
                  style={{
                    height: '2em',
                    width: '100%',
                    position: 'absolute',
                    bottom: 0,
                    background: 'linear-gradient(to top, #223, transparent)',
                  }}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* drop shadow mock pseudo-element for correct z-indexing: */}
      <div
        style={{
          position: 'absolute',
          top: (topOffset / intervalSize) * 100 + '%',
          left: indent * (100 / columns) + '%',
          height: (windowLength / intervalSize) * 100 + '%',
          width: 100 / columns + '%',
          boxShadow: '0.25rem 0.25rem 0.5rem #000',
        }}
      />
    </>
  )
}

function DailyBreakdown({ day, unfilteredEvents, style, labels = 'detailed' }) {
  console.time('DailyBreakdown rendering')

  const startOfDay = day.startOf('day')
  const endOfDay = day.endOf('day')

  const relevantEvents = unfilteredEvents.filter(e =>
    isOverlap(startOfDay, endOfDay, e.start.dateTime, e.end.dateTime)
  )

  const blocking = new WeakMap()
  for (const r of relevantEvents) blocking.set(r, 0)

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
      columns.push([e])
    }
  }

  // Record the calculated indentation values
  for (const [indent, column] of columns.entries()) {
    for (const event of column) {
      blocking.set(event, indent)
      event.indent = indent
    }
  }

  // Render the event cards
  const rendered = (
    <div style={{ height: '100%', ...style, position: 'relative' }}>
      {relevantEvents.map((r, i) => (
        <EventPane
          key={i}
          initial={startOfDay}
          final={endOfDay}
          event={r}
          columns={columns.length}
          indent={blocking.get(r)}
          label={labels}
        />
      ))}
    </div>
  )

  console.timeEnd('DailyBreakdown rendering')

  return rendered
}

function DemoBreakdown({ day, unfilteredEvents }) {
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
      <div key={i} style={{ ...mockStyles.get('Default'), opacity: 0.5 }}>
        {t.format('HH:mm')}
      </div>
    )

    for (const e of relevantEvents) {
      if (
        isOverlap(e.start.dateTime, e.end.dateTime, t, t.add(15, 'minutes'))
      ) {
        blocks[i] = (
          <div key={i} style={{ ...mockStyles.get(e.summary), opacity: 0.5 }}>
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
        <EventPane
          key={i}
          initial={startOfDay}
          final={endOfDay}
          event={r}
          columns={columns.length}
          indent={r.indent}
          label="detailed"
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

      <DemoBreakdown day={currentDate} unfilteredEvents={sampleEvents} />
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
                onBack={() => setExpandedDate(null)}
                key={(expandedDate || currentDate).format('MM D')}
                initialDate={expandedDate || currentDate}
                eventList={sampleEvents}
              />
            </div>
          </Collapse>
        )}
      </TransitionGroup>
    </Container>
  )
}

const StyledAlternateCell = styled(TableCell)(_ => ({
  // backgroundColor: 'green',
  '&:nth-of-type:(odd)': { backgroundColor: 'blue' },
}))

function WeeklyCalendar({ initialDate, onBack, eventList = [] }) {
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
            // additional y-padding to fit overflow indicator arrows:
            <StyledAlternateCell key={d.format('MM D')} sx={{ px: 0, py: 3 }}>
              <DailyBreakdown
                day={d}
                unfilteredEvents={eventList}
                style={{ height: '500px' }}
                labels="none"
              />
            </StyledAlternateCell>
          ))}
        </TableRow>
      </TableBody>
    )
  }, [active, eventList])

  log(`(${(Math.random() * 1000).toFixed()}) Rendering weekly calendar`)
  return (
    <Box>
      <Paper elevation={1} sx={{ px: 2, py: 2 }}>
        <Stack direction="row">
          <Stack>
            <IconButton
              sx={{ mt: 1 }}
              aria-label="back to monthly view"
              onClick={onBack}
            >
              <ArrowBackIcon />
            </IconButton>

            <IconButton
              sx={{ flexGrow: 1 }}
              aria-label="previous week"
              onClick={() => setActive(active.subtract(1, 'week'))}
            >
              <NavigateBeforeIcon />
            </IconButton>
          </Stack>

          <Stack direction="row" flexWrap="wrap" sx={{ mt: 1, mb: 4 }}>
            <Typography variant="h5" component="div" sx={{ width: '100%' }}>
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
