import {
  IconButton,
  Box,
  Paper,
  Stack,
  Typography,
  Collapse,
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

export function DayPage({
  onBack,
  onUpdate,
  onDelete,
  onUndo,
  day,
  unfilteredEvents,
}) {
  const [selection, setSelection] = useState(null)
  const [editing, setEditing] = useState(false)

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
        <DayHeader onBack={onBack} day={day} />

        <Box sx={{ height: '100%' }}>
          <SectionedInterval
            initial={day.startOf('day')}
            final={day.endOf('day')}
            step={[1, 'hour']}
            outsideHeight="100%"
            insideHeight="1800px"
            onClick={() => setSelection(null)}
          >
            <DailyBreakdown
              day={day}
              unfilteredEvents={unfilteredEvents}
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

        <div style={{ zIndex: 1, position: 'fixed', bottom: 0, width: '100%' }}>
          <Collapse in={action === 'create'}>
            <EventPicker />
          </Collapse>
        </div>

        <ActionBar
          onBehavior={b => {
            setSelection(null)
            if (b === 'undo') return onUndo()
            setAction(b)
          }}
        />
      </Paper>
    </ActionContext.Provider>
  )
}

function DayHeader({ onBack, day }) {
  return (
    <Stack direction="row" sx={{ borderBottom: '1px solid #0006' }}>
      <IconButton
        sx={{ mt: 0 }}
        aria-label="back to weekly view"
        onClick={onBack}
      >
        <ArrowBackIcon />
      </IconButton>
      <Typography variant="h5" component="div" mb={2} mt={2}>
        {day.format('dddd, MMMM D')}
      </Typography>
    </Stack>
  )
}
