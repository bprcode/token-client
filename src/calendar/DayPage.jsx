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
  const [debugBox, setDebugBox] = useState([50,50,200,300])

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
            testCreationTap({ event: e, setBox: setDebugBox, logger })
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
          <div style={{
            position: 'absolute',
            border: '1px solid #0af',
            top: `${debugBox[1]}px`,
            left: `${debugBox[0]}px`,
            width: `${debugBox[2] - debugBox[0]}px`,
            height: `${debugBox[3] - debugBox[1]}px`,
            zIndex: 999,
            backgroundColor: '#0af4',
          }}/>
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
  if (!overwriteRAF.callback) {
    requestAnimationFrame(() => {
      overwriteRAF.callback()
      overwriteRAF.callback = null
    })
  }
  overwriteRAF.callack = callback
}

function testCreationTap({ event, setBox, logger }) {
  const innerBounds = document.querySelector('.section-inner')
    .getBoundingClientRect()

  const top = innerBounds.top
  const initialScroll = document.querySelector('.section-scroll').scrollTop
  const initialX = event.clientX
  const initialY = event.clientY + initialScroll
  console.log('initial y: ', initialY)
  let lastPoll = performance.now()
  event.currentTarget.setPointerCapture(event.pointerId)
  event.currentTarget.onpointermove = move => {
    const prevPoll = lastPoll
    const latestPoll = performance.now()
    setTimeout(() => logger('Poll delta: ' + (latestPoll - prevPoll) + ' ms'), 1000)
    lastPoll = latestPoll
    console.log('delta y: ', move.clientY - initialY)
    const x1 = initialX
    const x2 = move.clientX
    const y1 = initialY + initialScroll - top
    const y2 = move.clientY + initialScroll - top
    setBox([Math.min(x1, x2), Math.min(y1, y2), Math.max(x1, x2), Math.max(y1, y2)])
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
