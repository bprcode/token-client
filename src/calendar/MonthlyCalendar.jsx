import {
  Box,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Typography,
  styled,
} from '@mui/material'
import { useMemo, useState } from 'react'
import * as dayjs from 'dayjs'
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import { AbbreviatedBreakdown } from './AbbreviatedBreakdown'
import { WeekdayHeader } from './WeekdayHeader'
import { log } from './log.mjs'

const HoverableRow = styled(TableRow)(({ theme }) => ({
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}))

export function MonthlyCalendar({ initialDate, onExpand, unfilteredEvents }) {
  const [active, setActive] = useState(initialDate)
  const month = active.format('MMMM')
  const year = active.year()

  const calendarBody = useMemo(() => {
    log(`📆 (${(Math.random() * 1000).toFixed()}) memoizing month display`)
    const days = []
    const today = dayjs()
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
          <TableCell
            key={day.format('MM D')}
            sx={{
              paddingLeft: 0.25,
              paddingRight: 0.25,
              paddingTop: 0.25,
              paddingBottom: 1.25,
              height: '5rem',
              verticalAlign: 'top',
              maxWidth: '1px',
              overflow: 'hidden',
            }}
          >
            {day.isSame(today, 'day') ? (
              <Typography
                component="span"
                sx={{
                  backgroundColor: 'secondary.main',
                  color: 'secondary.contrastText',
                  paddingLeft: 0.5,
                  paddingRight: 0.5,
                  borderRadius: 2,
                }}
              >
                {day.format('D')}
              </Typography>
            ) : (
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
            )}

            <AbbreviatedBreakdown
              day={day}
              unfilteredEvents={unfilteredEvents}
            />
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
  }, [active, onExpand, unfilteredEvents])

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

          <Stack
            direction="row"
            flexWrap="wrap"
            sx={{ mt: 1, mb: 4, flexGrow: 1 }}
          >
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
