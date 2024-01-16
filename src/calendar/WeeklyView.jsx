import CalendarViewMonthIcon from '@mui/icons-material/CalendarViewMonth'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore'
import { IconButton, Typography, Box, useMediaQuery } from '@mui/material'
import { forwardRef, useMemo, useRef, useState } from 'react'
import { DailyBreakdown } from './DailyBreakdown'
import { HoverableBox } from '../blueDigitalTheme'
import { ViewHeader } from './ViewHeader'
import { useLogger } from './Logger'
import { isOverlap, shorthandInterval } from './calendarLogic.mjs'
import { ViewContainer } from './ViewContainer'
import { useViewQuery } from './routes/Calendar'
import { SectionedInterval } from './SectionedInterval'

const innerLeftPadding = '0rem'
const innerRightPadding = '0rem'

const DragGhost = forwardRef(function DragGhost({ show }, ref) {
  return (
    <Box
      ref={ref}
      sx={{
        display: show ? 'block' : 'none',
        pointerEvents: 'none',
        position: 'absolute',
        backgroundColor: '#f004',
        border: '2px dashed orange',
        zIndex: 3,
        filter: 'brightness(130%) saturate(110%)',
        textAlign: 'center',
      }}
    ></Box>
  )
})

function WeekBody({ date, events, onExpand }) {
  const logger = useLogger()
  const benchStart = performance.now()
  const displayHeight = '520px'

  const ghostElementRef = useRef(null)
  const dragRef = useRef({})
  const [showGhost, setShowGhost] = useState(false)

  const rv = useMemo(() => {
    const days = []
    const startOfWeek = date.startOf('week')
    const endOfWeek = date.endOf('week')

    const weekEvents = events.filter(e =>
      isOverlap(startOfWeek, endOfWeek, e.startTime, e.endTime)
    )

    function snapDay(clientX) {
      const xFraction =
        (clientX - dragRef.current.bounds.clientLeft) /
        dragRef.current.bounds.clientWidth
      return Math.round((xFraction - (xFraction % (1 / 7))) * 7)
    }

    function snapLeft(clientX) {
      return (snapDay(clientX) * dragRef.current.bounds.clientWidth) / 7 + 4
    }

    function snapMinute(clientY) {
      // Constrain the drag action to its parent bounds
      const top = Math.min(
        dragRef.current.bounds.bottom - dragRef.current.height,
        Math.max(
          dragRef.current.bounds.top,
          clientY - dragRef.current.initialClientY + dragRef.current.initialTop
        )
      )

      const yFraction =
        (top - dragRef.current.bounds.top) /
        (dragRef.current.bounds.bottom - dragRef.current.bounds.top)

      // Snap to the closest 15-minute increment:
      return Math.round(
        (yFraction - (yFraction % (1 / (24 * 4)))) * 24 * 4 * 15
      )
    }

    let d = startOfWeek
    while (d.isBefore(endOfWeek)) {
      days.push(d)
      d = d.add(1, 'day')
    }

    return (
      <div
        onClick={() => {
          console.log('container click')
          dragRef.current.lockClick = false
        }}
        onPointerUp={() => {
          console.log('container pointer up')
          setShowGhost(false)
          if (dragRef.current.event) {
            dragRef.current.event = null
          }
        }}
        onPointerLeave={() => {
          setShowGhost(false)
          dragRef.current.event = null
        }}
        onPointerDown={e => {
          const ep = e.target.closest('.event-pane')
          // If the event did not occur within an eventPane,
          // allow the individual day container to handle it.
          if (!ep) {
            dragRef.current.eventPane = null
            return
          }

          const pickedColor = getComputedStyle(
            ep.querySelector('.pane-inner')
          ).backgroundColor
          const rect = ep.getBoundingClientRect()
          const wb = e.target.closest('.view-container')
          const innerSections = wb.querySelectorAll('.section-inner')
          const firstDayBounds = innerSections[0].getBoundingClientRect()
          const lastDayBounds =
            innerSections[innerSections.length - 1].getBoundingClientRect()

          const container = wb.getBoundingClientRect()
          dragRef.current = {
            event: events.find(
              e => e.stableKey === ep.dataset.id || e.id === ep.dataset.id
            ),
            eventPane: ep,
            initialLeft: rect.left - container.left,
            initialTop: rect.top - container.top,
            initialClientX: e.clientX,
            initialClientY: e.clientY,
            width: Math.round(container.width / 7) - 8,
            height: rect.height,
            bounds: {
              left: 0,
              top: lastDayBounds.top,
              right: lastDayBounds.right - firstDayBounds.left,
              bottom: lastDayBounds.bottom,
              clientLeft: container.left,
              clientWidth: container.width,
            },
          }

          ghostElementRef.current.style.left = snapLeft(e.clientX) + 'px'
          ghostElementRef.current.style.top = rect.top - container.top + 'px'
          ghostElementRef.current.style.width = dragRef.current.width + 'px'
          ghostElementRef.current.style.height = rect.height + 'px'
          // extract the comma-separated argument to rgb(r,g,b):
          const rgb = pickedColor.match(/rgb\(([^)]*)\)/)[1]
          ghostElementRef.current.style.backgroundColor = `rgba(${rgb},0.75)`
          ghostElementRef.current.style.border = `3px dashed rgb(${rgb})`
          ghostElementRef.current.textContent = ''

          setShowGhost(true)
        }}
        onPointerMove={e => {
          try {
            if (!dragRef.current.event) {
              return
            }
            // const left = Math.min(
            //   dragRef.current.bounds.right - dragRef.current.width,
            //   Math.max(
            //     dragRef.current.bounds.left,
            //     e.clientX -
            //       dragRef.current.initialClientX +
            //       dragRef.current.initialLeft
            //   )
            // )

            const snappedMinute = snapMinute(e.clientY)

            // Use the snapped values to place the element
            ghostElementRef.current.style.left = snapLeft(e.clientX) + 'px'
            ghostElementRef.current.style.top =
              dragRef.current.bounds.top +
              (snappedMinute / (24 * 4 * 15)) *
                (dragRef.current.bounds.bottom - dragRef.current.bounds.top) +
              'px'

            const startFormat = startOfWeek
              .add(snappedMinute, 'minutes')
              .format('h:mma')
              .replace('m', '')
            const endFormat = startOfWeek
              .add(
                snappedMinute +
                  dragRef.current.event.endTime.diff(
                    dragRef.current.event.startTime,
                    'minutes'
                  ),
                'minutes'
              )
              .format('h:mma')
              .replace('m', '')

            ghostElementRef.current.textContent = startFormat + '–' + endFormat
          } catch (e) {
            console.log(e.message)
          }
        }}
        style={{
          paddingLeft: '1px',
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          width: '100%',
          borderTop: '1px solid #aaf3',
          boxShadow: '1rem 1.5rem 2rem #0114',
        }}
      >
        {days.map(d => (
          <HoverableBox
            className="weekday-box"
            key={d.format('MM D')}
            onClick={() => {
              if (dragRef.current.eventPane) {
                // click initiated on an event, do not expand
                return
              }

              // expand the daily view.
              return onExpand(d)
            }}
            sx={{
              px: '0.25rem',
              pb: '1.5rem',
              backgroundColor: 'rgb(23, 27, 28)',
              borderLeft: '1px solid #fff1',
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
                labels="brief"
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

  return (
    <>
      {rv}
      <DragGhost show={showGhost} ref={ghostElementRef} />
    </>
  )
}

export function WeeklyView({ date, onBack, onExpand, onChange }) {
  const { data: events } = useViewQuery()
  const logger = useLogger()
  const logId = Math.round(Math.random() * 1e6)
  console.time(logId + ' WeeklyCalendar rendered')

  const benchStart = performance.now()
  const isSmall = useMediaQuery('(max-width: 600px)')
  const isReallySmall = useMediaQuery('(max-width: 320px)')

  const sunday = date.startOf('week')
  const saturday = sunday.add(6, 'days')
  const isRollover = sunday.month() !== saturday.month()
  const weekDescription = isReallySmall
    ? sunday.format('M/D') + ' – ' + saturday.format(isRollover ? 'M/D' : 'D')
    : isSmall
    ? sunday.format('MMM D') +
      ' – ' +
      saturday.format(isRollover ? 'MMM D' : 'D')
    : 'Week of ' + sunday.format('MMMM D, YYYY')

  const rv = (
    <ViewContainer>
      <ViewHeader gradient={null}>
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
