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

export function WeeklyCalendar({
  initialDate,
  onBack,
  onExpand,
  eventList = [],
}) {
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
            <StyledAlternateCell
              key={d.format('MM D')}
              sx={{ px: 1, py: 3 }}
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
  }, [active, eventList, onExpand])

  log(`(${(Math.random() * 1000).toFixed()}) Rendering weekly calendar`)
  return (
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
  )
}
