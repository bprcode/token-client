import { EventPane } from './EventPane'
import { isOverlap } from './dateLogic.mjs'

export function DailyBreakdown({
  day,
  unfilteredEvents,
  style,
  labels = 'detailed',
}) {
  console.time('DailyBreakdown rendering')

  const startOfDay = day.startOf('day')
  const endOfDay = day.endOf('day')

  const relevantEvents = unfilteredEvents.filter(e =>
    isOverlap(startOfDay, endOfDay, e.start.dateTime, e.end.dateTime)
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

      // If any prior element of this column overlaps, the column is unavailable
      for (const entry of column) {
        if (
          isOverlap(
            entry.start.dateTime,
            entry.end.dateTime,
            e.start.dateTime,
            e.end.dateTime
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

  // Render the event cards
  const rendered = (
    <div style={{ height: '100%', ...style, position: 'relative' }}>
      {relevantEvents.map((r, i) => (
        <EventPane
          key={i}
          initial={startOfDay}
          final={endOfDay}
          event={r}
          columns={columns.length}
          indent={blocking.get(r)}
          label={labels}
        />
      ))}
    </div>
  )

  console.timeEnd('DailyBreakdown rendering')

  return rendered
}
