import {
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableContainer,
  TableCell,
  TableRow,
  Typography,
  styled,
} from '@mui/material'
import { useMemo, useState } from 'react'
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { DailyBreakdown } from './DailyBreakdown'
import { ExpandedWeekHeader } from './ExpandedWeekHeader'
import { log } from './log.mjs'

const StyledAlternateCell = styled(TableCell)(({ theme }) => ({
  '&:nth-of-type(odd)': { backgroundColor: '#0004' },
  '&:hover': { backgroundColor: theme.palette.action.hover },
}))

function useCalendarBody({ date, eventList, onExpand }) {
  return useMemo(() => {
    log(`📆 (${(Math.random() * 1000).toFixed()}) memoizing week display`)
    const days = []
    const startOfWeek = date.startOf('week')
    const endOfWeek = date.endOf('week')

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
            <StyledAlternateCell
              key={d.format('MM D')}
              sx={{ px: [0.5,1], py: 3 }}
              onClick={() => onExpand(d)}
            >
              <DailyBreakdown
                day={d}
                unfilteredEvents={eventList}
                style={{ height: '350px' }}
                labels="none"
              />
            </StyledAlternateCell>
          ))}
        </TableRow>
      </TableBody>
    )
  }, [date, eventList, onExpand])
}

export function WeeklyCalendar({
  initialDate,
  onBack,
  onExpand,
  eventList = [],
}) {
  const [date, setDate] = useState(initialDate)
  const calendarBody = useCalendarBody({ date, eventList, onExpand })

  log(`(${(Math.random() * 1000).toFixed()}) Rendering weekly calendar`)
  return (
    <Paper elevation={1} sx={{ px: [1,2], py: 2}}>
      <Typography variant="h5" component="div" sx={{ width: '100%', mb: 2 }}>
        <IconButton aria-label="back to monthly view" onClick={onBack}>
          <ArrowBackIcon />
        </IconButton>
        Week of {date.startOf('week').format('MMMM D, YYYY')}
      </Typography>

      <div
        style={{
          display: 'flex',
          position: 'relative',
        }}
      >
        <IconButton
          aria-label="previous week"
          onClick={() => setDate(date.subtract(1, 'week'))}
          sx={{display: ['none', 'block'] }}
        >
          <NavigateBeforeIcon />
        </IconButton>
        <TableContainer component={Paper}>
          <Table>
            <ExpandedWeekHeader sunday={date.startOf('week')} />
            {calendarBody}
          </Table>
        </TableContainer>
        <IconButton
          aria-label="next week"
          onClick={() => setDate(date.add(1, 'week'))}
          sx={{display: ['none', 'block'] }}
        >
          <NavigateNextIcon />
        </IconButton>
      </div>
    </Paper>
  )
}
