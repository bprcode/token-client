import { Box, useMediaQuery } from '@mui/material'
import { EventPane } from './EventPane'
import { isOverlap } from './calendarLogic'
import { memo, useMemo } from 'react'

export const DailyBreakdown = memo(Breakdown)

function Breakdown({
  date,
  events,
  style,
  selection,
  onSelect,
  onEdit,
  onUpdate,
  onDelete,
  labels = 'detailed',
}) {
  const startOfDay = date.startOf('day')
  const startOfNextDay = date.add(1, 'day').startOf('day')

  const { blocking, columns, relevantEvents } = useMemo(() => {
    const startOfDay = date.startOf('day')
    const endOfDay = date.endOf('day')
    const relevantEvents = events.filter(
      e =>
      isOverlap(startOfDay, endOfDay, e.startTime, e.endTime) && !e.isDeleting
    )

    const blocking = new WeakMap()
    for (const r of relevantEvents) blocking.set(r, 0)

    // Calculate indentation in case of overlapping events
    const columns = []
    // Place each event in a position which does not overlap any other event
    for (const e of relevantEvents) {
      // Find the first unoccupied column for this event
      let placed = false

      for (const column of columns) {
        let available = true

        // If any prior element of this column overlaps,
        // the column is unavailable.
        for (const entry of column) {
          if (
            isOverlap(entry.startTime, entry.endTime, e.startTime, e.endTime)
          ) {
            available = false
            break
          }
        }

        if (available) {
          column.push(e)
          placed = true
          break
        }
      }

      if (!placed) {
        columns.push([e])
      }
    }

    // Record the calculated indentation values
    for (const [indent, column] of columns.entries()) {
      for (const event of column) {
        blocking.set(event, indent)
        event.indent = indent
      }
    }

    return { blocking, columns, relevantEvents }
  }, [events, date])

  const isSparse = columns.length <= 2 && labels === 'detailed'
  const margin = isSparse ? '4.5rem' : undefined

  const minTouch = '48px'
  const isWide = useMediaQuery(`(min-width:1100px)`)
  const maxDetailedColumns = isWide ? 2 : 1

  // Render the event cards
  const rendered = (
    <Box
      sx={{
        height: '100%',
        ...style,
        position: 'relative',
        marginLeft: [margin, margin || '0.5rem'],
        marginRight: [
          labels === 'detailed' ? minTouch : margin,
          margin || '0.5rem',
        ],
        maxWidth: columns.length === 1 ? '60ch' : undefined,
      }}
    >
      {relevantEvents.map(r => (
        <EventPane
          key={r.stableKey ?? r.id}
          initial={startOfDay}
          final={startOfNextDay}
          event={r}
          columns={columns.length}
          indent={blocking.get(r)}
          label={
            labels === 'detailed'
              ? labels
              : columns.length <= maxDetailedColumns
              ? labels
              : 'none'
          }
          selected={selection === r.id}
          onSelect={onSelect}
          onEdit={onEdit}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      ))}
    </Box>
  )

  return rendered
}
