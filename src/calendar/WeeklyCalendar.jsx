import {
  IconButton,
  Typography,
  useMediaQuery,
  Box,
  Stack,
  AppBar,
  Toolbar,
} from '@mui/material'
import { useMemo, useState } from 'react'
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
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
          paddingLeft: '0.25rem',
          paddingRight: '0.25rem',
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
  // const typeVariant = useMediaQuery('(max-width: 380px)') ? 'subtitle1' : 'h6'

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
          <ArrowBackIcon />
        </IconButton>
        <IconButton
          aria-label="previous week"
          onClick={() => setDate(date.subtract(1, 'week'))}
          sx={{
            borderTopRightRadius: 0,
            borderBottomRightRadius: 0,
          }}
        >
          <NavigateBeforeIcon />
        </IconButton>

        <Typography variant="h6" component="span" sx={{ width: '100%' }}>
          Week of {date.startOf('week').format('MMMM D, YYYY')}
        </Typography>

        <IconButton
          aria-label="next week"
          onClick={() => setDate(date.add(1, 'week'))}
          sx={{
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
