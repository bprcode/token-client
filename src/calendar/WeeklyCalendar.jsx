import {
  IconButton,
  Paper,
  Typography,
  useMediaQuery,
  Box,
} from '@mui/material'
import { useMemo, useState } from 'react'
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { DailyBreakdown } from './DailyBreakdown'
import { log } from './log.mjs'
import { HoverableBox, alternatingShades } from '../blueDigitalTheme'

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

  return (
    <Box
      sx={{
        display: 'flex',
        position: 'relative',
        width: '100%',
        height: '100%',
        marginLeft: 'auto',
        marginRight: 'auto',
        px: [1, 2],
        overflowY: 'auto',
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

      <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
        <Typography
          variant={typeVariant}
          component="div"
          sx={{ width: '100%', mt: 1, mb: 1 }}
        >
          <IconButton aria-label="back to monthly view" onClick={onBack}>
            <ArrowBackIcon />
          </IconButton>
          Week of {date.startOf('week').format('MMMM D, YYYY')}
        </Typography>

        <CalendarBody date={date} eventList={eventList} onExpand={onExpand} />
        <div style={{ height: '4rem', flexShrink: 0 }} />
      </div>

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
    </Box>
  )
}
