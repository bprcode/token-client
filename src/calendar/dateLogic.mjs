/**
 * Determine if two time intervals overlap.
 * Edge-only intersections are not counted as overlapping.
 */

export function isOverlap(firstStart, firstEnd, secondStart, secondEnd) {
  if (!firstStart.isBefore(secondEnd)) return false
  if (!firstEnd.isAfter(secondStart)) return false
  return true
}

export const weekdayAbbreviations = [
  'Sun',
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat',
]

export function shorthandInterval(start, end) {
  const crossesMeridian =
    start.format('A') !== end.format('A')
  const startShorthand = start.minute() === 0 ? 'h' : 'h:mm'
  const endShorthand = end.minute() === 0 ? 'h' : 'h:mm'
  const startAP = crossesMeridian ? start.format('a')[0] : ''
  const endAP = crossesMeridian ? end.format('a')[0] : ''
  const shorthandInterval =
    start.format(startShorthand) +
    startAP +
    '–' +
    end.format(endShorthand) +
    endAP

  return shorthandInterval
}
