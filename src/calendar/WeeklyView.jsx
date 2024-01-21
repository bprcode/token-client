import CalendarViewMonthIcon from '@mui/icons-material/CalendarViewMonth'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore'
import {
  IconButton,
  Typography,
  Box,
  useMediaQuery,
  Collapse,
} from '@mui/material'
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
import { ActionButtons, MobileBar } from './ActionDisplay'
import { ActionContext, actionList } from './ActionContext.mjs'
import { useMobileBarCheck, useNarrowCheck } from './LayoutContext.mjs'
import { CreationPicker } from './CreationPicker'

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
        zIndex: 2,
        filter: 'brightness(130%) saturate(110%)',
        textAlign: 'center',
        paddingTop: '0.125rem',
        overflowX: 'hidden',
        fontSize: '0.75em',
      }}
    >
      <span className="start-element"></span>
      <wbr />–<wbr />
      <span className="end-element" />
    </Box>
  )
})

function WeekdayBox({ touchRef, onExpand, day, displayHeight, weekEvents }) {
  return (
    <HoverableBox
      className="weekday-box"
      key={day.format('MM D')}
      onClick={e => {
        const ep = e.target.closest('.event-pane')
        // click was on, or initiated on, an event pane:
        if (ep || touchRef.current.eventPane) {
          // Do not expand.
          return
        }

        // expand the daily view.
        return onExpand(day)
      }}
      sx={{
        px: '0.25rem',
        pb: '0.5rem',
        backgroundColor: 'rgb(23, 27, 28)',
        borderLeft: '1px solid #fff1',
      }}
    >
      <Box
        align="center"
        key={day.format('D')}
        sx={{ pl: [0, 1], pr: [0, 1], pb: 1 }}
      >
        <Typography variant="caption">{day.format('ddd')}</Typography>
        <Typography variant="h5">{day.format('D')}</Typography>
      </Box>

      <SectionedInterval
        initial={day.startOf('day')}
        final={day.endOf('day')}
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
          date={day}
          events={weekEvents}
          style={{ height: displayHeight }}
          labels="brief"
        />
      </SectionedInterval>
    </HoverableBox>
  )
}

function WeekBody({
  date,
  events,
  onExpand,
  onUpdate,
  onDelete,
  onHideDrawer,
}) {
  const theme = useTheme()
  const needMobileBar = useMobileBarCheck()
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

    function snapDay(pageX) {
      const xFraction =
        (pageX - touchRef.current.bounds.containerLeft) /
        touchRef.current.bounds.containerWidth
      return Math.round((xFraction - (xFraction % (1 / 7))) * 7)
    }

    function snapLeft(pageX) {
      return (snapDay(pageX) * touchRef.current.bounds.containerWidth) / 7 + 4
    }

    function snapXCeil(pageX) {
      return (
        ((snapDay(pageX) + 1) * touchRef.current.bounds.containerWidth) / 7 - 4
      )
    }

    function snapMinute(pageY) {
      // console.log(
      //   touchRef.current.bounds.top, '<',
      //   pageY +
      //       window.scrollY -
      //       touchRef.current.initialPageY +
      //       touchRef.current.initialTop, '<',
      //   touchRef.current.bounds.bottom - touchRef.current.height)

      // Constrain the drag action to its parent bounds
      const top = Math.min(
        // Bottom bound:
        touchRef.current.bounds.bottom - touchRef.current.height,
        Math.max(
          // Top bound:
          touchRef.current.bounds.top,
          // Current relative position:
          pageY +
            window.scrollY -
            touchRef.current.initialPageY +
            touchRef.current.initialTop
        )
      )

      const yFraction =
        (top +
          1 - // +1 fixes slight inaccuracy when scrolled:
          touchRef.current.bounds.top) /
        (touchRef.current.bounds.bottom - touchRef.current.bounds.top)

      // Snap to the closest 15-minute increment:
      return Math.round(
        (yFraction - (yFraction % (1 / (24 * 4)))) * 24 * 4 * 15
      )
    }

    function updateTouchBounds(e) {
      const viewContainer = e.target.closest('.view-container')

      const innerSections = viewContainer.querySelectorAll('.section-inner')
      const firstDayBounds = innerSections[0].getBoundingClientRect()
      const lastDayBounds =
        innerSections[innerSections.length - 1].getBoundingClientRect()

      const container = viewContainer.getBoundingClientRect()

      Object.assign(touchRef.current, {
        initialPageX: e.pageX,
        initialPageY: e.pageY,
        bounds: {
          left: firstDayBounds.left + window.scrollX,
          top: lastDayBounds.top + window.scrollY,
          right: lastDayBounds.right + window.scrollX,
          bottom: lastDayBounds.bottom + window.scrollY,
          containerLeft: container.left + window.scrollX,
          containerWidth: container.width,
          containerTop: container.top + window.scrollY,
        },
        startElement: ghostElementRef.current.querySelector('.start-element'),
        endElement: ghostElementRef.current.querySelector('.end-element'),
      })
    }

    function updateDragCreation(pageX, pageY) {
      const initialMinute = snapMinute(touchRef.current.flooredY)
      const currentMinute = snapMinute(pageY)

      const startMinute = Math.min(initialMinute, currentMinute)
      const endMinute = Math.max(initialMinute, currentMinute)

      const leftmost = Math.min(pageX, touchRef.current.initialPageX)
      const rightmost = Math.max(pageX, touchRef.current.initialPageX)

      ghostElementRef.current.style.left = snapLeft(leftmost) + 'px'
      ghostElementRef.current.style.top =
        touchRef.current.bounds.top +
        (startMinute / (24 * 4 * 15)) *
          (touchRef.current.bounds.bottom - touchRef.current.bounds.top) +
        'px'

      ghostElementRef.current.style.height =
        ((endMinute - startMinute) / (24 * 4 * 15)) *
          (touchRef.current.bounds.bottom - touchRef.current.bounds.top) +
        'px'

      ghostElementRef.current.style.width =
        snapXCeil(rightmost) - snapLeft(leftmost) + 'px'
    }

    function updateDragMove(pageX, pageY) {
      const snappedMinute = snapMinute(pageY)

      // Use the snapped values to place the element
      ghostElementRef.current.style.left = snapLeft(pageX) + 'px'
      ghostElementRef.current.style.top =
        touchRef.current.bounds.top +
        (snappedMinute / (24 * 4 * 15)) *
          (touchRef.current.bounds.bottom - touchRef.current.bounds.top) +
        'px'

      const formattedStart = startOfWeek
        .add(snappedMinute, 'minutes')
        .format('h:mma')
        .replace('m', '')
      const formattedEnd = startOfWeek
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

      touchRef.current.startElement.textContent = formattedStart
      touchRef.current.endElement.textContent = formattedEnd
    }

    let d = startOfWeek
    while (d.isBefore(endOfWeek)) {
      days.push(d)
      d = d.add(1, 'day')
    }

    return (
      <div>
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

            if (action === 'create') {
              console.log('create placeholder')
              return
            }

            if (touchRef.current.eventPane) {
              touchRef.current.eventPane.style.filter = ''
            }
            if (touchRef.current.event) {
              const snappedMinute = snapMinute(e.pageY)
              const snappedDay = snapDay(e.pageX)
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
            if (action === 'create') {
              onHideDrawer()
              updateTouchBounds(e)
              setShowGhost(true)

              // discretize and round down interval to start of hour:
              const yFraction =
                (e.pageY - touchRef.current.bounds.top) /
                (touchRef.current.bounds.bottom - touchRef.current.bounds.top)
              const flooredHour = 24 * (yFraction - (yFraction % (1 / 24)))

              Object.assign(touchRef.current, {
                initialLeft: e.pageX - touchRef.current.bounds.containerLeft,
                initialTop: e.pageY - window.scrollY,
                flooredY:
                  touchRef.current.bounds.top +
                  (flooredHour *
                    (touchRef.current.bounds.bottom -
                      touchRef.current.bounds.top)) /
                    24,

                width:
                  Math.round(touchRef.current.bounds.containerWidth / 7) - 8,
                height:
                  (touchRef.current.bounds.bottom -
                    touchRef.current.bounds.top) /
                  (24 * 4),
              })
              return
            }

            if (action === 'delete') {
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
            const eventRect = ep.getBoundingClientRect()

            touchRef.current = {}

            updateTouchBounds(e)
            Object.assign(touchRef.current, {
              event: events.find(
                e => e.stableKey === ep.dataset.id || e.id === ep.dataset.id
              ),
              eventPane: ep,
              initialLeft:
                eventRect.left - touchRef.current.bounds.containerLeft,
              initialTop: eventRect.top - touchRef.current.bounds.containerTop,

              width: Math.round(touchRef.current.bounds.containerWidth / 7) - 8,
              height: eventRect.height,
            })

            ghostElementRef.current.style.width = touchRef.current.width + 'px'
            ghostElementRef.current.style.height = eventRect.height + 'px'
            // extract the comma-separated argument to rgb(r,g,b):
            const rgb = pickedColor.match(/rgb\(([^)]*)\)/)[1]
            ghostElementRef.current.style.backgroundColor = `rgba(${rgb},0.75)`
            ghostElementRef.current.style.border = `3px dashed rgb(${rgb})`
            ghostElementRef.current.style.color = theme.palette.augmentColor({
              color: { main: `rgb(${rgb})` },
            }).contrastText

            updateDragMove(e.pageX, e.pageY)

            setShowGhost(true)
            touchRef.current.eventPane.style.filter =
              'brightness(40%) saturate(30%)'
          }}
          onPointerMove={e => {
            try {
              if (action === 'create') {
                updateDragCreation(e.pageX, e.pageY)
                return
              }

              if (!touchRef.current.event) {
                return
              }

              updateDragMove(e.pageX, e.pageY)
            } catch (e) {
              console.warn(e.message)
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
          {days.map(day => (
            <WeekdayBox
              key={day.format('MM D')}
              touchRef={touchRef}
              onExpand={() => {
                if (action !== 'create') {
                  onExpand()
                }
              }}
              day={day}
              displayHeight={displayHeight}
              weekEvents={weekEvents}
            />
          ))}
        </div>
        {needMobileBar && (
          <div
            style={{
              borderTop: '1px solid #1c1c1c',
              backgroundColor: 'hsla(192, 10%, 8%, 0.5)',
              height: '7rem',
            }}
          />
        )}
      </div>
    )
  }, [
    date,
    events,
    theme,
    onExpand,
    onUpdate,
    onDelete,
    onHideDrawer,
    action,
    needMobileBar,
  ])

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

function old_CreationDrawer({ action, picks, onPick }) {
  const position = useNarrowCheck() ? 'fixed' : 'sticky'

  return (
    <div style={{ zIndex: 2, position, bottom: 0, width: '100%' }}>
      <Collapse in={action === 'create'}>
        {/* <EventPicker picks={picks} onPick={onPick} /> */}
      </Collapse>
    </div>
  )
}

function CreationDrawer({ open }) {
  const anchorBottom = useMobileBarCheck()
  return (
    <div
      style={{
        zIndex: 2,
        position: 'fixed',
        bottom: 0,
        width: '100%',
      }}
    >
      <Collapse in={open}>
        <CreationPicker />
      </Collapse>
    </div>
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
  const isNarrow = useNarrowCheck()
  const needMobileBar = useMobileBarCheck()

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
  const [showDrawer, setShowDrawer] = useState(false)
  const actionButtons = (
    <ActionButtons
      onBehavior={b => {
        setAction(b)
        if (b === 'create') {
          setShowDrawer(true)
        }
      }}
    />
  )

  const rv = (
    <ActionContext.Provider value={action}>
      <ViewContainer containOverflow={!isNarrow}>
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

          {!needMobileBar && actionButtons}
        </ViewHeader>

        <WeekBody
          date={date}
          events={events}
          onExpand={onExpand}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onHideDrawer={() => setShowDrawer(false)}
        />
      </ViewContainer>
      {needMobileBar && (
        <MobileBar transparent={showDrawer}>{actionButtons}</MobileBar>
      )}
      <CreationDrawer open={showDrawer} />
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
