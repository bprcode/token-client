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
} from '@mui/material'
import { CssBaseline } from '@mui/material'
import digitalTheme from './blueDigitalTheme'
import { useMemo, useState } from 'react'
import * as dayjs from 'dayjs'
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'

const log = console.log.bind(console)
const currentDate = dayjs()

function Demo() {
  const [expandedDate, setExpandedDate] = useState(null)

  return (
    <Container maxWidth="sm">
      <p>Demo entry point</p>

      <MonthlyCalendar
        initialDate={currentDate}
        onExpand={date => setExpandedDate(date)}
      />

      {expandedDate && (
        <WeeklyCalendar
          key={expandedDate.format('MM D')}
          initialDate={expandedDate}
        />
      )}
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
              <Typography>{d.format('D')}</Typography>
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
                <WeekdayHeader />
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
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <TableCell key={d}>{d}</TableCell>
        ))}
      </TableRow>
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
    <Box sx={{ border: '1px dashed #0af' }}>
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
