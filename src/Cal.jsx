import {
  Box,
  Container,
  IconButton,
  Paper,
  Stack,
  ThemeProvider,
  Typography,
} from '@mui/material'
import { CssBaseline } from '@mui/material'
import digitalTheme from './blueDigitalTheme'
import { useMemo, useState } from 'react'
import * as dayjs from 'dayjs'
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'

const log = console.log.bind(console)

function Demo() {
  return (
    <Container maxWidth="sm">
      <p>Demo entry point</p>
      <MonthlyCalendar />
    </Container>
  )
}

function DayCard({ children }) {
  return (
    <Box
      width="14.2%"
      height="40px"
      sx={{ backgroundColor: '#fff1', border: '1px solid #0004' }}
    >
      {children}
    </Box>
  )
}

function WeekdayHeader() {
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
    <DayCard key={d}>{d}</DayCard>
  ))
}

const currentDate = dayjs()

function MonthlyCalendar() {
  const [active, setActive] = useState(currentDate)
  const month = active.format('MMMM')
  const year = active.year()

  const calendarBody = useMemo(() => {
    log(`📆 (${(Math.random() * 1000).toFixed()}) memoizing day list`)
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

    return days.map(d => (
      <DayCard key={d.format('MM D')}>
        <Typography
          sx={{
            opacity:
              d.isBefore(startOfMonth) || d.isAfter(endOfMonth)
                ? 0.2
                : undefined,
          }}
        >
          {d.format('D')}
        </Typography>
      </DayCard>
    ))
  }, [active])

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
            <WeekdayHeader />
            {calendarBody}
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
