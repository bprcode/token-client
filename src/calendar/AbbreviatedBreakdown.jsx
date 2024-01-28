import { isOverlap, getAugmentedColor } from './calendarLogic.mjs'

export function AbbreviatedBreakdown({ day, unfilteredEvents }) {
  const startOfDay = day.startOf('day')
  const endOfDay = day.endOf('day')

  const relevantEvents = unfilteredEvents.filter(e =>
    !e.isDeleting && isOverlap(e.startTime, e.endTime, startOfDay, endOfDay)
  )

  if (relevantEvents.length === 0) return

  const lastMatch = relevantEvents[relevantEvents.length - 1]
  const list = []

  for (const r of relevantEvents) {
    if (list.length === 3) {
      list.push(
        <div
          key={list.length}
          style={{
            backgroundColor: '#8884',
            fontSize: '0.75em',
            paddingLeft: '0.25rem',
            paddingRight: '0.25rem',
            borderBottomLeftRadius: 4,
            borderBottomRightRadius: 4,
          }}
        >
          +{relevantEvents.length - 3}
        </div>
      )
      break
    }

    const augmentedColor = getAugmentedColor(r.colorId)

    list.push(
      <div
        key={list.length}
        style={{
          backgroundColor: augmentedColor.main,
          color: augmentedColor.contrastText,
          fontSize: '0.75em',
          paddingLeft: '0.25rem',
          paddingRight: '0.25rem',
          borderTopLeftRadius: list.length === 0 && 4,
          borderTopRightRadius: list.length === 0 && 4,
          borderBottomLeftRadius: r === lastMatch && 4,
          borderBottomRightRadius: r === lastMatch && 4,
          overflow: 'hidden',
          whiteSpace: 'nowrap',
        }}
      >
        {r.summary}
      </div>
    )
  }

  return <div style={{ boxShadow: '0rem 0.25rem 0.25rem #0006' }}>{list}</div>
}
