import DoubleUpIcon from '@mui/icons-material/KeyboardDoubleArrowUp'
import DoubleDownIcon from '@mui/icons-material/KeyboardDoubleArrowDown'
import AlignTopIcon from '@mui/icons-material/VerticalAlignTop'
import AlignBottomIcon from '@mui/icons-material/VerticalAlignBottom'
import EditIcon from '@mui/icons-material/Edit'
import { mockStyles } from './mockCalendar.mjs'
import { Box, IconButton, useTheme } from '@mui/material'
import { useState } from 'react'

const noop = () => {}

function PaneControls({
  augmentedColors,
  onGhostStart,
  onGhostEnd,
  onAdjustTop,
  onAdjustBottom,
}) {
  function handleDrag(event, onAdjust) {
    onGhostStart()
    onAdjustTop(0)
    onAdjustBottom(0)
    event.currentTarget.setPointerCapture(event.pointerId)

    const moveStart = event.clientY
    const bounds = event.currentTarget.getBoundingClientRect()
    event.currentTarget.onpointermove = move => {
      onAdjust(Math.round((move.clientY - moveStart) / bounds.height / 0.5))
    }
  }

  return (
    <>
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
          transform: 'translate(-50%, -100%) scale(2)',
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
          handleDrag(e, onAdjustTop)
        }}
        onPointerUp={e => {
          onGhostEnd()
          e.currentTarget.onpointermove = null
        }}
      >
        <AlignTopIcon />
      </IconButton>
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
          transform: 'translate(-50%, 0%) scale(2)',
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
          handleDrag(e, onAdjustBottom)
        }}
        onPointerUp={e => {
          onGhostEnd()
          e.currentTarget.onpointermove = null
        }}
      >
        <AlignBottomIcon />
      </IconButton>
    </>
  )
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
}) {
  const [ghost, setGhost] = useState(false)
  const [ghostTop, setGhostTop] = useState(0)
  const [ghostBottom, setGhostBottom] = useState(0)

  const theme = useTheme()
  const selectable = label === 'detailed'

  const overflowBefore = event.start.dateTime.isBefore(initial)
  const overflowAfter = event.end.dateTime.isAfter(final)
  // Crop the event duration to fit the window
  const fragmentStart = overflowBefore ? initial : event.start.dateTime
  const fragmentEnd = overflowAfter ? final : event.end.dateTime

  const topOffset = fragmentStart.diff(initial)
  const windowLength = fragmentEnd.diff(fragmentStart)
  const intervalSize = final.diff(initial)

  const fifteenMinuteInterval = (15 * 60 * 1000) / intervalSize

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

  let header = null
  let details = null

  if (label === 'brief') {
    header = event.summary
  }

  if (label === 'detailed') {
    header = event.summary
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

  return (
    <>
      <Box
        onClick={e => {
          if (label !== 'detailed') return
          e.stopPropagation()
          if (selected) {
            return onEdit()
          }

          onSelect(event.id)
        }}
        sx={{
          position: 'absolute',
          top: (topOffset / intervalSize) * 100 + '%',
          left: indent * (100 / columns) + '%',
          height: (windowLength / intervalSize) * 100 + '%',
          width: 100 / columns + '%',
          zIndex: selected ? 2 : 1,          
          transition: 'top 0.35s ease-out, height 0.35s ease-out',
          opacity: ghost && 0.5,

        }}
      >
        {overflowArrows}

        {/* Inner container -- overflow hidden */}
        <div
          style={{
            boxShadow: label === 'none' && `0px 0px 2rem ${accentColor} inset`,
            ...borderStyles,
            ...referenceStyle,
            backgroundColor:
              label === 'detailed' ? verboseBackground : shadeColor,

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
              onGhostStart={() => setGhost(true)}
              onGhostEnd={() => {
                const updates = {
                  id: event.id,
                  start: { dateTime: event.start.dateTime.add(ghostTop * 15, 'minutes') },
                  end: { dateTime: event.end.dateTime.add(ghostBottom * 15, 'minutes') },
                }
                setGhost(false)
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

      {/* event outline ghost, displayed during drag-resizing: */}
      {ghost && (
        <div
          style={{
            position: 'absolute',
            top:
              (topOffset / intervalSize + fifteenMinuteInterval * ghostTop) *
                100 +
              '%',
            left: indent * (100 / columns) + '%',
            height:
              (windowLength / intervalSize +
                fifteenMinuteInterval * (ghostBottom - ghostTop)) *
                100 +
              '%',
            width: 100 / columns + '%',
            border: `3px dashed ${augmentedColors.light}`,
            backgroundColor: '#fff2',
            boxShadow: `0 0 3rem inset ${accentColor}`,
            zIndex: 2,
          }}
        ></div>
      )}

      {/* drop shadow mock pseudo-element for correct z-indexing: */}
      <div
        style={{
          position: 'absolute',
          top: (topOffset / intervalSize) * 100 + '%',
          left: indent * (100 / columns) + '%',
          height: (windowLength / intervalSize) * 100 + '%',
          width: 100 / columns + '%',
          boxShadow: !selected && '0.25rem 0.25rem 0.5rem #0008',
        }}
      />
    </>
  )
}
