import {
  IconButton,
  Paper,
  Typography,
  styled,
  useMediaQuery,
  Box,
} from '@mui/material'
import { useMemo, useState } from 'react'
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { DailyBreakdown } from './DailyBreakdown'
import { log } from './log.mjs'
import { alternatingShades } from '../blueDigitalTheme'

const HoverableBox = styled(Box)(({ theme }) => ({
  '&:hover': { backgroundColor: theme.palette.action.hover },
}))

function CalendarBody({ date, eventList, onExpand }) {
  return useMemo(() => {
    const days = []
    const startOfWeek = date.startOf('week')
    const endOfWeek = date.endOf('week')

    let d = startOfWeek
    while (d.isBefore(endOfWeek)) {
      days.push(d)
      d = d.add(1, 'day')
    }

    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          width: '100%',
          borderTop: '1px solid #aaf3',
          boxShadow: '1rem 1.5rem 2rem #0114',
        }}
      >
        {days.map((d, j) => (
          <HoverableBox
            key={d.format('MM D')}
            onClick={() => onExpand(d)}
            sx={{
              px: '0.25rem',
              pb: '1.5rem',
              backgroundColor: alternatingShades(j),
            }}
          >
            <Box
              align="center"
              key={d.format('D')}
              sx={{ pl: [0, 1], pr: [0, 1], pb: 3 }}
            >
              <Typography variant="caption">{d.format('ddd')}</Typography>
              <Typography variant="h5">{d.format('D')}</Typography>
            </Box>

            <DailyBreakdown
              day={d}
              unfilteredEvents={eventList}
              style={{ height: '350px' }}
              labels="none"
            />
          </HoverableBox>
        ))}
      </div>
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
  const typeVariant = useMediaQuery('(max-width: 380px)') ? 'subtitle1' : 'h5'

  log(`(${(Math.random() * 1000).toFixed()}) Rendering weekly calendar`)
  return (
    <Paper elevation={1} sx={{ px: [1, 2], py: [0, 2] }}>
      <Typography
        variant={typeVariant}
        component="div"
        sx={{ width: '100%', mb: 2 }}
      >
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
          sx={{
            display: ['none', 'block'],
            borderTopRightRadius: 0,
            borderBottomRightRadius: 0,
          }}
        >
          <NavigateBeforeIcon />
        </IconButton>

        <CalendarBody date={date} eventList={eventList} onExpand={onExpand} />

        <IconButton
          aria-label="next week"
          onClick={() => setDate(date.add(1, 'week'))}
          sx={{
            display: ['none', 'block'],
            borderBottomLeftRadius: 0,
            borderTopLeftRadius: 0,
          }}
        >
          <NavigateNextIcon />
        </IconButton>
      </div>
    </Paper>
  )
}
