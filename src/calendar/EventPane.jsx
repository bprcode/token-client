import DoubleUpIcon from '@mui/icons-material/KeyboardDoubleArrowUp'
import DoubleDownIcon from '@mui/icons-material/KeyboardDoubleArrowDown'
import AlignTopIcon from '@mui/icons-material/VerticalAlignTop'
import AlignBottomIcon from '@mui/icons-material/VerticalAlignBottom'
import EditIcon from '@mui/icons-material/Edit'
import { mockStyles } from './mockCalendar.mjs'
import { Box, IconButton, Zoom, useTheme } from '@mui/material'
import { useContext, useState } from 'react'
import { ActionContext } from './ActionContext.mjs'

const noop = () => {}

function snap15Minute(time, steps) {
  if (steps === 0) return time

  const m = time.minute()
  const floor = time.minute(m - (m % 15))

  const offset = steps < 0 && m % 15 !== 0 ? steps + 1 : steps
  return time.minute(floor.minute() + offset * 15)
}

export function EventPane({
  initial,
  final,
  event,
  indent = 0,
  columns = 1,
  label = 'detailed',
  selected,
  onSelect = noop,
  onEdit = noop,
  onUpdate = noop,
  onDelete = noop,
}) {
  const action = useContext(ActionContext)
  const theme = useTheme()
  const selectable = label === 'detailed'

  const [sliding, setSliding] = useState(false)
  const [ghost, setGhost] = useState(false)
  const [ghostTop, setGhostTop] = useState(0)
  const [ghostBottom, setGhostBottom] = useState(0)
  const [deleting, setDeleting] = useState(false)

  const overflowBefore = event.start.dateTime.isBefore(initial)
  const overflowAfter = event.end.dateTime.isAfter(final)
  // Crop the event duration to fit the window
  const fragmentStart = overflowBefore ? initial : event.start.dateTime
  const fragmentEnd = overflowAfter ? final : event.end.dateTime

  const topOffset = fragmentStart.diff(initial)
  const windowLength = fragmentEnd.diff(fragmentStart)
  const intervalSize = final.diff(initial)

  // Perform bounds checking on drag actions:
  const earliestStart = initial
  const latestStart = sliding
    ? final.subtract(windowLength / 1000 / 60, 'minutes')
    : fragmentEnd.subtract(15, 'minutes')

  const earliestEnd = sliding
    ? initial.add(windowLength / 1000 / 60, 'minutes')
    : fragmentStart.add(15, 'minutes')
  const latestEnd = final

  let boundedStart = snap15Minute(fragmentStart, ghostTop)
  let boundedEnd = snap15Minute(fragmentEnd, ghostBottom)

  if (boundedStart.isBefore(earliestStart)) boundedStart = earliestStart
  if (boundedStart.isAfter(latestStart)) boundedStart = latestStart
  if (boundedEnd.isBefore(earliestEnd)) boundedEnd = earliestEnd
  if (boundedEnd.isAfter(latestEnd)) boundedEnd = latestEnd

  const ghostSnapStart = boundedStart
  const ghostSnapEnd = boundedEnd

  const ghostTopOffset = ghostSnapStart.diff(initial)
  const ghostWindowLength = ghostSnapEnd.diff(ghostSnapStart)

  // Build shorthand time string:
  const crossesMeridian =
    event.start.dateTime.format('A') !== event.end.dateTime.format('A')
  const startShorthand = event.start.dateTime.minute() === 0 ? 'h' : 'h:mm'
  const endShorthand = event.end.dateTime.minute() === 0 ? 'h' : 'h:mm'
  const startAP = crossesMeridian ? event.start.dateTime.format('a')[0] : ''
  const endAP = crossesMeridian ? event.end.dateTime.format('a')[0] : ''
  const shorthandInterval =
    event.start.dateTime.format(startShorthand) +
    startAP +
    '–' +
    event.end.dateTime.format(endShorthand) +
    endAP

  // Styling constants
  const referenceStyle =
    mockStyles.get(event.summary) || mockStyles.get('Default')
  const accentColor = referenceStyle.augmentedColors.main
  const shadeColor = referenceStyle.augmentedColors.dark
  const augmentedColors = referenceStyle.augmentedColors
  const verboseBackground = selected && selectable ? '#6e2a08' : '#223'

  let borderColor = accentColor
  if (selected) borderColor = theme.palette.secondary.main
  if (ghost) borderColor = augmentedColors.main

  const roomForIcon = fragmentEnd.diff(fragmentStart) / (60 * 1000) > 45

  const borderStyles =
    label !== 'none'
      ? {
          borderLeft: `0.125rem ${borderColor} solid`,
          borderRight: `0.125rem ${borderColor} solid`,
          borderTop:
            `0.125rem ${borderColor} ` + (overflowBefore ? 'dashed' : 'solid'),
          borderBottom:
            `0.125rem ${borderColor} ` + (overflowAfter ? 'dashed' : 'solid'),
        }
      : {}

  // Build content elements:
  let header = null
  let details = null

  if (label === 'brief') {
    header = event.summary
  }

  if (label === 'detailed') {
    header = (
      <div
        style={{
          display: 'flex',
          // Hide wrapped child if it causes the header to overflow:
          flexWrap: 'wrap',
          overflow: 'hidden',
          maxHeight: '1.25rem',
          justifyContent: 'space-between',
        }}
      >
        <span>{event.summary}</span>
        <span
          style={{
            paddingLeft: '1rem',
            flexGrow: 1,
            flexShrink: 1,
            textAlign: 'right',
          }}
        >
          {shorthandInterval}
        </span>
      </div>
    )
    details = (
      <div
        style={{
          paddingLeft: '0.25rem',
          paddingRight: '0.25rem',
        }}
      >
        {event.start.dateTime.format('MMM DD HH:mm:ss')} &ndash;{' '}
        {event.end.dateTime.format('MMM DD HH:mm:ss')}
        {event.description && (
          <>
            <br />
            {event.description}
            &mdash;Lorem ipsum dolor sit, amet consectetur adipisicing elit.
            Dolor, qui illum dolorum, quaerat corporis dolores optio
            exercitationem totam perspiciatis libero aliquid provident ullam
            similique aut in temporibus autem eligendi obcaecati vel facere at!
            Temporibus eius, iure voluptatibus est dolorem porro. Adipisci
            blanditiis tempora ad architecto reprehenderit deleniti dolor sunt
            officia?
            <br />
          </>
        )}
      </div>
    )
  }

  const overflowArrows = (
    <>
      {overflowBefore && (
        <div
          style={{
            position: 'absolute',
            left: 'calc(50% - 8px)',
            top: -24,
          }}
        >
          <DoubleUpIcon sx={{ fontSize: 16, mb: -0.5, color: accentColor }} />
        </div>
      )}
      {overflowAfter && (
        <div
          style={{
            position: 'absolute',
            left: 'calc(50% - 8px)',
            top: '100%',
          }}
        >
          <DoubleDownIcon sx={{ fontSize: 16, mb: -0.5, color: accentColor }} />
        </div>
      )}
    </>
  )

  // Interaction handlers:
  function handlePointerDown(e) {
    const tickSize = 24

    const touchStart = { x: e.clientX, y: e.clientY }
    const touchTarget = e.currentTarget

    switch (action) {
      case 'delete':
        if(deleting) return
        console.log('handling deletion')
        setDeleting(true)
        setTimeout(() => onDelete(event.id), 350)
        return
      case 'edit':
        touchTarget.setPointerCapture(e.pointerId)
        touchTarget.onpointermove = move => {
          const distance = Math.sqrt(
            (move.clientX - touchStart.x) ** 2 +
              (move.clientY - touchStart.y) ** 2
          )

          if (distance / tickSize > 1) {
            setSliding(true)
            setGhost(true)
            setGhostTop(0)
            setGhostBottom(0)

            touchTarget.onpointermove = move => {
              const dy = Math.round((move.clientY - touchStart.y) / tickSize)
              setGhostTop(dy)
              setGhostBottom(dy)
            }
          }
        }
        return
    }
  }

  function handlePointerUp(e) {
    switch (action) {
      case 'delete':
        return
      case 'edit':
        e.currentTarget.onpointermove = null

        if (sliding) {
          setGhost(false)
          setGhostTop(0)
          setGhostBottom(0)
          setSliding(false)
          onSelect(null)
          e.currentTarget.onpointermove = null

          const duration =
            event.end.dateTime.diff(event.start.dateTime) / 1000 / 60

          const newStart = overflowBefore
            ? ghostSnapEnd.subtract(duration, 'minutes')
            : ghostSnapStart
          const newEnd = overflowAfter
            ? ghostSnapStart.add(duration, 'minutes')
            : ghostSnapEnd

          const updates = {
            id: event.id,
            start: (overflowBefore || ghostTop !== 0) && {
              dateTime: newStart,
            },
            end: (overflowAfter || ghostBottom !== 0) && {
              dateTime: newEnd,
            },
          }
          onUpdate(updates)
          return
        }

        if (label !== 'detailed') return
        if (selected && !ghost) {
          return onEdit()
        }

        onSelect(event.id)
        return
    }
  }

  // Assembled component:
  return (
    <>
      <Zoom in={!deleting} appear={false} timeout={250}>
        <Box
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onClick={e => {
            if (label === 'detailed') e.stopPropagation()
          }}
          sx={{
            position: 'absolute',
            top: (topOffset / intervalSize) * 100 + '%',
            left: indent * (100 / columns) + '%',
            height: (windowLength / intervalSize) * 100 + '%',
            width: 100 / columns + '%',
            zIndex: selected ? 3 : 2,
            transition: 'top 0.35s ease-out, height 0.35s ease-out',
            opacity: ghost && 0.5,
            userSelect: 'none',
          }}
        >
          {overflowArrows}

          {/* Inner container -- overflow hidden */}
          <div
            style={{
              boxShadow:
                label === 'none' && `0px 0px 0.75rem ${shadeColor} inset`,
              ...borderStyles,
              ...referenceStyle,
              backgroundColor:
                label === 'detailed' ? verboseBackground : accentColor,

              overflow: 'hidden',
              height: '100%',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              transition: 'background-color 0.2s ease-out',
            }}
          >
            {/* pane header */}
            <div
              style={{
                backgroundColor: selected ? augmentedColors.light : accentColor,
                color: augmentedColors.contrastText,
                paddingLeft: '0.25rem',
                paddingRight: '0.25rem',
                whiteSpace: 'nowrap',
                position: 'relative',
              }}
            >
              {header}
            </div>
            {/* pane body */}
            {selected && (
              <PaneControls
                augmentedColors={augmentedColors}
                showTop={!overflowBefore}
                showBottom={!overflowAfter}
                showTabs={!ghost}
                onGhostStart={() => setGhost(true)}
                onGhostEnd={() => {
                  const updates = {
                    id: event.id,
                    start: ghostTop !== 0 && {
                      dateTime: ghostSnapStart,
                    },
                    end: ghostBottom !== 0 && {
                      dateTime: ghostSnapEnd,
                    },
                  }
                  setGhost(false)
                  setGhostTop(0)
                  setGhostBottom(0)
                  onUpdate(updates)
                }}
                onAdjustBottom={offset => {
                  setGhostBottom(offset)
                }}
                onAdjustTop={offset => {
                  setGhostTop(offset)
                }}
              />
            )}

            {details && (
              <div
                style={{
                  display: 'flex',
                  flexGrow: 1,
                  overflow: 'hidden',
                  position: 'relative',
                  color: selected && '#aaa',
                }}
              >
                {details}

                {/* pencil icon */}
                {selected && roomForIcon && !ghost && (
                  <IconButton
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      zIndex: 1,
                      padding: 0,
                      margin: 0,
                    }}
                  >
                    <EditIcon
                      fontSize="large"
                      sx={{
                        color: augmentedColors.light,

                        borderRadius: '50%',
                        padding: '0.625rem',
                        scale: '2.5',
                        backgroundImage:
                          'radial-gradient' +
                          '(closest-side, #7e2f08 5%, transparent)',
                      }}
                    />
                  </IconButton>
                )}

                {event.description && (
                  // fade-out overlay to indicate possible overflowing text:
                  <div
                    style={{
                      height: '2em',
                      width: '100%',
                      position: 'absolute',
                      bottom: 0,
                      background:
                        !selected &&
                        `linear-gradient(to top, ` +
                          `${verboseBackground}, transparent)`,
                    }}
                  />
                )}
              </div>
            )}
          </div>
        </Box>
      </Zoom>

      {/* event outline ghost, displayed during drag-resizing: */}
      {ghost && (
        <div
          style={{
            position: 'absolute',
            top: (ghostTopOffset / intervalSize) * 100 + '%',
            left: indent * (100 / columns) + '%',
            height: (ghostWindowLength / intervalSize) * 100 + '%',
            width: 100 / columns + '%',

            borderLeft: `3px dashed ${augmentedColors.light}`,
            borderRight: `3px dashed ${augmentedColors.light}`,
            borderTop: !overflowBefore && `3px dashed ${augmentedColors.light}`,
            borderBottom:
              !overflowAfter && `3px dashed ${augmentedColors.light}`,
            backgroundImage:
              (overflowBefore || overflowAfter) &&
              `linear-gradient(to ${
                (overflowBefore && 'top') || (overflowAfter && 'bottom')
              }, ${accentColor}, transparent)`,
            backgroundColor: !overflowBefore && !overflowAfter && '#fff2',
            boxShadow:
              !overflowBefore &&
              !overflowAfter &&
              `0 0 3rem inset ${accentColor}`,
            zIndex: 3,
          }}
        ></div>
      )}

      {/* drop shadow mock pseudo-element for correct z-indexing: */}
      {!deleting && (
        <div
        className='foo'
          style={{
            position: 'absolute',
            top: (topOffset / intervalSize) * 100 + '%',
            left: indent * (100 / columns) + '%',
            height: (windowLength / intervalSize) * 100 + '%',
            width: 100 / columns + '%',
            boxShadow: !selected && '0.25rem 0.5rem 1.25rem #0008',
            transition: 'top 0.35s ease-out, height 0.35s ease-out',

            zIndex: 1,
          }}
        />
      )}
    </>
  )
}

function handleDrag(event, onAdjust) {
  event.currentTarget.setPointerCapture(event.pointerId)

  const tickSize = 24
  const moveStart = event.clientY
  event.currentTarget.onpointermove = move => {
    onAdjust(Math.round((move.clientY - moveStart) / tickSize))
  }
}

function PaneControls({
  augmentedColors,
  onGhostStart,
  onGhostEnd,
  showTabs,
  onAdjustTop,
  onAdjustBottom,
  showTop,
  showBottom,
}) {
  function beginDrag() {
    onGhostStart()
    onAdjustTop(0)
    onAdjustBottom(0)
  }

  return (
    <>
      {showTop && (
        <IconButton
          sx={{
            zIndex: -1,
            color: augmentedColors.contrastText,
            backgroundColor: augmentedColors.main,
            position: 'absolute',
            top: '0%',
            left: '50%',
            borderRadius: 0,
            boxShadow: '0.25rem 0.25rem 0.5rem #0008',
            transform: `translate(-50%, -100%) scale(2)`,
            opacity: Number(showTabs),
            padding: '0 0 0.125rem 0',
            '&:hover': {
              backgroundColor: augmentedColors.light,
            },
          }}
          onClick={e => {
            // Prevent propagation to the parent pane:
            e.stopPropagation()
          }}
          onPointerDown={e => {
            beginDrag()
            handleDrag(e, onAdjustTop)
            e.stopPropagation()
          }}
          onPointerUp={e => {
            onGhostEnd()
            e.currentTarget.onpointermove = null
          }}
        >
          <AlignTopIcon />
        </IconButton>
      )}
      {showBottom && (
        <IconButton
          className="drag-handle"
          sx={{
            zIndex: -1,
            color: augmentedColors.contrastText,
            backgroundColor: augmentedColors.main,
            position: 'absolute',
            top: '100%',
            left: '50%',
            borderRadius: 0,
            boxShadow: '0.25rem 0.25rem 0.5rem #0008',
            transform: `translate(-50%, 0%) scale(2)`,
            opacity: Number(showTabs),
            padding: '0 0 0.125rem 0',
            '&:hover': {
              backgroundColor: augmentedColors.light,
            },
          }}
          onClick={e => {
            // Prevent propagation to the parent pane:
            e.stopPropagation()
          }}
          onPointerDown={e => {
            beginDrag()
            handleDrag(e, onAdjustBottom)
            e.stopPropagation()
          }}
          onPointerUp={e => {
            onGhostEnd()
            e.currentTarget.onpointermove = null
          }}
        >
          <AlignBottomIcon />
        </IconButton>
      )}
    </>
  )
}
