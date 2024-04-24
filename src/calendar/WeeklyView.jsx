import CalendarViewMonthIcon from '@mui/icons-material/CalendarViewMonth'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore'
import redX from '../assets/red-x.svg'
import {
  IconButton,
  Typography,
  Box,
  useMediaQuery,
  Collapse,
  createTheme,
} from '@mui/material'
import {
  forwardRef,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react'
import { DailyBreakdown } from './DailyBreakdown'
import { HoverableBox } from './blueDigitalTheme'
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
import dayjs from 'dayjs'
import { EventEditor } from './EventEditor'
import { TutorialDialog, removeTutorialStage } from './TutorialDialog'

const innerLeftPadding = '0rem'
const innerRightPadding = '0rem'
const snapGapPixels = 4
const ghostFadeInColor = '#0000'
// const log = () => {}
const log = console.log.bind(console)
const time = () => {}
const timeEnd = () => {}

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
        <wbr />
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
        <span className="move-start-element"></span>
        <wbr />–<wbr />
        <span className="move-end-element" />
      </div>

      <GhostWeek show={isCreating ? true : false} />
    </Box>
  )
})

function touchIntercept(event) {
  const ep = event.target.closest('.event-pane')
  if(ep) {
    event.preventDefault()
  }
}

function WeekdayBox({ day, displayHeightPx, weekEvents }) {
  // Reconstruct day object from string to avoid broken referential integrity:
  const dayString = day.toString()

  return useMemo(() => {
    time(`🛤️ WeekdayBox memoizing for: ${dayString}`)
    const day = dayjs(dayString)
    const dstLength = Math.round(
      day.endOf('day').diff(day.startOf('day')) / (1000 * 60 * 60)
    )

    const dstHeight = Math.round((displayHeightPx * dstLength) / 24) + 'px'

    const assembled = (
      <HoverableBox
        className="weekday-box"
        data-day={dayString}
        key={day.format('MM D')}
        sx={{
          px: ['0px', '0.25rem'],
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
          insideHeight={dstHeight}
          innerLeftPadding={innerLeftPadding}
          innerRightPadding={innerRightPadding}
          labelEvery={6}
          endMargin={'0rem'}
          action={null}
        >
          <DailyBreakdown
            date={day}
            events={weekEvents}
            style={{ height: dstHeight }}
            labels="brief"
          />
        </SectionedInterval>
      </HoverableBox>
    )

    timeEnd(`🛤️ WeekdayBox memoizing for: ${dayString}`)
    return assembled
  }, [displayHeightPx, dayString, weekEvents])
}

function clearSelection(touchRef) {
  touchRef.current.lastClickedPane = null

  if (touchRef.current.eventPane) {
    touchRef.current.eventPane.classList.remove('selected')
    touchRef.current.eventPane.classList.remove('show-pencil')
  }
}

function handlePointerDown(
  e,
  touchRef,
  ghostElementRef,
  action,
  onHideDrawer,
  updateTouchBounds,
  setShowGhost,
  colorizerTheme,
  setGhostWeekColor,
  updateDragCreation,
  events
) {
  touchRef.current.lastTouchBehavior = action

  log('🔽 handling pointerDown with action=', action, 'from element', e.target)

  // Handle create pointer down
  if (action === 'create') {
    clearSelection(touchRef)
    onHideDrawer()
    updateTouchBounds(e)
    setShowGhost('creating')

    const yBounds = touchRef.current.bounds.y[touchRef.current.initialDayOfWeek]

    // discretize and round down interval to start of hour:
    const yFraction = (e.pageY - yBounds.top) / (yBounds.bottom - yBounds.top)
    const flooredHour =
      yBounds.dayLength * (yFraction - (yFraction % (1 / yBounds.dayLength)))

    const selections = {
      type: document.querySelector('.type-field input').value,
      color: document.querySelector('.color-field input')?.value,
      title: document.querySelector('.title-field input')?.value,
    }

    const creationColor = selections.color ?? resolveColor(selections.type)

    log([...ghostElementRef.current.querySelectorAll('.start-element')])
    Object.assign(touchRef.current, {
      isDragCreating: true,
      creatingDayCount: 0,
      startLabels: [
        ...ghostElementRef.current.querySelectorAll('.start-element'),
      ],
      endLabels: [...ghostElementRef.current.querySelectorAll('.end-element')],
      augmentedGhostColor: colorizerTheme.palette.augmentColor({
        color: { main: creationColor },
      }),
      initialLeft: e.pageX - touchRef.current.bounds.containerLeft,
      initialTop: e.pageY - window.scrollY,
      flooredY:
        yBounds.top +
        (flooredHour * (yBounds.bottom - yBounds.top)) / yBounds.dayLength,

      width:
        Math.round(touchRef.current.bounds.containerWidth / 7) -
        2 * snapGapPixels,
      height: 0,
    })

    setGhostWeekColor(touchRef.current.augmentedGhostColor.main)

    updateDragCreation(e.pageX, e.pageY)
    ghostElementRef.current.style.backgroundColor = 'transparent'
    ghostElementRef.current.style.border = 'none'
    const ghostWeek = ghostElementRef.current.querySelector('.ghost-week')
    ghostWeek.style.gridTemplateColumns = `repeat(7, ${
      (touchRef.current.bounds.containerWidth - snapGapPixels / 2) / 7 + 'px'
    })`

    return
  }

  // Handle delete pointer down -- i.e., skip and leave to the click handler
  if (action === 'delete') {
    clearSelection(touchRef)
    return
  }

  // Handle edit pointer down
  const ep = e.target.closest('.event-pane')

  if (ep !== touchRef.current.eventPane) {
    clearSelection(touchRef)
  }

  // If the pointerDown did not occur within an eventPane,
  // allow the individual day container to handle it.
  if (!ep) {
    touchRef.current.eventPane = null
    return
  }

  const pickedColor = getComputedStyle(
    ep.querySelector('.pane-inner')
  ).accentColor
  const eventRect = ep.getBoundingClientRect()

  updateTouchBounds(e)
  Object.assign(touchRef.current, {
    event: events.find(
      e => e.stableKey === ep.dataset.id || e.id === ep.dataset.id
    ),
    eventPane: ep,
    lastClickedAt: Date.now(),
    initialLeft: eventRect.left - touchRef.current.bounds.containerLeft,
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
  ghostElementRef.current.style.color = colorizerTheme.palette.augmentColor({
    color: { main: `rgb(${rgb})` },
  }).contrastText

  // Hide the drag ghost until the first pointer movement:
  ghostElementRef.current.style.visibility = 'hidden'
  touchRef.current.eventPane.style.filter = ''

  setShowGhost(true)
}

function WeekBody({
  touchRef,
  dateString,
  events,
  onEdit,
  onExpand,
  onCreate,
  onUpdate,
  onDelete,
  onHideDrawer,
}) {
  const needMobileBar = useMobileBarCheck()
  const logger = useLogger()
  const benchStart = performance.now()
  const displayHeightPx = 544
  const isModeratelyWide = useMediaQuery('(min-width:500px)')

  const ghostElementRef = useRef(null)

  const [showGhost, setShowGhost] = useState(false)
  const action = useContext(ActionContext)

  const filteredEvents = useMemo(() => {
    log('⌛ memoizing filtered events')
    const date = dayjs(dateString)
    const startOfWeek = date.startOf('week')
    const endOfWeek = date.endOf('week')

    return events.filter(e =>
      isOverlap(startOfWeek, endOfWeek, e.startTime, e.endTime)
    )
  }, [dateString, events])

  const registerTouchStart = useCallback(node => {
    if(node) {
      console.log('registering touch start with:',node)
      node.addEventListener('touchstart', touchIntercept, { passive: false })
    }
  }, [])

  const rv = useMemo(() => {
    const memoBenchStart = Date.now()
    const date = dayjs(dateString)
    const startOfWeek = date.startOf('week')
    const endOfWeek = date.endOf('week')

    const colorizerTheme = createTheme({
      palette: { tonalOffset: 0.3 },
    })
    const augmentedResetColor = colorizerTheme.palette.augmentColor({
      color: { main: ghostFadeInColor },
    })
    const days = []

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

    function snapMinute(dayOfWeek, pageY) {
      const yBounds = touchRef.current.bounds.y[dayOfWeek]

      // Constrain the drag action to its parent bounds
      const top = Math.min(
        // Bottom bound:
        yBounds.bottom - touchRef.current.height,
        Math.max(
          // Top bound:
          yBounds.top,
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
          yBounds.top) /
        (yBounds.bottom - yBounds.top)

      // Snap to the closest 15-minute increment:
      return Math.round(
        (yFraction - (yFraction % (1 / (yBounds.dayLength * 4)))) *
          yBounds.dayLength *
          4 *
          15
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
          y: [...innerSections].map((s, i) => {
            const startOfDay = startOfWeek.add(i, 'days').startOf('day')
            const endOfDay = startOfWeek.add(i, 'days').endOf('day')
            const dayLength = Math.round(
              endOfDay.diff(startOfDay) / (1000 * 60 * 60)
            )
            const rect = s.getBoundingClientRect()
            return {
              top: rect.top + window.scrollY,
              bottom: rect.bottom + window.scrollY,
              dayLength,
            }
          }),
          left: firstDayBounds.left + window.scrollX,
          right: lastDayBounds.right + window.scrollX,
          containerLeft: container.left + window.scrollX,
          containerWidth: container.width,
          containerTop: container.top + window.scrollY,
        },
        startElement: ghostElementRef.current.querySelector(
          '.move-start-element'
        ),
        endElement: ghostElementRef.current.querySelector('.move-end-element'),
      })
      touchRef.current.initialDayOfWeek = snapDay(e.pageX)
    }

    function updateDragCreation(pageX, pageY) {
      ghostElementRef.current.style.visibility = 'visible'

      const dayOfWeek = snapDay(pageX)
      const yBounds = touchRef.current.bounds.y[dayOfWeek]

      const pressedMinute = snapMinute(
        snapDay(touchRef.current.initialPageX),
        touchRef.current.flooredY
      )
      const draggedMinute = snapMinute(dayOfWeek, pageY)

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
        yBounds.top +
        (startMinute / (yBounds.dayLength * 4 * 15)) *
          (yBounds.bottom - yBounds.top) +
        'px'

      ghostElementRef.current.style.height =
        ((finalMinute - startMinute) / (yBounds.dayLength * 4 * 15)) *
          (yBounds.bottom - yBounds.top) +
        'px'

      ghostElementRef.current.style.width =
        snapXCeil(rightmost) - snapLeft(leftmost) + 1 + 'px'

      const currentDayCount = Math.round(
        (7 * (snapXCeil(rightmost) - snapLeft(leftmost))) /
          (touchRef.current.bounds.right - touchRef.current.bounds.left)
      )

      // Apply fade-in transitions:
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
              setAugmentedPaneColor(ghostPaneArray[i], activeColor)
            } else {
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

      const isLongEnough = isModeratelyWide && finalMinute - startMinute > 90

      function formatDuration(minutes) {
        if (minutes < 60) return minutes + 'm'
        const minutePart = minutes % 60

        return (
          (minutes - minutePart) / 60 + 'h' + (minutePart ? minutePart : '')
        )
      }

      for (let i = 0; i < touchRef.current.startLabels.length; i++) {
        const relativeDay = touchRef.current.creationStartDay + i

        const content = isLongEnough
          ? startOfWeek
              .add(relativeDay, 'days')
              .add(startMinute, 'minutes')
              .format('h:mma')
          : formatDuration(finalMinute - startMinute)

        touchRef.current.startLabels[i].textContent = content
      }
      for (let i = 0; i < touchRef.current.endLabels.length; i++) {
        const relativeDay = touchRef.current.creationStartDay + i
        const content = isLongEnough
          ? '–' +
            startOfWeek
              .add(relativeDay, 'days')
              .add(finalMinute, 'minutes')
              .format('h:mma')
          : ''

        touchRef.current.endLabels[i].textContent = content
      }
    }

    function updateDragMove(pageX, pageY) {
      const dayOfWeek = snapDay(pageX)

      const snappedMinute = snapMinute(dayOfWeek, pageY)
      const yBounds = touchRef.current.bounds.y[dayOfWeek]

      clearSelection(touchRef)
      ghostElementRef.current.style.visibility = 'visible'
      touchRef.current.eventPane.style.filter = 'brightness(40%) saturate(30%)'

      // Use the snapped values to place the element
      ghostElementRef.current.style.left = snapLeft(pageX) + 'px'
      ghostElementRef.current.style.top =
        yBounds.top +
        (snappedMinute / (yBounds.dayLength * 4 * 15)) *
          (yBounds.bottom - yBounds.top) +
        'px'

      const activeDay = startOfWeek.add(dayOfWeek, 'days').startOf('day')
      const formattedStart = activeDay
        .add(snappedMinute, 'minutes')
        .format('h:mma')
        .replace('m', '')
      const formattedEnd = activeDay
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

    const assembledContents = (
      <div
        ref={registerTouchStart}
      >
        <Box
          onClick={e => {
            if (action === 'edit') {
              const ep = e.target.closest('.event-pane')

              if (
                ep &&
                touchRef.current.lastClickedPane === ep &&
                touchRef.current.lastTouchBehavior === 'edit'
              ) {
                return onEdit(ep.dataset.id)
              }

              touchRef.current.lastClickedPane = ep

              // click was on, or initiated on, an event pane:
              if (
                ep ||
                touchRef.current.eventPane ||
                touchRef.current.lastTouchBehavior === 'create'
              ) {
                // Do not expand.
                return
              }

              if (touchRef.current.lastTouchBehavior !== 'create') {
                log('🪂 expanding')
                const dayBox = e.target.closest('.weekday-box')
                if (dayBox) {
                  return onExpand(dayjs(dayBox.dataset.day))
                }
              }

              return
            }

            if (action === 'delete') {
              log('✖️ handling delete ...')
              const ep = e.target.closest('.event-pane')
              if (ep) {
                const shadow = ep.parentNode.querySelector(
                  `.accent-shadow-${ep.dataset.id.replace(' ', '-')}`
                )
                if (shadow) {
                  shadow.style.opacity = 0
                }
                ep.style.transition = 'opacity 250ms ease-out'
                ep.style.boxShadow = '0 0 0 #0000'
                const ip = ep.querySelector('.pane-inner')
                if (ip) {
                  ip.style.transition = 'background-color 150ms ease-out'
                  ip.style.backgroundColor = '#222f'
                }
                ep.style.opacity = 0
                setTimeout(() => onDelete(ep.dataset.id), 300)
              }
              return
            }
          }}
          onPointerUp={e => {
            log('⬆️ handling pointer up')
            setShowGhost(false)
            setGhostWeekColor(ghostFadeInColor)

            if (action === 'create' && touchRef.current.isDragCreating) {
              touchRef.current.isDragCreating = false

              const selections = {
                type: document.querySelector('.type-field input').value,
                color: document.querySelector('.color-field input')?.value,
                title: document.querySelector('.title-field input')?.value,
              }

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

                onCreate(
                  createEventObject({
                    startTime: initialTime,
                    endTime: finalTime,
                    summary:
                      selections.type === 'Default'
                        ? selections.title
                        : selections.type,
                    description: ' ',
                    colorId:
                      selections.type === 'Default'
                        ? selections.color
                        : selections.type,
                    id: `idem ${Math.floor(Math.random() * 1e9)}`,
                  })
                )
              }
              return
            }

            touchRef.current.isDragCreating = false

            // If interacting with an event pane,
            // apply the 'selected' state
            const ep = e.target.closest('.event-pane')
            if (ep && ep === touchRef.current.eventPane) {
              ep.classList.add('selected')
              ep.classList.add('show-pencil')
              if (touchRef.current.selectionTimeout) {
                clearTimeout(touchRef.current.selectionTimeout)
              }
              touchRef.current.selectionTimeout = setTimeout(
                () => clearSelection(touchRef),
                4000
              )
            }

            if (touchRef.current.eventPane) {
              touchRef.current.eventPane.style.filter = ''
            }
            if (touchRef.current.event) {
              const snappedDay = snapDay(e.pageX)
              const snappedMinute = snapMinute(snappedDay, e.pageY)
              const snappedStart = startOfWeek
                .add(snappedDay, 'days')
                .add(snappedMinute, 'minutes')

              const update = {
                startTime: snappedStart,
                endTime: snappedStart.add(
                  touchRef.current.event.endTime.diff(
                    touchRef.current.event.startTime,
                    'minutes'
                  ),
                  'minutes'
                ),
              }

              // Only update if the event has been dragged:
              if (!update.startTime.isSame(touchRef.current.event.startTime)) {
                onUpdate(
                  touchRef.current.event.stableKey ?? touchRef.current.event.id,
                  update
                )
              }

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
          onPointerDown={e =>
            handlePointerDown(
              e,
              touchRef,
              ghostElementRef,
              action,
              onHideDrawer,
              updateTouchBounds,
              setShowGhost,
              colorizerTheme,
              setGhostWeekColor,
              updateDragCreation,
              events,
              updateDragMove
            )
          }
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
          sx={{
            touchAction: action === 'create' ? 'none' : undefined,
            display: 'grid',
            cursor: action === 'create' ? 'cell' : undefined,
            gridTemplateColumns: 'repeat(7, 1fr)',
            width: '100%',
            borderTop: '1px solid #aaf3',
            borderRight: '1px solid #111f',
            boxShadow: '1rem 1.5rem 2rem #0114',
            '& .event-pane .pane-inner div':
              action !== 'delete'
                ? undefined
                : {
                    color: '#fff',
                  },
            '& .event-pane .pane-inner .brief-details':
              action !== 'delete'
                ? undefined
                : {
                    filter: 'brightness(100%)',
                  },
            '& .event-pane:before':
              action !== 'delete'
                ? undefined
                : {
                    content: '""',
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    display: 'block',
                    backgroundColor: '#0009',

                    boxShadow: '0 0 1rem #ff4545e0 inset',
                  },
            '& .event-pane:after':
              action !== 'delete'
                ? undefined
                : {
                    zIndex: 1,
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    width: '100%',
                    height: '100%',
                    display: 'block',
                    backgroundImage: `url(${redX})`,
                    backgroundSize: '0.75rem',
                    backgroundPosition: 'top 6px right 7px',
                    backgroundRepeat: 'no-repeat',
                  },
          }}
        >
          {days.map(day => (
            <WeekdayBox
              key={day.format('MM D')}
              touchRef={touchRef}
              onExpand={onExpand}
              day={day}
              displayHeightPx={displayHeightPx}
              weekEvents={filteredEvents}
            />
          ))}
        </Box>
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

    log('weekly body assembled in: ', Date.now() - memoBenchStart, 'ms')
    return assembledContents
  }, [
    dateString,
    events,
    filteredEvents,
    action,
    needMobileBar,
    touchRef,
    onExpand,
    onUpdate,
    onDelete,
    onHideDrawer,
    onCreate,
    onEdit,
    isModeratelyWide,
    registerTouchStart,
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

function BottomDrawer({ open }) {
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
        <CreationPicker layout="drawer" />
      </Collapse>
    </div>
  )
}

function TopDrawer({ open }) {
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
        <CreationPicker layout="shade" active={open} />
      </Collapse>
    </div>
  )
}

export function WeeklyView({
  dateString,
  onBack,
  onExpand,
  onChange,
  onCreate,
  onUpdate,
  onDelete,
}) {
  log('%cWeeklyView rendering', 'color:greenyellow')
  const [shouldDismount, dismount] = useReducer(() => true, false)
  const [editingEvent, setEditingEvent] = useState(false)
  const [skipDate, setSkipDate] = useState(null)
  const touchRef = useRef({})
  const { data: events } = useViewQuery()
  const logger = useLogger()
  const logId = Math.round(Math.random() * 1e6)

  const benchStart = performance.now()
  const isSmall = useMediaQuery('(max-width: 600px)')
  const isReallySmall = useMediaQuery('(max-width: 320px)')
  const isNarrow = useNarrowCheck()
  const needMobileBar = useMobileBarCheck()

  const date = dayjs(dateString)
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
  const onHideDrawerCallback = useCallback(() => setShowDrawer(false), [])
  const onExpandCallback = useCallback(
    d => {
      dismount()
      onExpand(d)
    },
    [onExpand]
  )
  const onCreateCallback = useCallback(
    creation => {
      setShowDrawer(false)
      setAction('edit')
      onCreate(creation)
    },
    [onCreate]
  )
  const onUpdateCallback = useCallback(
    (...updates) => {
      removeTutorialStage('drag and drop')
      onUpdate(...updates)
    },
    [onUpdate]
  )
  const onBackCallback = useCallback(() => {
    dismount()
    onBack()
  }, [onBack])

  if (shouldDismount) {
    log('%cdismounting weekly view', 'color:yellowgreen')
    return <></>
  }

  const actionButtons = (
    <ActionButtons
      onBehavior={b => {
        clearSelection(touchRef)
        setAction(b)
        if (b === 'create') {
          removeTutorialStage('drag create')
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
        {events.length > 0 && (
          <TutorialDialog tip="drag and drop" position="under" />
        )}
        <TutorialDialog
          tip="drag create"
          position={isNarrow ? 'bottom-right' : 'right'}
        />
        <ViewHeader gradient={null}>
          <IconButton
            aria-label="back to monthly view"
            onPointerDown={onBackCallback}
          >
            <CalendarViewMonthIcon />
          </IconButton>
          <IconButton
            aria-label="previous week"
            onPointerDown={() => {
              setSkipDate(date)
              onChange(date.subtract(1, 'week').startOf('week'))
            }}
            sx={{
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
            onPointerDown={() => {
              setSkipDate(date)
              onChange(date.add(1, 'week').startOf('week'))
            }}
            sx={{
              mr: 'auto',
              borderBottomLeftRadius: 0,
              borderTopLeftRadius: 0,
            }}
          >
            <NavigateNextIcon />
          </IconButton>

          {!needMobileBar && actionButtons}

          {!needMobileBar && <TopDrawer open={showDrawer} />}
        </ViewHeader>

        {/* Skip to bypass redundant renders on navigation: */}
        {skipDate?.toString() !== dateString && (
          <WeekBody
            touchRef={touchRef}
            dateString={dateString}
            events={events}
            onCreate={onCreateCallback}
            onEdit={setEditingEvent}
            onExpand={onExpandCallback}
            onUpdate={onUpdateCallback}
            onDelete={onDelete}
            onHideDrawer={onHideDrawerCallback}
          />
        )}
      </ViewContainer>
      {needMobileBar && (
        <MobileBar transparent={showDrawer}>{actionButtons}</MobileBar>
      )}
      {needMobileBar && <BottomDrawer open={showDrawer} />}
      {editingEvent && (
        <EventEditor
          onSave={updates => {
            onUpdate(editingEvent, updates)
            setEditingEvent(null)
          }}
          onClose={() => setEditingEvent(null)}
          onDelete={onDelete}
          event={events.find(
            e => e.id === editingEvent || e.stableKey === editingEvent
          )}
        />
      )}
    </ActionContext.Provider>
  )

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
