import { IconButton, Paper, Stack, Typography } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { SectionedInterval } from './SectionedInterval'
import { DailyBreakdown } from './DailyBreakdown'
import { useContext, useState } from 'react'
import { EventEditor } from './EventEditor'
import { ActionBar } from './ActionBar'
import { ActionContext, actionList } from './ActionContext.mjs'
import { LayoutContext } from './LayoutContext.mjs'

export function DayPage({ onBack, onUpdate, onDelete, day, unfilteredEvents }) {
  const [selection, setSelection] = useState(null)
  const [editing, setEditing] = useState(false)

  const [action, setAction] = useState(actionList[0])
  const layout = useContext(LayoutContext)
  const padding = layout === 'mobile' ? 0 : 0

  return (
    <ActionContext.Provider value={action}>
      <Paper
        elevation={1}
        sx={{ px: padding, py: padding, position: 'relative' }}
      >
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
            onDelete={onDelete}
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

        <ActionBar
          onBehavior={b => {
            setSelection(null)
            setAction(b)
          }}
        />
      </Paper>
    </ActionContext.Provider>
  )
}
