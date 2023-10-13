import {
  IconButton,
  Paper,
  Typography,
  Collapse,
  useMediaQuery,
  useTheme,
  Box,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { SectionedInterval } from './SectionedInterval'
import { DailyBreakdown } from './DailyBreakdown'
import { forwardRef, useCallback, useMemo, useRef, useState } from 'react'
import { EventEditor } from './EventEditor'
import { ActionButtons, MobileBar } from './ActionDisplay'
import { ActionContext, actionList } from './ActionContext.mjs'
import { EventPicker } from './EventPicker'
import {
  createSampleEvent,
  getAugmentedColor,
  usePalette,
} from './calendarLogic.mjs'
import { ViewHeader } from './ViewHeader'
import { useNarrowCheck } from './LayoutContext.mjs'
import { useLogger } from './Logger'
import { shorthandInterval } from './dateLogic.mjs'

const sectionStep = [1, 'hour']

export function DayPage({
  onBack,
  onCreate,
  onUpdate,
  onDelete,
  onUndo,
  canUndo,
  day,
  unfilteredEvents,
  filteredEvents,
}) {
  const isWide = useMediaQuery('(min-width: 600px)')
  const headerRef = useRef(null)
  const logger = useLogger()
  const theme = useTheme()
  const secondaryColor = theme.palette.secondary.light

  const startOfDay = useMemo(() => day.startOf('day'), [day])
  const endOfDay = useMemo(() => day.endOf('day'), [day])

  const palette = usePalette()
  const defaultEventPicks = {
    type: 'Custom',
    colorId: palette[0],
    summary: 'New Event',
  }

  const [shutDrawer, setShutDrawer] = useState(false)

  const [selection, setSelection] = useState(null)
  const [editing, setEditing] = useState(false)
  const [creation, setCreation] = useState(null)
  const [picks, setPicks] = useState(defaultEventPicks)

  const [action, setAction] = useState(actionList[0])

  const applyUpdates = useCallback(
    updates => {
      onUpdate(updates)
      setSelection(null)
    },
    [onUpdate]
  )

  const applyCreation = useCallback(
    creation => {
      onCreate(creation)
      setCreation(null)
      setAction('edit')
      // Workaround for Safari disappearing sticky element bug:
      headerRef.current.scrollIntoView()
    },
    [onCreate]
  )

  const actionButtons = (
    <ActionButtons
      canUndo={canUndo}
      onBehavior={b => {
        setSelection(null)
        if (b === 'undo') return onUndo()
        setAction(b)
      }}
    />
  )

  return (
    <ActionContext.Provider value={action}>
      <Paper
        elevation={1}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          width: '100%',
          px: 0,
          py: 0,
          position: 'relative',
        }}
      >
        {!isWide && <MobileBar>{actionButtons}</MobileBar>}
        <SectionedInterval
          initial={startOfDay}
          final={endOfDay}
          step={sectionStep}
          outsideHeight="100%"
          insideHeight="1800px"
          endMargin={'16.25rem'}
          action={action}
          onPointerDown={e => {
            if (action === 'create') {
              handleCreationTap({ event: e, logger, day, picks, applyCreation })
            }
          }}
          onPointerUp={e => {
            e.currentTarget.onpointermove = null
            if (action !== 'create' || !creation) {
              return
            }
            onCreate(creation)
            setCreation(null)
            setAction('edit')
          }}
          // deselect if the click was not intercepted by an EventPane
          onClick={() => setSelection(null)}
          header={
            <DayHeader
              onBack={onBack}
              day={day}
              ref={headerRef}
              actionButtons={isWide && actionButtons}
            />
          }
        >
          <DailyBreakdown
            day={day}
            unfilteredEvents={unfilteredEvents}
            filteredEvents={filteredEvents}
            mockEvent={creation}
            selection={selection}
            onSelect={setSelection}
            onEdit={setEditing}
            onUpdate={applyUpdates}
            onDelete={onDelete}
          />
          <div
            className="creation-ui-box"
            style={{
              position: 'absolute',
              border: `1px solid ${secondaryColor}`,
              zIndex: 2,
              backgroundColor: '#6e2a08bb',
              overflow: 'hidden',
              fontSize: '0.75rem',
              visibility: 'hidden',
            }}
          >
            <div
              className="creation-ui-header"
              style={{
                backgroundColor: '#0af',
                height: '1.25rem',
                paddingRight: '0.25rem',
                paddingLeft: '0.25rem',
                overflow: 'hidden',
              }}
            ></div>
          </div>
        </SectionedInterval>

        {editing && selection && (
          <EventEditor
            onSave={updates => {
              onUpdate({
                ...updates,
                id: selection,
              })
              setSelection(null)
            }}
            onClose={() => setEditing(false)}
            onDelete={onDelete}
            event={unfilteredEvents.find(e => e.id === selection)}
          />
        )}
        <CreationDrawer action={shutDrawer ? 'none' : action} picks={picks} onPick={setPicks} />
      </Paper>
    </ActionContext.Provider>
  )
}

function CreationDrawer({ action, picks, onPick }) {
  const position = useNarrowCheck() ? 'fixed' : 'sticky'

  return (
    <div style={{ zIndex: 2, position, bottom: 0, width: '100%' }}>
      <Collapse in={action === 'create'}>
        <EventPicker picks={picks} onPick={onPick} />
      </Collapse>
    </div>
  )
}

function overwriteRAF(callback) {
  if (!overwriteRAF.skipCount) {
    overwriteRAF.skipCount = 0
  }
  if (!overwriteRAF.callback) {
    requestAnimationFrame(() => {
      overwriteRAF.callback()
      overwriteRAF.callback = null
    })
  } else {
    overwriteRAF.skipCount++
  }
  overwriteRAF.callback = callback
}

function handleCreationTap({ event, day, logger, picks, applyCreation }) {
  event.stopPropagation()
  event.preventDefault()

  let initialTime
  let finalTime

  const augmentedColor = getAugmentedColor(picks.colorId)
  console.log('acquired color: ', augmentedColor)
  const minimumWidth = 90
  const startOfDay = day.startOf('day')

  const ct = event.currentTarget
  const outputBounds = document
    .querySelector('.section-inner')
    .getBoundingClientRect()

  const uiBox = document.querySelector('.creation-ui-box')
  const uiBoxHeader = document.querySelector('.creation-ui-header')

  const initialX = Math.min(
    event.clientX - outputBounds.left,
    outputBounds.width - minimumWidth
  )
  const initialY = event.clientY - outputBounds.top

  uiBox.style.visibility = 'visible'
  uiBoxHeader.style.color = augmentedColor.contrastText
  uiBoxHeader.style.backgroundColor = augmentedColor.main

  // reinitialize
  uiBox.style.left = event.clientX - outputBounds.left + 'px'
  uiBox.style.top = event.clientY - outputBounds.top + 'px'
  uiBox.style.width = 0 + 'px'
  uiBox.style.height = 0 + 'px'

  ct.setPointerCapture(event.pointerId)
  // ct.querySelector('.section-inner').setPointerCapture(event.pointerId)

  ct.onpointermove = handleMove
  ct.onpointerup = cleanup
  ct.onpointercancel = () => console.log('cancel')

  function cleanup() {
    if (initialTime) {
    applyCreation(
      createSampleEvent({
        startTime: initialTime,
        endTime: finalTime,
        summary: picks.summary,
        colorId: picks.colorId,
      })
    )
    }
    ct.onpointerup = null
    uiBox.style.visibility = 'hidden'
  }

  function handleMove(move) {
    move.preventDefault()
    move.stopPropagation()
    const x2 = move.clientX - outputBounds.left
    const y2 = move.clientY - outputBounds.top

    setBoxNoReact(x2, y2)
  }

  // Bypass re-renders for this interaction, as they result in sluggish
  // performance on low-end devices.
  function setBoxNoReact(x2, y2) {
    overwriteRAF(() => {
      x2 = Math.max(0, Math.min(x2, outputBounds.width))
      y2 = Math.max(0, Math.min(y2, outputBounds.height))
      const left = Math.min(initialX, x2)
      const width =
        x2 > initialX
          ? Math.max(x2 - initialX, minimumWidth)
          : initialX + minimumWidth - x2

      const lowY = Math.min(initialY, y2)
      const hiY = Math.max(initialY, y2)

      setTimeout(() => logger('overwrite skip: ' + overwriteRAF.skipCount), 100)

      const initialMinute =
        Math.floor((24 * 60 * lowY) / outputBounds.height / 15) * 15
      const finalMinute =
        Math.ceil((24 * 60 * hiY) / outputBounds.height / 15) * 15

      initialTime = startOfDay.add(initialMinute, 'minutes')
      finalTime = startOfDay.add(finalMinute, 'minutes')
      uiBoxHeader.textContent = shorthandInterval(initialTime, finalTime)

      const snappedStartY = (initialMinute / (24 * 60)) * outputBounds.height
      const snappedEndY = (finalMinute / (24 * 60)) * outputBounds.height

      uiBox.style.left = left + 'px'
      uiBox.style.top = snappedStartY + 'px'
      uiBox.style.width = width + 'px'
      uiBox.style.height = snappedEndY - snappedStartY + 'px'

      uiBoxHeader.style.textAlign = x2 > initialX ? 'left' : 'right'
    })
  }
}

const DayHeader = forwardRef(function DayHeader(
  { onBack, day, actionButtons },
  ref
) {
  const isTiny = useMediaQuery('(max-width: 350px)')
  const formatted = isTiny
    ? day.format('ddd, MMM D')
    : day.format('dddd, MMMM D')

  return (
    <ViewHeader ref={ref}>
      <IconButton
        sx={{ mt: 0 }}
        aria-label="back to weekly view"
        onClick={onBack}
      >
        <ArrowBackIcon />
      </IconButton>
      <Typography variant="h6" component="div" mb={2} mt={2}>
        {formatted}
      </Typography>

      {actionButtons && <Box sx={{
        display: 'flex',
        flexDirection: 'row',
        rowGap: '1rem',
        position: 'absolute',
        right: '8px',
        top: '8px',
        zIndex: 4,
      }}>
        {actionButtons}
        </Box>}
    </ViewHeader>
  )
})
