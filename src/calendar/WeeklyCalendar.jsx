import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore'
import {
  IconButton,
  Typography,
  Box,
  Stack,
  useMediaQuery,
} from '@mui/material'
import { useMemo, useState } from 'react'
import { DailyBreakdown } from './DailyBreakdown'
import { HoverableBox, alternatingShades } from '../blueDigitalTheme'
import { ViewHeader } from './ViewHeader'

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
          paddingLeft: '0.5rem',
          paddingRight: '0.5rem',
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
  const isSmall = useMediaQuery('(max-width: 600px)')
  const [date, setDate] = useState(initialDate)

  const sunday = date.startOf('week')
  const saturday = sunday.add(6, 'days')
  const isRollover = sunday.month() !== saturday.month()
  const weekDescription = isSmall 
  ? sunday.format('MMM D') + ' – ' + saturday.format(isRollover ? 'MMM D' : 'D')
    :'Week of ' + sunday.format('MMMM D, YYYY')

  return (
    <Stack
      direction="column"
      sx={{
        mx: 'auto',
        width: '100%',
        height: '100%',
        overflowY: 'auto',
      }}
    >
      <ViewHeader>
        <IconButton aria-label="back to monthly view" onClick={onBack}>
          <CalendarMonthIcon />
        </IconButton>
        <IconButton
          aria-label="previous week"
          disableTouchRipple
          onClick={() => setDate(date.subtract(1, 'week'))}
          sx={{
            '&:active': { boxShadow: '0px 0px 2rem inset #fff4' },
            borderTopRightRadius: 0,
            borderBottomRightRadius: 0,
          }}
        >
          <NavigateBeforeIcon />
        </IconButton>

        <Typography variant="h6" component="span" sx={{}}>
          {weekDescription}
        </Typography>

        <IconButton
          aria-label="next week"
          disableTouchRipple
          onClick={() => setDate(date.add(1, 'week'))}
          sx={{
            '&:active': { boxShadow: '0px 0px 2rem inset #fff4' },
            borderBottomLeftRadius: 0,
            borderTopLeftRadius: 0,
          }}
        >
          <NavigateNextIcon />
        </IconButton>
      </ViewHeader>

      <CalendarBody date={date} eventList={eventList} onExpand={onExpand} />
    </Stack>
  )
}
