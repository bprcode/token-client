import {
  IconButton,
  Paper,
  Typography,
  Collapse,
  useMediaQuery,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { SectionedInterval } from './SectionedInterval'
import { DailyBreakdown } from './DailyBreakdown'
import { useCallback, useMemo, useState } from 'react'
import { EventEditor } from './EventEditor'
import { ActionBar } from './ActionBar'
import { ActionContext, actionList } from './ActionContext.mjs'
import { EventPicker } from './EventPicker'
import { createSampleEvent, usePalette } from './mockCalendar.mjs'
import { ViewHeader } from './ViewHeader'
import { useNarrowCheck } from './LayoutContext.mjs'
import { useLogger } from './Logger'

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
  const logger = useLogger()

  const startOfDay = useMemo(() => day.startOf('day'), [day])
  const endOfDay = useMemo(() => day.endOf('day'), [day])

  const palette = usePalette()
  const defaultEventPicks = {
    type: 'Custom',
    colorId: palette[0],
    summary: 'New Event',
  }

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
        <ActionBar
          canUndo={canUndo}
          onBehavior={b => {
            setSelection(null)
            if (b === 'undo') return onUndo()
            setAction(b)
          }}
        />
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
              testCreationTap({ event: e, logger, day })
            }
            // if (action === 'create') {
            //   handleCreationTap({ event: e, day, setCreation, picks })
            // }
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
          header={<DayHeader onBack={onBack} day={day} />}
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
            className="test-box"
            style={{
              position: 'absolute',
              border: '1px solid #0af',
              zIndex: 999,
              backgroundColor: '#0af4',
              overflow: 'hidden',
              fontSize: '0.75rem',
            }}
          />
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
        <CreationDrawer action={action} picks={picks} onPick={setPicks} />
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

function testCreationTap({ event, day, logger }) {
  console.log('testCreationTap')
  const startOfDay = day.startOf('day')

  const ct = event.currentTarget
  const outputBounds = document
    .querySelector('.section-inner')
    .getBoundingClientRect()

  const testBox = document.querySelector('.test-box')

  console.log('output bounds: ', outputBounds)
  console.log('client x, y: ', event.clientX, event.clientY)

  // Scrolling element depends on layout:
  const initialScroll =
    document.querySelector('.section-scroll').scrollTop ||
    document.querySelector('.root-container').scrollTop
  console.log('initialScroll=', initialScroll)

  const initialX = event.clientX - outputBounds.left
  const initialY = event.clientY - outputBounds.top
  console.log('initial y: ', initialY)
  ct.setPointerCapture(event.pointerId)

  ct.onpointermove = handleMove
  ct.onpointerup = cleanup

  function cleanup() {
    console.log('pointer up')
    // ct.removeEventListener('pointermove', handleMove)
  }

  function handleMove(move) {
    move.preventDefault()
    move.stopPropagation()
    console.log('meep')

    const x2 = move.clientX - outputBounds.left
    const y2 = move.clientY - outputBounds.top

    setBoxNoReact(initialX, initialY, x2, y2)
  }

  function setBoxNoReact(x1, y1, x2, y2) {
    overwriteRAF(() => {
      const lowY = Math.min(y1, y2)
      const hiY = Math.max(y1, y2)

      setTimeout(() => logger('overwrite skip: ' + overwriteRAF.skipCount), 100)


      const initialMinute = Math.floor((24 * 60 * lowY / outputBounds.height) / 15) * 15
      const finalMinute = Math.ceil((24 * 60 * hiY / outputBounds.height) / 15) * 15

      testBox.textContent = startOfDay.add(initialMinute, 'minutes').format('h:mm')
      + ' – '
      + startOfDay.add(finalMinute, 'minutes').format('h:mm')

      const snappedStartY = initialMinute / (24 * 60) * outputBounds.height
      const snappedEndY = finalMinute / (24 * 60) * outputBounds.height

      testBox.style.left = Math.min(x1, x2) + 'px'
      testBox.style.top = snappedStartY + 'px'
      testBox.style.width = Math.abs(x1 - x2) + 'px'
      testBox.style.height = snappedEndY - snappedStartY + 'px'
    })
  }
}

function handleCreationTap({ event, picks, day, setCreation }) {
  const innerBounds = document.body
    .querySelector('.section-inner')
    .getBoundingClientRect()

  const minutes =
    (24 * 60 * (event.clientY - innerBounds.top)) / innerBounds.height

  const initialCreationTime = day.minute(minutes - (minutes % 15))

  setCreation(
    createSampleEvent({
      startTime: initialCreationTime,
      endTime: day.minute(minutes - (minutes % 15) + 15),
      summary: picks.summary,
      colorId: picks.colorId,
    })
  )

  console.log('ct=', event.currentTarget)
  event.currentTarget.setPointerCapture(event.pointerId)
  let lastDragDuration = 15

  const moveStart = event.clientY
  event.currentTarget.onpointermove = move => {
    const cursorMinutes =
      (24 * 60 * (move.clientY - moveStart)) / innerBounds.height
    const tick = cursorMinutes - (cursorMinutes % 15) + 15
    const term = initialCreationTime.add(tick, 'minutes')
    const updatedDragDuration = term.diff(initialCreationTime) / 1000 / 60

    if (updatedDragDuration !== lastDragDuration && tick !== 0) {
      lastDragDuration = updatedDragDuration

      const start = initialCreationTime.isBefore(term)
        ? initialCreationTime
        : term
      const end = term.isAfter(initialCreationTime)
        ? term
        : initialCreationTime.add(15, 'minutes')
      setCreation(
        createSampleEvent({
          startTime: start,
          endTime: end,
          summary: picks.summary,
          colorId: picks.colorId,
        })
      )
    }
  }
}

function DayHeader({ onBack, day }) {
  const isNarrow = useMediaQuery('(max-width: 350px)')
  const formatted = isNarrow
    ? day.format('ddd, MMM D')
    : day.format('dddd, MMMM D')

  return (
    <ViewHeader>
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
    </ViewHeader>
  )
}
