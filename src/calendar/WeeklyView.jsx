import CalendarViewMonthIcon from '@mui/icons-material/CalendarViewMonth'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore'
import {
  IconButton,
  Typography,
  Box,
  useMediaQuery,
  Collapse,
  createTheme,
} from '@mui/material'
import { forwardRef, useContext, useMemo, useRef, useState } from 'react'
import { DailyBreakdown } from './DailyBreakdown'
import { HoverableBox } from '../blueDigitalTheme'
import { ViewHeader } from './ViewHeader'
import { useLogger } from './Logger'
import { createEventObject, isOverlap, resolveColor } from './calendarLogic.mjs'
import { ViewContainer } from './ViewContainer'
import { useViewQuery } from './routes/Calendar'
import { SectionedInterval } from './SectionedInterval'
import { ActionButtons, MobileBar } from './ActionDisplay'
import { ActionContext, actionList } from './ActionContext.mjs'
import { useMobileBarCheck, useNarrowCheck } from './LayoutContext.mjs'
import { CreationPicker } from './CreationPicker'

const innerLeftPadding = '0rem'
const innerRightPadding = '0rem'
const snapGapPixels = 4
const ghostFadeInColor = '#0000'

function GhostDay() {
  return (
    <Box
      sx={{
        marginLeft: [snapGapPixels / 2 + 'px', 2 * snapGapPixels + 1 + 'px'],
        marginRight: [
          2 * snapGapPixels - 1 + 'px',
          4 * snapGapPixels - 2 + 'px',
        ],
      }}
    >
      <div
        className="ghost-pane"
        style={{
          backgroundColor: '#04f',
          boxShadow: `0px 0px 1rem ${'#0008'} inset`,
          borderTop: '0.125rem solid #04f',
          borderLeft: '0.125rem solid #04f',
          borderRight: '0.125rem solid #000c',
          borderBottom: '0.125rem solid #000c',
          height: '100%',
          transition: 'background-color 350ms ease-out',
        }}
      >
        <span className="start-element"></span>
        <wbr />–<wbr />
        <span className="end-element" />
      </div>
    </Box>
  )
}
function GhostWeek({ show }) {
  return (
    <Box
      className="ghost-week"
      sx={{
        display: show ? 'grid' : 'none',
        height: '100%',
      }}
    >
      <GhostDay />
      <GhostDay />
      <GhostDay />
      <GhostDay />
      <GhostDay />
      <GhostDay />
      <GhostDay />
    </Box>
  )
}

const DragGhost = forwardRef(function DragGhost({ show }, ref) {
  const isCreating = show === 'creating'
  return (
    <Box
      ref={ref}
      sx={{
        display: show ? 'block' : 'none',
        pointerEvents: 'none',
        position: 'absolute',
        backgroundColor: '#f004',
        zIndex: 2,
        filter: isCreating
          ? 'brightness(130%) saturate(90%)'
          : 'brightness(120%) saturate(120%)',
        textAlign: 'center',
        overflowX: 'hidden',
        overflowY: 'hidden',
        fontSize: '0.75em',
      }}
    >
      <div style={{ display: isCreating ? 'none' : 'block' }}>
        <span className="start-element"></span>
        <wbr />–<wbr />
        <span className="end-element" />
      </div>

      <GhostWeek show={isCreating ? true : false} />
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
  touchRef,
  date,
  events,
  onExpand,
  onCreate,
  onUpdate,
  onDelete,
  onHideDrawer,
}) {
  const colorizerTheme = createTheme({
    palette: { tonalOffset: 0.3 },
  })
  const needMobileBar = useMobileBarCheck()
  const logger = useLogger()
  const benchStart = performance.now()
  const displayHeight = '520px'

  const ghostElementRef = useRef(null)

  const [showGhost, setShowGhost] = useState(false)
  const action = useContext(ActionContext)

  const rv = useMemo(() => {
    const augmentedResetColor = colorizerTheme.palette.augmentColor({
      color: { main: ghostFadeInColor },
    })
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
      return (
        (snapDay(pageX) * touchRef.current.bounds.containerWidth) / 7 +
        snapGapPixels
      )
    }

    function snapXCeil(pageX) {
      return (
        ((snapDay(pageX) + 1) * touchRef.current.bounds.containerWidth) / 7 -
        snapGapPixels
      )
    }

    function snapMinute(pageY) {
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

    function setAugmentedPaneColor(paneElement, augmentedColor) {
      paneElement.style.backgroundColor = augmentedColor.main
      paneElement.style.color = augmentedColor.contrastText
      paneElement.style.boxShadow = `0px 0px 1rem ${augmentedColor.dark} inset`
      paneElement.style.borderTop = `0.125rem solid ${augmentedColor.main}`
      paneElement.style.borderLeft = `0.125rem solid ${augmentedColor.main}`
      paneElement.style.borderRight = `0.125rem solid ${augmentedColor.dark}`
      paneElement.style.borderBottom = `0.125rem solid ${augmentedColor.dark}`
    }

    function setGhostWeekColor(newColor) {
      const augmented = colorizerTheme.palette.augmentColor({
        color: { main: newColor },
      })
      const panes = ghostElementRef.current.querySelectorAll('.ghost-pane')
      for (const p of panes) {
        setAugmentedPaneColor(p, augmented)
      }
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
      const pressedMinute = snapMinute(touchRef.current.flooredY)
      const draggedMinute = snapMinute(pageY)

      const lowMinute = Math.min(pressedMinute, draggedMinute)
      const highMinute = Math.max(pressedMinute, draggedMinute)

      const finalMinute =
        // If the user is dragging down...
        draggedMinute > pressedMinute
          ? // ... then ensure a minimum interval size
            highMinute - lowMinute > 60
            ? highMinute
            : pressedMinute + 60
          : // Otherwise, use the end of the initial click region
            pressedMinute + 60
      const startMinute =
        // If the user is dragging down...
        draggedMinute > pressedMinute
          ? // ... then start at the initial touch point
            pressedMinute
          : // Otherwise, ensure a minimum interval size
          highMinute - lowMinute > 60
          ? lowMinute
          : Math.max(0, highMinute - 60)

      const leftmost = Math.min(pageX, touchRef.current.initialPageX)
      const rightmost = Math.max(pageX, touchRef.current.initialPageX)

      ghostElementRef.current.style.left = snapLeft(leftmost) + 'px'
      ghostElementRef.current.style.top =
        touchRef.current.bounds.top +
        (startMinute / (24 * 4 * 15)) *
          (touchRef.current.bounds.bottom - touchRef.current.bounds.top) +
        'px'

      ghostElementRef.current.style.height =
        ((finalMinute - startMinute) / (24 * 4 * 15)) *
          (touchRef.current.bounds.bottom - touchRef.current.bounds.top) +
        'px'

      ghostElementRef.current.style.width =
        snapXCeil(rightmost) - snapLeft(leftmost) + 1 + 'px'

      const currentDayCount = Math.round(
        (7 * (snapXCeil(rightmost) - snapLeft(leftmost))) /
          (touchRef.current.bounds.right - touchRef.current.bounds.left)
      )
      if (currentDayCount !== touchRef.current.creatingDayCount) {
        clearTimeout(touchRef.current.fadeTimeout)
        const activeColor = touchRef.current.augmentedGhostColor
        const ghostPaneArray = [
          ...ghostElementRef.current.querySelectorAll('.ghost-pane'),
        ]

        // When dragging right...
        if (pageX > touchRef.current.initialPageX) {
          for (let i = 0; i < ghostPaneArray.length; i++) {
            if (i < currentDayCount) {
              // console.log(i,'on')
              setAugmentedPaneColor(ghostPaneArray[i], activeColor)
            } else {
              // console.log(i,'off')
              setAugmentedPaneColor(ghostPaneArray[i], augmentedResetColor)
            }
          }
        } else if (currentDayCount > touchRef.current.creatingDayCount) {
          // When extending left...
          ghostPaneArray[0].style.transition = ''
          setAugmentedPaneColor(ghostPaneArray[0], augmentedResetColor)
          ghostPaneArray[0].offsetHeight
          touchRef.current.fadeTimeout = setTimeout(() => {
            ghostPaneArray[0].style.transition =
              'background-color 350ms ease-out'
            setAugmentedPaneColor(ghostPaneArray[0], activeColor)
          }, 50)

          for (let i = 1; i < ghostPaneArray.length; i++) {
            setAugmentedPaneColor(ghostPaneArray[i], activeColor)
          }
        }

        touchRef.current.creatingDayCount = currentDayCount
      }

      touchRef.current.creationStartDay = snapDay(leftmost)
      touchRef.current.creationFinalDay = snapDay(rightmost)
      touchRef.current.creationStartMinute = startMinute
      touchRef.current.creationFinalMinute = finalMinute

      const formattedStart = startOfWeek
        .add(startMinute, 'minutes')
        .format('h:mma')
        .replace('m', '')
      const formattedEnd = startOfWeek
        .add(finalMinute, 'minutes')
        .format('h:mma')
        .replace('m', '')

      for (const e of touchRef.current.startLabels) {
        e.textContent = formattedStart
      }
      for (const e of touchRef.current.endLabels) {
        e.textContent = formattedEnd
      }
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
            setGhostWeekColor(ghostFadeInColor)
            touchRef.current.isDragCreating = false

            if (action === 'create') {
              console.log(
                'create placeholder:',
                touchRef.current.creationStartMinute,
                touchRef.current.creationFinalMinute,
                touchRef.current.creationStartDay,
                touchRef.current.creationFinalDay
              )
              console.log('should create events:')
              for (
                let day = touchRef.current.creationStartDay;
                day <= touchRef.current.creationFinalDay;
                day++
              ) {
                const initialTime = startOfWeek
                  .add(day, 'days')
                  .add(touchRef.current.creationStartMinute, 'minutes')
                const finalTime = startOfWeek
                  .add(day, 'days')
                  .add(touchRef.current.creationFinalMinute, 'minutes')

                console.log(touchRef.current.creationColor)

                onCreate(
                  createEventObject({
                    startTime: initialTime,
                    endTime: finalTime,
                    summary: touchRef.current.creationTitle,
                    description: ' ',
                    colorId: touchRef.current.creationColor,
                    id: `idem ${Math.floor(Math.random() * 1e9)}`,
                  })
                )
              }
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
            touchRef.current.isDragCreating = false
            if (touchRef.current.eventPane) {
              touchRef.current.eventPane.style.filter = ''
            }
          }}
          onPointerDown={e => {
            if (action === 'create') {
              onHideDrawer()
              updateTouchBounds(e)
              setShowGhost('creating')

              // discretize and round down interval to start of hour:
              const yFraction =
                (e.pageY - touchRef.current.bounds.top) /
                (touchRef.current.bounds.bottom - touchRef.current.bounds.top)
              const flooredHour = 24 * (yFraction - (yFraction % (1 / 24)))

              console.log(
                'color resolved to:',
                resolveColor(touchRef.current.creationColor)
              )
              Object.assign(touchRef.current, {
                isDragCreating: true,
                creatingDayCount: 0,
                startLabels: [
                  ...ghostElementRef.current.querySelectorAll('.start-element'),
                ],
                endLabels: [
                  ...ghostElementRef.current.querySelectorAll('.end-element'),
                ],
                augmentedGhostColor: colorizerTheme.palette.augmentColor({
                  color: { main: resolveColor(touchRef.current.creationColor) },
                }),
                initialLeft: e.pageX - touchRef.current.bounds.containerLeft,
                initialTop: e.pageY - window.scrollY,
                flooredY:
                  touchRef.current.bounds.top +
                  (flooredHour *
                    (touchRef.current.bounds.bottom -
                      touchRef.current.bounds.top)) /
                    24,

                width:
                  Math.round(touchRef.current.bounds.containerWidth / 7) -
                  2 * snapGapPixels,
                height: 0,
              })

              setGhostWeekColor(touchRef.current.augmentedGhostColor.main)

              updateDragCreation(e.pageX, e.pageY)
              ghostElementRef.current.style.backgroundColor = 'transparent'
              ghostElementRef.current.style.border = 'none'
              const ghostWeek =
                ghostElementRef.current.querySelector('.ghost-week')
              ghostWeek.style.gridTemplateColumns = `repeat(7, ${
                (touchRef.current.bounds.containerWidth - snapGapPixels / 2) /
                  7 +
                'px'
              })`

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
            ghostElementRef.current.style.border = `0.125rem solid rgb(${rgb})`
            ghostElementRef.current.style.color =
              colorizerTheme.palette.augmentColor({
                color: { main: `rgb(${rgb})` },
              }).contrastText

            updateDragMove(e.pageX, e.pageY)

            setShowGhost(true)
            touchRef.current.eventPane.style.filter =
              'brightness(40%) saturate(30%)'
          }}
          onPointerMove={e => {
            try {
              if (action === 'create' && touchRef.current.isDragCreating) {
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
            touchAction: action === 'create' ? 'none' : undefined,
            paddingLeft: '1px',
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            width: '100%',
            borderTop: '1px solid #aaf3',
            boxShadow: '1rem 1.5rem 2rem #0114',
            filter: showGhost ? 'brightness(85%) saturate(80%)' : undefined,
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
    colorizerTheme,
    onExpand,
    onCreate,
    onUpdate,
    onDelete,
    onHideDrawer,
    action,
    needMobileBar,
    touchRef,
    showGhost,
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

function BottomDrawer({ open, touchRef }) {
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
        <CreationPicker layout="drawer" touchRef={touchRef} />
      </Collapse>
    </div>
  )
}

function TopDrawer({ open, touchRef }) {
  return (
    <div
      style={{
        zIndex: 2,
        position: 'fixed',
        top: '4rem',
        right: 0,
        width: '23rem',
      }}
    >
      <Collapse in={open}>
        <CreationPicker layout="shade" touchRef={touchRef} active={open} />
      </Collapse>
    </div>
  )
}

const defaultTouchState = {
  creationColor: 'Work',
  creationTitle: 'Work',
}

export function WeeklyView({
  date,
  onBack,
  onExpand,
  onChange,
  onCreate,
  onUpdate,
  onDelete,
}) {
  const touchRef = useRef(defaultTouchState)
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
        } else {
          setShowDrawer(false)
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

          {!needMobileBar && <TopDrawer open={showDrawer} touchRef={touchRef} />}
        </ViewHeader>

        <WeekBody
          touchRef={touchRef}
          date={date}
          events={events}
          onCreate={onCreate}
          onExpand={onExpand}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onHideDrawer={() => setShowDrawer(false)}
        />
      </ViewContainer>
      {needMobileBar && (
        <MobileBar transparent={showDrawer}>{actionButtons}</MobileBar>
      )}
      {needMobileBar && 
      <BottomDrawer open={showDrawer} touchRef={touchRef} />
      }
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
