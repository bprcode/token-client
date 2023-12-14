import { Box } from '@mui/material'
import { EventPane } from './EventPane'
import { isOverlap } from './calendarLogic.mjs'
import { memo, useMemo } from 'react'
import { useLogger } from './Logger'

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
  const logger = useLogger()
  const benchStart = performance.now()

  const startOfDay = date.startOf('day')
  const startOfNextDay = date.add(1, 'day').startOf('day')

  const { blocking, columns, relevantEvents } = useMemo(() => {
    console.log(
      `📦 memoizing blocking, columns, relevantEvents (${
        events.length
      })`
    )
    setTimeout(() => logger('📦 memoizing blocking'), 1000)

    const startOfDay = date.startOf('day')
    const endOfDay = date.endOf('day')
    const relevantEvents =
      events.filter(e =>
        isOverlap(startOfDay, endOfDay, e.startTime, e.endTime)
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
            isOverlap(
              entry.startTime,
              entry.endTime,
              e.startTime,
              e.endTime
            )
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
  }, [events, date, logger])

  const margin =
    columns.length <= 2 && labels === 'detailed' ? '4.5rem' : undefined

  // Render the event cards
  const rendered = (
    <Box
      sx={{
        height: '100%',
        ...style,
        position: 'relative',
        marginLeft: [margin, margin || '0.5rem'],
        marginRight: [0, margin || '0.5rem'],
      }}
    >
      {relevantEvents.map(r => (
        <EventPane
          key={r.id}
          initial={startOfDay}
          final={startOfNextDay}
          event={r}
          columns={columns.length}
          indent={blocking.get(r)}
          label={labels}
          selected={selection === r.id}
          onSelect={onSelect}
          onEdit={onEdit}
          onUpdate={onUpdate}
          onDelete={onDelete}
          transitions={true}
        />
      ))}
    </Box>
  )

  const benchEnd = performance.now()
  setTimeout(
    () =>
      logger('DailyBreakdown rendered in ' + (benchEnd - benchStart) + ' ms'),
    1000
  )

  return rendered
}
