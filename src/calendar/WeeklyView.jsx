import CalendarViewMonthIcon from '@mui/icons-material/CalendarViewMonth'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore'
import { IconButton, Typography, Box, useMediaQuery } from '@mui/material'
import { forwardRef, useContext, useMemo, useRef, useState } from 'react'
import { DailyBreakdown } from './DailyBreakdown'
import { HoverableBox } from '../blueDigitalTheme'
import { ViewHeader } from './ViewHeader'
import { useLogger } from './Logger'
import { isOverlap } from './calendarLogic.mjs'
import { ViewContainer } from './ViewContainer'
import { useViewQuery } from './routes/Calendar'
import { SectionedInterval } from './SectionedInterval'
import { useTheme } from '@emotion/react'
import { ActionButtons } from './ActionDisplay'
import { ActionContext, actionList } from './ActionContext.mjs'

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
        paddingTop: '0.125rem',
      }}
    ></Box>
  )
})

function WeekBody({ date, events, onExpand, onUpdate, onDelete }) {
  const theme = useTheme()
  const logger = useLogger()
  const benchStart = performance.now()
  const displayHeight = '520px'

  const ghostElementRef = useRef(null)
  const touchRef = useRef({})
  const [showGhost, setShowGhost] = useState(false)
  const action = useContext(ActionContext)

  const rv = useMemo(() => {
    const days = []
    const startOfWeek = date.startOf('week')
    const endOfWeek = date.endOf('week')

    const weekEvents = events.filter(e =>
      isOverlap(startOfWeek, endOfWeek, e.startTime, e.endTime)
    )

    function snapDay(clientX) {
      const xFraction =
        (clientX - touchRef.current.bounds.clientLeft) /
        touchRef.current.bounds.clientWidth
      return Math.round((xFraction - (xFraction % (1 / 7))) * 7)
    }

    function snapLeft(clientX) {
      return (snapDay(clientX) * touchRef.current.bounds.clientWidth) / 7 + 4
    }

    function snapMinute(clientY) {
      // Constrain the drag action to its parent bounds
      const top = Math.min(
        touchRef.current.bounds.bottom - touchRef.current.height,
        Math.max(
          touchRef.current.bounds.top,
          clientY -
            touchRef.current.initialClientY +
            touchRef.current.initialTop
        )
      )

      const yFraction =
        (top - touchRef.current.bounds.top) /
        (touchRef.current.bounds.bottom - touchRef.current.bounds.top)

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
        onClick={e => {
          if (action === 'delete') {
            const ep = e.target.closest('.event-pane')
            if (ep) {
              onDelete(ep.dataset.id)
            }
          }
        }}
        onPointerUp={e => {
          setShowGhost(false)
          if (touchRef.current.eventPane) {
            touchRef.current.eventPane.style.filter = ''
          }
          if (touchRef.current.event) {
            const snappedMinute = snapMinute(e.clientY)
            const snappedDay = snapDay(e.clientX)
            const snappedStart = startOfWeek
              .add(snappedDay, 'days')
              .add(snappedMinute, 'minutes')
            onUpdate(
              touchRef.current.event.stableKey ?? touchRef.current.event.id,
              {
                startTime: snappedStart,
                endTime: snappedStart.add(
                  touchRef.current.event.endTime.diff(
                    touchRef.current.event.startTime,
                    'minutes'
                  ),
                  'minutes'
                ),
              }
            )

            touchRef.current.event = null
          }
        }}
        onPointerLeave={() => {
          setShowGhost(false)
          touchRef.current.event = null
          if (touchRef.current.eventPane) {
            touchRef.current.eventPane.style.filter = ''
          }
        }}
        onPointerDown={e => {
          if(action === 'delete') {
            return
          }

          const ep = e.target.closest('.event-pane')
          // If the event did not occur within an eventPane,
          // allow the individual day container to handle it.
          if (!ep) {
            touchRef.current.eventPane = null
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
          touchRef.current = {
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
          ghostElementRef.current.style.width = touchRef.current.width + 'px'
          ghostElementRef.current.style.height = rect.height + 'px'
          // extract the comma-separated argument to rgb(r,g,b):
          const rgb = pickedColor.match(/rgb\(([^)]*)\)/)[1]
          ghostElementRef.current.style.backgroundColor = `rgba(${rgb},0.75)`
          ghostElementRef.current.style.border = `3px dashed rgb(${rgb})`
          ghostElementRef.current.style.color = theme.palette.augmentColor({
            color: { main: `rgb(${rgb})` },
          }).contrastText
          ghostElementRef.current.textContent = ''

          setShowGhost(true)
          touchRef.current.eventPane.style.filter =
            'brightness(40%) saturate(30%)'
        }}
        onPointerMove={e => {
          try {
            if (!touchRef.current.event) {
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
              touchRef.current.bounds.top +
              (snappedMinute / (24 * 4 * 15)) *
                (touchRef.current.bounds.bottom - touchRef.current.bounds.top) +
              'px'

            const startFormat = startOfWeek
              .add(snappedMinute, 'minutes')
              .format('h:mma')
              .replace('m', '')
            const endFormat = startOfWeek
              .add(
                snappedMinute +
                  touchRef.current.event.endTime.diff(
                    touchRef.current.event.startTime,
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
            onClick={e => {
              const ep = e.target.closest('.event-pane')
              // click was on, or initiated on, an event pane:
              if (ep || touchRef.current.eventPane) {
                // Do not expand.
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
  }, [date, events, theme, onExpand, onUpdate, onDelete, action])

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

export function WeeklyView({
  date,
  onBack,
  onExpand,
  onChange,
  onUpdate,
  onDelete,
}) {
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

  const [action, setAction] = useState(actionList[0])

  const rv = (
    <ActionContext.Provider value={action}>
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
              mr: 'auto',
              '&:active': { boxShadow: '0px 0px 2rem inset #fff4' },
              borderBottomLeftRadius: 0,
              borderTopLeftRadius: 0,
            }}
          >
            <NavigateNextIcon />
          </IconButton>

          <ActionButtons onBehavior={b => setAction(b)} />
        </ViewHeader>

        <WeekBody
          date={date}
          events={events}
          onExpand={onExpand}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      </ViewContainer>
    </ActionContext.Provider>
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
