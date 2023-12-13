import { createTheme } from '@mui/material'
import { useReducer } from 'react'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)
dayjs.extend(utc)

/**
 * Determine if two time intervals overlap.
 * Edge-only intersections are not counted as overlapping.
 */
export function isOverlap(firstStart, firstEnd, secondStart, secondEnd) {
  if (!firstStart.isBefore(secondEnd)) return false
  if (!firstEnd.isAfter(secondStart)) return false
  return true
}

/**
 * Determine if two time intervals overlap.
 * Count edge-only intersections as overlapping.
 */
export function isInclusiveOverlap(
  firstStart,
  firstEnd,
  secondStart,
  secondEnd
) {
  if (firstStart.isAfter(secondEnd)) return false
  if (firstEnd.isBefore(secondStart)) return false
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
  const crossesMeridian = start.format('A') !== end.format('A')
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

export function createSampleCalendar({ summary }) {
  const etag = Array(32)
    .fill(0)
    .map(() => Math.floor(Math.random() * 16).toString(16))
    .join('')
  return {
    // text
    id: String(btoa((Math.random() * 1e6).toFixed())),
    // text
    etag: etag,
    // text
    summary: summary || 'I am a calendar',
    // text
    primaryAuthor: 'Author uid goes here',
  }
}

function mockDescription(summary) {
  function pickRandom(arr) {
    return arr[Math.floor(arr.length * Math.random())]
  }

  const exerciseDescriptions = [
    'Lift weights',
    'Go for a jog',
    'Play tennis',
    'Swim laps',
  ]

  const workDescriptions = [
    'In-office',
    'WFH',
    'Meeting with corporate',
    'Consult with team',
  ]

  const studyDescriptions = [
    'Compute dynamical integration',
    'Compile lab data',
    'Review journal publications',
    'Revise thesis materials',
  ]

  const otherDescriptions = [
    'Meet for coffee',
    'Try out board game',
    'Hiking trail time',
    'Catch a movie',
  ]

  switch (summary) {
    case 'Exercise':
      return pickRandom(exerciseDescriptions)
    case 'Work':
      return pickRandom(workDescriptions)
    case 'Study':
      return pickRandom(studyDescriptions)
    default:
      return pickRandom(otherDescriptions)
  }
}

export function createEventObject({
  startTime,
  endTime,
  summary,
  description,
  colorId,
  id,
}) {
  const etag = Array(32)
    .fill(0)
    .map(() => Math.floor(Math.random() * 16).toString(16))
    .join('')
  return {
    // text
    id: id ?? String(btoa((Math.random() * 1e6).toFixed())),
    // text
    etag: etag,
    // RFC3339-compatible datetime
    created: dayjs(),
    // text
    summary: summary || 'Default Title',
    // text
    description: description || mockDescription(summary),
    // RFC3339-compatible datetime
    startTime,
    // RFC3339-compatible datetime
    endTime: endTime || startTime.add(1, 'hour'),
    // string
    colorId: colorId || summary,
  }
}

export function createSampleWeek(aroundDate, quantity = 180) {
  const labels = ['Work', 'Study', 'Exercise', 'Social']
  const startOfPriorWeek = aroundDate.subtract(1, 'week').startOf('week')
  const sampleEvents = []

  for (let i = 0; i < quantity; i++) {
    // Split a three-week interval into random 15-minute chunks:
    const offsetMinutes = Math.trunc(Math.random() * 2016) * 15
    const startTime = startOfPriorWeek.add(offsetMinutes, 'minutes')
    const eventDuration = Math.trunc(Math.random() * 16 + 1) * 15
    const endTime = startTime.add(eventDuration, 'minutes')
    const summary = labels[Math.trunc(Math.random() * labels.length)]

    sampleEvents.push(createEventObject({ startTime, endTime, summary }))
  }

  return sampleEvents
}

// Using MUI utility method augmentColor to generate palette entries
const defaultTheme = createTheme({
  palette: { tonalOffset: 0.3 },
})

/**
 * Check whether the requested colorId is defined in:
 * 1. custom colors,
 * 2. default event styles, or
 * 3. the default color palette,
 * otherwise return a default color.
 */
export function resolveColor(colorId) {
  if (mockStyles.has(colorId)) return mockStyles.get(colorId).accentColor

  if (recognizedColors.has(colorId)) return recognizedColors.get(colorId)

  return mockStyles.get('Default').accentColor
}

/**
 * Returns a MUI augmented color object based on the colorId,
 * memoizing the result.
 */
export function getAugmentedColor(colorId) {
  if (!getAugmentedColor.memo) {
    getAugmentedColor.memo = new Map()
  }
  if (getAugmentedColor.memo.has(colorId)) {
    return getAugmentedColor.memo.get(colorId)
  }

  getAugmentedColor.memo.set(
    colorId,
    defaultTheme.palette.augmentColor({
      color: { main: resolveColor(colorId) },
    })
  )
  return getAugmentedColor.memo.get(colorId)
}

export function isDefaultStyle(event, styleList) {
  if (
    styleList.has(event.summary) &&
    styleList.get(event.summary).accentColor === resolveColor(event.colorId)
  ) {
    return true
  }
  return false
}

export const mockPalette = [
  '#942911',
  '#d46239',
  '#d99830',
  '#228223',
  '#b5dead',
  '#45aeb0',
  '#518ed0',
  '#5351d0',
]

const recognizedColors = new Map(mockPalette.map(c => [c, c]))

export const mockStyles = new Map([
  [
    'Work',
    {
      accentColor: '#5283a8',
      fontSize: '0.75em',
      augmentedColors: defaultTheme.palette.augmentColor({
        color: { main: '#5283a8' },
      }),
    },
  ],
  [
    'Study',
    {
      accentColor: '#e9a47d',
      fontSize: '0.75em',
      augmentedColors: defaultTheme.palette.augmentColor({
        color: { main: '#e9a47d' },
      }),
    },
  ],
  [
    'Exercise',
    {
      accentColor: '#d0518e',
      fontSize: '0.75em',
      augmentedColors: defaultTheme.palette.augmentColor({
        color: { main: '#d0518e' },
      }),
    },
  ],
  [
    'Social',
    {
      accentColor: '#635ac9',
      fontSize: '0.75em',
      augmentedColors: defaultTheme.palette.augmentColor({
        color: { main: '#d0518e' },
      }),
    },
  ],
  [
    'Default',
    {
      accentColor: '#aac',
      fontSize: '0.75em',
      augmentedColors: defaultTheme.palette.augmentColor({
        color: { main: '#aac' },
      }),
    },
  ],
])

function isSimilarEvent(a, b) {
  return (
    isInclusiveOverlap(a.startTime, a.endTime, b.startTime, b.endTime) &&
    a.colorId === b.colorId &&
    a.summary === b.summary &&
    a.description === b.description
  )
}

/**
 * Add an event to an event list, merging it with similar events,
 * and marking previous overlaps for deletion.
 */
function mergeKeepDeletions(event, list) {
  const disjoint = list.filter(e => !isSimilarEvent(e, event) || e.isDeleting)
  const overlaps = list.filter(e => isSimilarEvent(e, event) && !e.isDeleting)

  if (overlaps.length === 0) {
    disjoint.push(event)
    return disjoint
  }

  // Record which events should be deleted:
  const now = Date.now()
  const deletions = overlaps.map(e => ({
    ...e,
    isDeleting: true,
    unsaved: now,
  }))

  // Find the range spanned by the overlapping events:
  overlaps.push(event)

  const earliest = overlaps.reduce((previous, current) =>
    previous.startTime.isBefore(current.startTime) ? previous : current
  )
  const latest = overlaps.reduce((previous, current) =>
    previous.endTime.isAfter(current.endTime) ? previous : current
  )
  const merged = {
    ...event,
    startTime: earliest.startTime,
    endTime: latest.endTime,
    unsaved: now,
  }

  // Recursively check for further overlaps, persisting deletions:
  return mergeKeepDeletions(merged, [...disjoint, ...deletions])
}

function mergeEventIntoList(event, list) {
  const disjoint = list.filter(e => !isSimilarEvent(e, event))
  const overlaps = list.filter(e => isSimilarEvent(e, event))

  if (overlaps.length === 0) {
    disjoint.push(event)
    return disjoint
  }

  // Merge overlaps into one event:
  overlaps.push(event)

  const earliest = overlaps.reduce((previous, current) =>
    previous.startTime.isBefore(current.startTime) ? previous : current
  )
  const latest = overlaps.reduce((previous, current) =>
    previous.endTime.isAfter(current.endTime) ? previous : current
  )
  const merged = {
    ...event,
    startTime: earliest.startTime,
    endTime: latest.endTime,
  }
  // Recursively check for further overlaps:
  return mergeEventIntoList(merged, disjoint)
}

function reduceEventList(eventList, action) {
  switch (action.type) {
    case 'create':
      if (action.merge) {
        return mergeEventIntoList(action.addition, eventList)
      }
      return [...eventList, action.addition]

    case 'update': {
      const prior = eventList.find(e => e.id === action.id)

      const updated = {
        ...prior,
        ...action.updates,
        etag: 'modified-' + prior.etag,
      }

      const omitted = eventList.filter(e => e.id !== action.id)
      if (action.merge) {
        return mergeEventIntoList(updated, omitted)
      }
      return omitted.concat(updated)
    }

    case 'delete':
      return eventList.filter(e => e.id !== action.id)

    default:
      throw Error('Unhandled dispatch: ' + action.type)
  }
}

function reduceEventListHistory(history, action) {
  const maxHistory = 20

  let present

  switch (action.type) {
    case 'undo':
      if (history.length === 1) {
        return history
      }
      return history.slice(0, -1)

    default:
      present = history.concat([
        reduceEventList(history[history.length - 1], action),
      ])
      if (present.length > maxHistory) {
        return present.slice(1)
      }
      return present
  }
}

export function useEventListHistory(initialList) {
  return useReducer(reduceEventListHistory, [
    initialList || createSampleWeek(dayjs()),
  ])
}

export function reduceCurrentEvents(eventList, action) {
  switch (action.type) {
    case 'create': {
      const tags = {
        etag: 'creating',
        stableKey: action.addition.id,
      }
      return mergeKeepDeletions({ ...action.addition, ...tags }, eventList)
    }

    case 'update': {
      const prior = eventList.find(e => e.id === action.id)

      const updated = {
        ...prior,
        ...action.updates,
        unsaved: Date.now(),
      }

      const omitted = eventList.filter(e => e.id !== action.id)
      return mergeKeepDeletions(updated, omitted)
    }

    case 'delete':
      return eventList.map(e =>
        e.id === action.id ? { ...e, isDeleting: true, unsaved: Date.now() } : e
      )

    default:
      throw Error('Unhandled dispatch: ' + action.type)
  }
}

export function useEventStyles() {
  return mockStyles
}

export function usePalette() {
  return mockPalette
}
