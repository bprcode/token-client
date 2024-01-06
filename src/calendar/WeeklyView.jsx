import CalendarViewMonthIcon from '@mui/icons-material/CalendarViewMonth'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore'
import { IconButton, Typography, Box, useMediaQuery } from '@mui/material'
import { useMemo } from 'react'
import { DailyBreakdown } from './DailyBreakdown'
import { HoverableBox, alternatingShades } from '../blueDigitalTheme'
import { ViewHeader } from './ViewHeader'
import { useLogger } from './Logger'
import { isOverlap } from './calendarLogic.mjs'
import { ViewContainer } from './ViewContainer'
import { useViewQuery } from './routes/Calendar'
import { SectionedInterval } from './SectionedInterval'

const innerLeftPadding = '0rem'
const innerRightPadding = '0rem'

function WeekBody({ date, events, onExpand }) {
  const logger = useLogger()
  const benchStart = performance.now()
  const displayHeight = '520px'

  const rv = useMemo(() => {
    const days = []
    const startOfWeek = date.startOf('week')
    const endOfWeek = date.endOf('week')

    const weekEvents = events.filter(e =>
      isOverlap(startOfWeek, endOfWeek, e.startTime, e.endTime)
    )

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
              sx={{ pl: [0, 1], pr: [0, 1], pb: 1 }}
            >
              <Typography variant="caption">{d.format('ddd')}</Typography>
              <Typography variant="h5">{d.format('D')}</Typography>
            </Box>

            <SectionedInterval
              initial={d.startOf('day')}
              final={d.endOf('day')}
              step={[1, 'hour']}
              outsideHeight="100%"
              insideHeight={displayHeight}
              innerLeftPadding={innerLeftPadding}
              innerRightPadding={innerRightPadding}
              labelEvery={6}
              endMargin={'0rem'}
              action={null}
              header={null}
            >
              <DailyBreakdown
                date={d}
                events={weekEvents}
                style={{ height: displayHeight }}
                labels="none"
              />
            </SectionedInterval>
          </HoverableBox>
        ))}
      </div>
    )
  }, [date, events, onExpand])

  const benchEnd = performance.now()
  setTimeout(
    () => logger('CalendarBody rendered in ' + (benchEnd - benchStart) + ' ms'),
    1000
  )

  return rv
}

export function WeeklyView({ date, onBack, onExpand, onChange }) {
  const { data: events } = useViewQuery()
  const logger = useLogger()
  const logId = Math.round(Math.random() * 1e6)
  console.time(logId + ' WeeklyCalendar rendered')

  const benchStart = performance.now()
  const isSmall = useMediaQuery('(max-width: 600px)')

  const sunday = date.startOf('week')
  const saturday = sunday.add(6, 'days')
  const isRollover = sunday.month() !== saturday.month()
  const weekDescription = isSmall
    ? sunday.format('MMM D') +
      ' – ' +
      saturday.format(isRollover ? 'MMM D' : 'D')
    : 'Week of ' + sunday.format('MMMM D, YYYY')

  const rv = (
    <ViewContainer>
      <ViewHeader>
        <IconButton aria-label="back to monthly view" onClick={onBack}>
          <CalendarViewMonthIcon />
        </IconButton>
        <IconButton
          aria-label="previous week"
          disableTouchRipple
          onClick={() => onChange(date.subtract(1, 'week').startOf('week'))}
          sx={{
            '&:active': { boxShadow: '0px 0px 2rem inset #fff4' },
            borderTopRightRadius: 0,
            borderBottomRightRadius: 0,
          }}
        >
          <NavigateBeforeIcon />
        </IconButton>

        <Typography variant="h6" component="span">
          {weekDescription}
        </Typography>

        <IconButton
          aria-label="next week"
          disableTouchRipple
          onClick={() => onChange(date.add(1, 'week').startOf('week'))}
          sx={{
            '&:active': { boxShadow: '0px 0px 2rem inset #fff4' },
            borderBottomLeftRadius: 0,
            borderTopLeftRadius: 0,
          }}
        >
          <NavigateNextIcon />
        </IconButton>
      </ViewHeader>

      <WeekBody date={date} events={events} onExpand={onExpand} />
    </ViewContainer>
  )

  console.timeEnd(logId + ' WeeklyCalendar rendered')
  const benchEnd = performance.now()
  setTimeout(
    () =>
      logger(
        logId + ' WeeklyCalendar rendered in ' + (benchEnd - benchStart) + ' ms'
      ),
    1000
  )
  return rv
}
