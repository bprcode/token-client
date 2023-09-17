import { IconButton, Paper, Stack, Typography } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { SectionedInterval } from './SectionedInterval'
import { DailyBreakdown } from './DailyBreakdown'
import { useState } from 'react'
import { EventEditor } from './EventEditor'

export function DayPage({ onBack, onUpdate, onDelete, day, unfilteredEvents }) {
  const [selection, setSelection] = useState(null)
  const [editing, setEditing] = useState(false)

  return (
    <Paper elevation={1} sx={{ px: 2, py: 2 }}>
      <Stack direction="row">
        <IconButton
          sx={{ mt: 0 }}
          aria-label="back to weekly view"
          onClick={onBack}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" component="div" mb={2}>
          {day.format('dddd, MMMM D')}
        </Typography>
      </Stack>

      <SectionedInterval
        initial={day.startOf('day')}
        final={day.endOf('day')}
        step={[1, 'hour']}
        outsideHeight="500px"
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
    </Paper>
  )
}
