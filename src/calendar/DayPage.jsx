import {
  IconButton,
  Box,
  Paper,
  Stack,
  Typography,
  Collapse,
  useMediaQuery,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { SectionedInterval } from './SectionedInterval'
import { DailyBreakdown } from './DailyBreakdown'
import { useContext, useState } from 'react'
import { EventEditor } from './EventEditor'
import { ActionBar } from './ActionBar'
import { ActionContext, actionList } from './ActionContext.mjs'
import { LayoutContext } from './LayoutContext.mjs'
import { EventPicker } from './EventPicker'
import { createSampleEvent } from './mockCalendar.mjs'

export function DayPage({
  onBack,
  onCreate,
  onUpdate,
  onDelete,
  onUndo,
  canUndo,
  day,
  unfilteredEvents,
}) {
  const [selection, setSelection] = useState(null)
  const [editing, setEditing] = useState(false)
  const [creation, setCreation] = useState(null)

  const [action, setAction] = useState(actionList[0])
  const layout = useContext(LayoutContext)
  const padding = layout === 'mobile' ? 0 : 0

  return (
    <ActionContext.Provider value={action}>
      <Paper
        elevation={1}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          overflow: 'hidden',
          px: padding,
          py: padding,
          position: 'relative',
        }}
      >
        <Box
          sx={{
            height: '100%',
            width: '100%',
            maxWidth: '840px',
            mx: 'auto',
            position: 'relative',
          }}
        >
          <DayHeader onBack={onBack} day={day} />
          <ActionBar
            onBehavior={b => {
              setSelection(null)
              if (b === 'undo') return onUndo()
              setAction(b)
            }}
            canUndo={canUndo}
          />
          <SectionedInterval
            initial={day.startOf('day')}
            final={day.endOf('day')}
            step={[1, 'hour']}
            outsideHeight="100%"
            insideHeight="1800px"
            onPointerDown={e => {
              if (action !== 'create') {
                return
              }
              const innerBounds =
                e.currentTarget.childNodes[0].getBoundingClientRect()
              const minutes =
                (24 * 60 * (e.clientY - innerBounds.top)) / innerBounds.height

              const initialCreationTime = day.minute(minutes - (minutes % 15))
              setCreation(
                createSampleEvent({
                  startTime: initialCreationTime,
                  endTime: day.minute(minutes - (minutes % 15) + 15),
                  summary: 'Work',
                })
              )

              e.currentTarget.setPointerCapture(e.pointerId)
              let lastDragDuration = 15

              const moveStart = e.clientY
              e.currentTarget.onpointermove = move => {
                const cursorMinutes =
                  (24 * 60 * (move.clientY - moveStart)) / innerBounds.height
                const tick = cursorMinutes - (cursorMinutes % 15) + 15
                const term = initialCreationTime.add(tick, 'minutes')
                const updatedDragDuration =
                  term.diff(initialCreationTime) / 1000 / 60

                if (updatedDragDuration !== lastDragDuration && tick !== 0) {
                  lastDragDuration = updatedDragDuration

                  const start = initialCreationTime.isBefore(term)
                    ? initialCreationTime
                    : term
                  const end = term.isAfter(initialCreationTime)
                    ? term
                    : initialCreationTime
                  setCreation(
                    createSampleEvent({
                      startTime: start,
                      endTime: end,
                      summary: 'Work',
                    })
                  )
                }
              }
            }}
            onPointerUp={e => {
              e.currentTarget.onpointermove = null
              if (action !== 'create') {
                return
              }
              onCreate(creation)
              setCreation(null)
            }}
            // keep this:
            onClick={() => setSelection(null)}
          >
            <DailyBreakdown
              day={day}
              unfilteredEvents={
                creation ? [...unfilteredEvents, creation] : unfilteredEvents
              }
              selection={selection}
              onSelect={s => setSelection(s)}
              onEdit={() => setEditing(true)}
              onUpdate={updates => {
                onUpdate(updates)
                setSelection(null)
              }}
              onDelete={onDelete}
            />
          </SectionedInterval>
        </Box>

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

        <div style={{ zIndex: 2, position: 'fixed', bottom: 0, width: '100%' }}>
          <Collapse in={action === 'create'}>
            <EventPicker />
          </Collapse>
        </div>
      </Paper>
    </ActionContext.Provider>
  )
}

function DayHeader({ onBack, day }) {
  const typeVariant = useMediaQuery('(max-width: 380px)') ? 'subtitle1' : 'h5'

  return (
    <Stack direction="row" sx={{ borderBottom: '1px solid #000a' }}>
      <IconButton
        sx={{ mt: 0 }}
        aria-label="back to weekly view"
        onClick={onBack}
      >
        <ArrowBackIcon />
      </IconButton>
      <Typography variant={typeVariant} component="div" mb={2} mt={2}>
        {day.format('dddd, MMMM D')}
      </Typography>
    </Stack>
  )
}
