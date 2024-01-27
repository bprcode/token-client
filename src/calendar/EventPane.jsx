import DoubleUpIcon from '@mui/icons-material/KeyboardDoubleArrowUp'
import DoubleDownIcon from '@mui/icons-material/KeyboardDoubleArrowDown'
import AlignTopIcon from '@mui/icons-material/VerticalAlignTop'
import AlignBottomIcon from '@mui/icons-material/VerticalAlignBottom'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import {
  mockStyles,
  getAugmentedColor,
  shorthandInterval as calculateShorthand,
} from './calendarLogic.mjs'
import { Box, IconButton, Zoom, useTheme, styled } from '@mui/material'
import { useContext, useState } from 'react'
import { ActionContext } from './ActionContext.mjs'
import { useLogger } from './Logger'

const noop = () => {}

function snap15Minute(time, steps) {
  if (steps === 0) return time

  const m = time.minute()
  const floor = time.minute(m - (m % 15))

  const offset = steps < 0 && m % 15 !== 0 ? steps + 1 : steps
  return time.minute(floor.minute() + offset * 15)
}

const selectableStyles = {
  '& .edit-overlay': {
    visibility: 'hidden',
  },
  '&.show-pencil .edit-overlay, &.full-pane .edit-overlay': {
    visibility: 'visible',
  },
  '&.selected': {
    border: '1px solid #ffaf33',
  },
  '&.selected .pane-inner': {
    backgroundColor: '#6e2a08',
    boxShadow: '0 0 1rem #ffaf33 inset',
    border: 'none',
  },
  '&.selected .pane-inner div': {
    color: '#eee',
  },
}

const BrightHoverBox = styled(Box)({
  ...selectableStyles,
  '&&:hover': {
    // Brightness is multiplicative with parent hover filter:
    filter: 'brightness(90%) saturate(80%)',
  },
  '&&&:active': {
    filter: 'brightness(110%) saturate(70%)'
  }
})

function OverflowArrows({ before, after, accentColor }) {
  return (
    <>
      {before && (
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
      {after && (
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
}

function EditIconOverlay() {
  const theme = useTheme()

  return (
    <Box
      className="edit-overlay"
      sx={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        overflow: 'hidden',
        display: 'grid',
        placeContent: 'center',
      }}
    >
      <EditIcon
        fontSize="large"
        sx={{
          color: theme.palette.secondary.light,
          borderRadius: '50%',
          padding: '0.625rem',
          scale: '2.0',
          backgroundImage:
            'radial-gradient' + '(closest-side, #7e2f08d0 25%, #7e2f0800 70%)',
        }}
      />
    </Box>
  )
}

// drop shadow mock pseudo-element for correct z-indexing:
function AccentShadow({ hide, positioning, id = '' }) {
  if (hide) return

  return (
    <div
      className={`accent-shadow-${id.replace(' ', '-')}`}
      style={{
        ...positioning,
        boxShadow: '0.25rem 0.5rem 1.5rem #0008',
        transition:
          'top 0.35s ease-out, height 0.35s ease-out, left 0.35s ease-out',
        zIndex: 1,
      }}
    />
  )
}

function BriefPane({
  positioning,
  overflowBefore,
  overflowAfter,
  borderStyles,
  accentColor,
  shadeColor,
  augmentedColors,
  referenceStyle,
  hideShadows,
  header,
  event,
  action,
  children,
}) {
  return (
    <>
      <BrightHoverBox
        className="event-pane"
        data-id={event.stableKey ?? event.id}
        sx={{
          '&&:hover':
            action !== 'create'
              ? undefined
              : {
                  // Cancel out parent brightness filter when creating
                  filter: 'brightness(71%)',
                },
          touchAction: 'none',
          cursor:
            action === 'create'
              ? 'cell'
              : action === 'delete'
              ? 'crosshair'
              : 'grab',
          ...positioning,
          zIndex: 2,
          transition:
            'top 0.35s ease-out, height 0.35s ease-out, left 0.35s ease-out',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          opacity: event.isDeleting ? 0.3 : 1.0,
        }}
      >
        <EditIconOverlay />
        <OverflowArrows
          before={overflowBefore}
          after={overflowAfter}
          accentColor={accentColor}
        />
        {/* Inner container -- overflow hidden */}
        <Box
          className="pane-inner"
          sx={{
            boxShadow: `0px 0px 1rem ${shadeColor} inset`,
            ...borderStyles,
            ...referenceStyle,
            backgroundColor: accentColor,

            overflow: 'hidden',
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            transition: 'background-color 0.2s ease-out',

            paddingTop: ['0px', '4px'],
          }}
        >
          {/* pane header */}
          <Box
            sx={{
              touchAction: 'none',
              pointerEvents: 'none',
              paddingLeft: ['1px', '4px'],
              paddingRight: '0.25rem',
              whiteSpace: 'nowrap',
              position: 'relative',
              color: augmentedColors.contrastText,
            }}
          >
            {header}
          </Box>
          <Box
            sx={{
              height: '100%',
              color: augmentedColors.contrastText,
              paddingLeft: ['1px', '4px'],
            }}
          >
            {children}
          </Box>
        </Box>
      </BrightHoverBox>
      <AccentShadow
        hide={hideShadows}
        positioning={positioning}
        id={event.stableKey ?? event.id}
      />
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
  onDelete = noop,
}) {
  const action = useContext(ActionContext)
  const theme = useTheme()
  const isSelectable = label === 'detailed'

  const logger = useLogger()

  // Remove shadow elements to improve scrolling performance on Firefox Mobile
  const hideShadows =
    navigator.userAgent.includes('Mobile') &&
    navigator.userAgent.includes('Firefox')

  const [sliding, setSliding] = useState(false)
  const [ghost, setGhost] = useState(false)
  const [ghostTop, setGhostTop] = useState(0)
  const [ghostBottom, setGhostBottom] = useState(0)
  const [isFading, setIsFading] = useState(false)

  const duration = event.endTime.diff(event.startTime) / 1000 / 60

  const overflowBefore = event.startTime.isBefore(initial)
  const overflowAfter = event.endTime.isAfter(final)
  // Crop the event duration to fit the window
  const fragmentStart = overflowBefore ? initial : event.startTime
  const fragmentEnd = overflowAfter ? final : event.endTime

  const topOffset = fragmentStart.diff(initial)
  const windowLength = fragmentEnd.diff(fragmentStart)
  const intervalSize = final.diff(initial)

  // Calculated CSS properties:
  const positioning = {
    position: 'absolute',
    top: (topOffset / intervalSize) * 100 + '%',
    left: indent * (100 / columns) + '%',
    height: (windowLength / intervalSize) * 100 + '%',
    width: 100 / columns + '%',
  }

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
  const shorthandInterval = calculateShorthand(event.startTime, event.endTime)

  // Styling constants
  const referenceStyle =
    mockStyles.get(event.summary) || mockStyles.get('Default')
  const augmentedColors = getAugmentedColor(event.colorId)
  if (!augmentedColors) {
    console.log('failed to retrieve ', event.colorId)
  }

  const accentColor = augmentedColors.main
  const shadeColor = augmentedColors.dark
  const deleteWarning = action === 'delete' ? '#4f190e' : undefined
  const verboseBackground =
    deleteWarning ?? (selected && isSelectable ? '#6e2a08' : '#222233')

  let borderColor = accentColor
  if (selected) borderColor = theme.palette.secondary.light
  if (ghost) borderColor = augmentedColors.main

  const roomForIcon = fragmentEnd.diff(fragmentStart) / (60 * 1000) > 45

  const borderStyles =
    label === 'detailed'
      ? {
          borderLeft: `0.125rem ${borderColor} solid`,
          borderRight: `0.125rem ${borderColor} solid`,
          borderTop:
            `0.125rem ${borderColor} ` + (overflowBefore ? 'dashed' : 'solid'),
          borderBottom:
            `0.125rem ${borderColor} ` + (overflowAfter ? 'dashed' : 'solid'),
        }
      : {
          borderLeft: `0.125rem ${borderColor} solid`,
          borderTop:
            `0.125rem ${borderColor} ` + (overflowBefore ? 'dashed' : 'solid'),
          borderRight: `1px solid ${shadeColor}`,
          borderBottom: `1px solid ${shadeColor}`,
        }

  // Assemble content elements:
  let header = null
  let details = null

  if (label === 'brief') {
    header = duration > 60 && (
      <Box
        className="brief-title"
        sx={{
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
        }}
      >
        {event.summary}
      </Box>
    )
    details = duration > 120 && (
      <div className="brief-details">
        {shorthandInterval.split('–')[0]}
        <wbr />
        {'–'}
        <wbr />
        {shorthandInterval.split('–')[1]}
      </div>
    )
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
        {duration >= 60 && Math.floor(duration / 60) + 'h'}&nbsp;
        {duration % 60 !== 0 && (duration % 60) + 'm'}
        <br />
        {event.description && (
          <>
            <div>
              ID: <span style={{ color: '#8ef' }}>{event.id}</span>
            </div>
            <div>
              etag: <span style={{ color: '#fc4' }}>{event.etag}</span>
            </div>
            <div>colorId: {event.colorId}</div>
            <div>{event.description}</div>
            {event.unsaved && (
              <div>
                unsaved: <span style={{ color: '#0ef' }}>{event.unsaved}</span>
              </div>
            )}
            {event.originTag && (
              <div>
                originTag:{' '}
                <span style={{ color: '#fe0' }}>{event.originTag}</span>
              </div>
            )}

            {event.isDeleting && (
              <div style={{ color: '#f00' }}>isDeleting</div>
            )}

            {event.stableKey && (
              <div>
                stableKey:{' '}
                <span style={{ color: '#08a' }}>{event.stableKey}</span>
              </div>
            )}
          </>
        )}
      </div>
    )
  }

  // Interaction handlers:
  function handlePointerDown(e) {
    if (e.buttons !== 1) return

    let tickSize = 24
    try {
      const inner = e.currentTarget.closest('.section-inner')

      if (!inner) {
        throw Error('EventPane ancestor DOM mismatch')
      }

      const fifteenMinuteSliceCount = intervalSize / 1000 / 60 / 15
      const bounds = inner.getBoundingClientRect()
      tickSize = bounds.height / fifteenMinuteSliceCount
    } catch (e) {
      console.warn('EventPane ancestor DOM mismatch. Using default tickSize.')
    }

    const touchStart = { x: e.clientX, y: e.clientY }
    const touchTarget = e.currentTarget

    switch (action) {
      case 'delete':
        if (isFading) {
          return
        }

        setIsFading(true)
        setTimeout(() => onDelete(event.id), 350)
        return
      case 'edit':
        logger('setting capture')
        // N.B. working around this Safari setPointerCapture bug:
        // https://bugs.webkit.org/show_bug.cgi?id=220196
        touchTarget.querySelector('.pane-inner').setPointerCapture(e.pointerId)

        touchTarget.onpointermove = move => {
          logger('move 1: ' + move.clientX)

          const distance = Math.sqrt(
            (move.clientX - touchStart.x) ** 2 +
              (move.clientY - touchStart.y) ** 2
          )

          if (distance / tickSize > 1) {
            logger('starting second move...')
            setSliding(true)
            setGhost(true)
            setGhostTop(0)
            setGhostBottom(0)

            touchTarget.onpointermove = move => {
              logger('move 2: ' + move.clientX)

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
    logger('handling pointer up')
    setGhost(false)

    switch (action) {
      case 'delete':
        return
      case 'edit':
        e.currentTarget.parentElement.ontouchmove = undefined
        e.currentTarget.onpointermove = null

        if (sliding) {
          setGhostTop(0)
          setGhostBottom(0)
          setSliding(false)
          onSelect(null)
          e.currentTarget.onpointermove = null

          const newStart = overflowBefore
            ? ghostSnapEnd.subtract(duration, 'minutes')
            : ghostSnapStart
          const newEnd = overflowAfter
            ? ghostSnapStart.add(duration, 'minutes')
            : ghostSnapEnd

          const updates = {
            ...(overflowBefore || ghostTop !== 0
              ? { startTime: newStart }
              : {}),
            ...(overflowAfter || ghostBottom !== 0 ? { endTime: newEnd } : {}),
          }
          onUpdate(event.stableKey ?? event.id, updates)
          return
        }

        if (label !== 'detailed') return
        if (selected && !ghost) {
          return onEdit(true)
        }

        onSelect(event.id)
        return
    }
  }

  if (label === 'brief') {
    return (
      <BriefPane
        {...{
          positioning,
          overflowBefore,
          overflowAfter,
          borderStyles,
          accentColor,
          shadeColor,
          augmentedColors,
          referenceStyle,
          hideShadows,
          event,
          action,
          header,
        }}
      >
        {details}
      </BriefPane>
    )
  }

  const eventHandlers =
    label === 'detailed'
      ? {
          onPointerDown: handlePointerDown,
          onPointerUp: handlePointerUp,
          onPointerCancel: () => {
            setSliding(false)
            setGhost(false)
            logger('interaction cancelled')
          },
          onClick: e => e.stopPropagation(),
        }
      : {}

  // Assembled component:
  return (
    <>
      <Zoom in={!isFading} appear={false} timeout={250}>
        <Box
          className="event-pane full-pane"
          {...eventHandlers}
          data-id={event.stableKey ?? event.id}
          sx={{
            ...selectableStyles,
            touchAction: 'none',
            cursor:
              action === 'create'
                ? 'cell'
                : action === 'delete'
                ? 'crosshair'
                : selected && isSelectable
                ? 'pointer'
                : 'grab',
            ...positioning,
            zIndex: selected ? 3 : 2,
            transition:
              'top 0.35s ease-out, height 0.35s ease-out, left 0.35s ease-out',
            opacity: !event.isDeleting ? ghost && 0.5 : 0.15,
            userSelect: 'none',
            WebkitUserSelect: 'none',
          }}
        >
          <OverflowArrows
            before={overflowBefore}
            after={overflowAfter}
            accentColor={accentColor}
          />

          {/* Inner container -- overflow hidden */}
          <Box
            className="pane-inner"
            sx={{
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
                touchAction: 'none',
                pointerEvents: 'none',
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
                intervalSize={intervalSize}
                showTop={!overflowBefore}
                showBottom={!overflowAfter}
                showTabs={!ghost}
                onGhostStart={() => setGhost(true)}
                onGhostEnd={() => {
                  setSliding(false)
                  const updates = {
                    ...(ghostTop !== 0 ? { startTime: ghostSnapStart } : {}),
                    ...(ghostBottom !== 0 ? { endTime: ghostSnapEnd } : {}),
                  }
                  setGhost(false)
                  setGhostTop(0)
                  setGhostBottom(0)
                  onUpdate(event.stableKey ?? event.id, updates)
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
                  touchAction: 'none',
                  pointerEvents: 'none',
                  display: 'flex',
                  flexGrow: 1,
                  overflow: 'hidden',
                  position: 'relative',
                  color:
                    label === 'brief'
                      ? augmentedColors.contrastText
                      : selected && '#aaa',
                }}
              >
                {details}

                {/* Only shown while in delete mode: */}
                {action === 'delete' && (
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
                    <DeleteIcon
                      fontSize="large"
                      sx={{
                        color: '#ff6b6b',
                        borderRadius: '50%',
                        padding: '0.625rem',
                        scale: '2.5',
                        backgroundImage:
                          'radial-gradient' +
                          '(closest-side, #ff6b6b20 5%, #ff6b6b00)',
                      }}
                    />
                  </IconButton>
                )}

                {/* Icon for opening detailed edit mode: */}
                {selected && roomForIcon && !ghost && (
                  <EditIconOverlay />
                  // <IconButton
                  //   sx={{
                  //     position: 'absolute',
                  //     top: '50%',
                  //     left: '50%',
                  //     transform: 'translate(-50%, -50%)',
                  //     zIndex: 1,
                  //     padding: 0,
                  //     margin: 0,
                  //   }}
                  // >
                  //   <EditIcon
                  //     fontSize="large"
                  //     sx={{
                  //       color: theme.palette.secondary.light,
                  //       borderRadius: '50%',
                  //       padding: '0.625rem',
                  //       scale: '2.5',
                  //       backgroundImage:
                  //         'radial-gradient' +
                  //         '(closest-side, #7e2f08 5%, #7e2f0800)',
                  //     }}
                  //   />
                  // </IconButton>
                )}

                {event.description && label === 'detailed' && (
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
                          `${verboseBackground}, ${verboseBackground + '00'})`,
                    }}
                  />
                )}
              </div>
            )}
          </Box>
        </Box>
      </Zoom>

      {/* event outline ghost, displayed during drag-resizing: */}
      {ghost && (
        <div
          style={{
            ...positioning,
            top: (ghostTopOffset / intervalSize) * 100 + '%',
            height: (ghostWindowLength / intervalSize) * 100 + '%',

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

      <AccentShadow
        hide={hideShadows}
        positioning={positioning}
        id={event.stableKey ?? event.id}
      />
    </>
  )
}

function handleTabDrag(event, onAdjust, intervalSize, logger) {
  // Set capture to inner div for Safari workaround
  event.currentTarget
    .querySelector('.inner-tab')
    .setPointerCapture(event.pointerId)

  let tickSize = 24
  try {
    const inner = event.currentTarget.closest('.section-inner')
    if (!inner) {
      throw Error('EventPane ancestor DOM mismatch')
    }

    const fifteenMinuteSliceCount = intervalSize / 1000 / 60 / 15
    const bounds = inner.getBoundingClientRect()
    tickSize = bounds.height / fifteenMinuteSliceCount
  } catch (e) {
    console.warn('EventPane ancestor DOM mismatch. Using default tickSize.')
  }

  const moveStart = event.clientY
  event.currentTarget.onpointermove = move => {
    logger('tab move: ' + move.clientX)
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
  intervalSize,
}) {
  function beginTabDrag() {
    onGhostStart()
    onAdjustTop(0)
    onAdjustBottom(0)
  }

  const logger = useLogger()
  const iconColor = augmentedColors.contrastText

  const IconButtonStyles = {
    padding: 0,
    width: '3rem',
    height: '3rem',
    zIndex: -1,
    backgroundColor: augmentedColors.main,
    position: 'absolute',

    left: '50%',
    borderRadius: 0,
    boxShadow: '0.25rem 0.25rem 0.5rem #0008',

    opacity: Number(showTabs),
    '&:hover': {
      backgroundColor: augmentedColors.light,
    },
  }

  return (
    <>
      {showTop && (
        <IconButton
          className="top-button"
          sx={{
            ...IconButtonStyles,
            top: '6px',
            transform: `translate(-50%, -100%)`,
          }}
          onPointerDown={e => {
            if (e.buttons !== 1) return
            logger('top tab down, t=' + e.target.classList[0])
            beginTabDrag()
            handleTabDrag(e, onAdjustTop, intervalSize, logger)
            e.stopPropagation()
          }}
          onPointerUp={e => {
            onGhostEnd()
            logger('top-up')
            e.currentTarget.onpointermove = null
          }}
          onPointerCancel={() => {
            logger('🙀 pointer tab cancel')
          }}
        >
          <div
            className="inner-tab"
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              paddingTop: '3px',
            }}
          >
            <AlignTopIcon
              className="arrow-icon"
              sx={{
                pointerEvents: 'none',
                touchAction: 'none',
                transform: 'scale(2)',
                color: iconColor,
              }}
            />
          </div>
        </IconButton>
      )}
      {showBottom && (
        <IconButton
          sx={{
            ...IconButtonStyles,

            top: 'calc(100% - 6px)',
            transform: `translate(-50%, 0%)`,
          }}
          onPointerDown={e => {
            if (e.buttons !== 1) return
            logger('bottom tab down')
            beginTabDrag()
            handleTabDrag(e, onAdjustBottom, intervalSize, logger)
            e.stopPropagation()
          }}
          onPointerUp={e => {
            onGhostEnd()
            logger('bottom-up')
            e.currentTarget.onpointermove = null
          }}
          onPointerCancel={() => {
            logger('🙀 pointer tab cancel')
          }}
        >
          <div
            className="inner-tab"
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              paddingBottom: '3px',
            }}
          >
            <AlignBottomIcon
              sx={{
                pointerEvents: 'none',
                touchAction: 'none',
                transform: 'scale(2)',
                color: iconColor,
              }}
            />
          </div>
        </IconButton>
      )}
    </>
  )
}
