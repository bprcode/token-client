import { createTheme } from '@mui/material'
import { useReducer } from 'react'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import relativeTime from 'dayjs/plugin/relativeTime'
import { reviveEvents } from './cacheTracker'
import log from '../log'

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
    id: String(Math.round(Math.random() * 89999999) + 10000000),
    // text
    etag: etag,
    // text
    summary: summary || 'I am a calendar',
    // text
    primaryAuthor: 'Author uid goes here',
  }
}

export const demoUser = {
  email: 'demo@abc.xyz',
  name: 'Demo Mode',
  uid: 'demo-uid',
  iat: Math.round(Date.now() / 1000),
  exp: Infinity,
}

export const demoCatalog = [
  {
    calendar_id: 'demo-calendar',
    etag: 'demo-etag',
    created: dayjs().utc().format(),
    summary: 'Sample Calendar',
    primary_author_id: 'demo-user',
    updated: dayjs().utc().format(),
  },
]

function mockDayEvents(day) {
  function p(probability) {
    return Math.random() < probability ? true : false
  }

  const events = []

  const isWeekday = day.day() !== 0 && day.day() !== 6
  const isWorkday = isWeekday ? p(0.95) : p(0.1)
  let workStart = p(0.9)
    ? day.add(8, 'hours')
    : p(0.5)
    ? day.add(7, 'hours')
    : day.add(9, 'hours')

  // Chance for empty day:
  if (isWeekday ? p(0.05) : day.day === 6 ? p(0.2) : p(0.4)) {
    return events
  }

  if (isWorkday) {
    const workEnd = workStart.add(pickRandom([7, 8, 9]), 'hours')

    // Work-interrupting appointment
    if (p(0.08)) {
      const appointmentStart = workStart.subtract(
        pickRandom([0, 1, 2]),
        'hours'
      )
      const appointmentEnd = appointmentStart.add(
        pickRandom([1, 2, 2, 3]),
        'hours'
      )
      workStart = appointmentEnd.add(pickRandom([0, 1]), 'hours')
      events.push(
        createEventObject({
          startTime: appointmentStart,
          endTime: appointmentEnd,
          summary: 'Appointment',
        })
      )
    } else if (p(0.3)) {
      // Before-work activity
      const beforeHours = pickRandom([1, 2, 3])
      const endGap = beforeHours - pickRandom([Math.min(0, beforeHours - 1), 0])
      events.push(
        createEventObject({
          startTime: workStart.subtract(beforeHours, 'hours'),
          endTime: workStart.subtract(beforeHours - endGap, 'hours'),
          summary: pickRandom(['Study', 'Exercise', 'Exercise']),
        })
      )
    }
    // Main work event
    events.push(
      createEventObject({
        startTime: workStart,
        endTime: workEnd,
        summary: 'Work',
      })
    )
    // Mid-work meeting
    if (p(0.3)) {
      const meetingStart = workStart.add(pickRandom([0, 1, 2, 3]), 'hours')
      events.push(
        createEventObject({
          startTime: meetingStart,
          endTime: meetingStart.add(pickRandom([1, 2]), 'hours'),
          summary: 'Meeting',
        })
      )
    }
    // After-work event
    if (p(0.7)) {
      events.push(
        createEventObject({
          startTime: workEnd.add(p(0.7) ? 1 : 0, 'hours'),
          endTime: workEnd.add(pickRandom([2, 3, 4]), 'hours'),
          summary: pickRandom(['Social', 'Study', 'Exercise']),
        })
      )
    }
  }
  if (!isWorkday) {
    let startTime = day.add(pickRandom([5, 6, 7, 8, 9]), 'hours')
    let last = startTime.add(pickRandom([1, 2, 3]), 'hours')
    let summary = pickRandom(['Exercise', 'Study'])

    events.push(createEventObject({ startTime, endTime: last, summary }))

    let pEvening = 0.8
    if (p(0.7)) {
      startTime = last.add(pickRandom([0, 1, 2, 3, 4]), 'hours')
      last = startTime.add(pickRandom([1, 2, 3]), 'hours')
      summary = pickRandom(['Social', 'Appointment'])

      events.push(createEventObject({ startTime, endTime: last, summary }))
      pEvening = 0.5
    }

    if (p(pEvening)) {
      const evening = day.add(17, 'hours')
      if (evening.isAfter(last)) {
        startTime = evening.add(pickRandom([0, 1, 2, 3]), 'hours')
      } else {
        startTime = last.add(1, 'hours')
      }
      last = startTime.add(pickRandom([2, 3, 4]), 'hours')
      summary = 'Social'
      events.push(createEventObject({ startTime, endTime: last, summary }))
    }
  }

  return events
}

export function mockEventFetch(resource) {
  mockEventFetch.days ??= reviveDemoSession()

  log('mocking fetch request for:', resource)

  const decoded = decodeURIComponent(resource)
  const searchParams = new URLSearchParams(decoded.split('?')[1])
  const intervalStart = dayjs(searchParams.get('from'))
  const intervalEnd = dayjs(searchParams.get('to'))

  const result = []
  let d = intervalStart

  while (d.isBefore(intervalEnd)) {
    const dayString = d.format('D-MM-YYYY')
    if (!mockEventFetch.days.has(dayString)) {
      const mocked = mockDayEvents(d)
      const json = mocked.map(e => ({
        event_id: e.id,
        etag: e.etag,
        summary: e.summary,
        created: e.created.utc().format(),
        description: e.description,
        start_time: e.startTime.utc().format(),
        end_time: e.endTime.utc().format(),
        color_id: e.colorId,
        calendar_id: demoCatalog[0].calendar_id,
      }))
      mockEventFetch.days.set(dayString, json)
    }

    result.push(...mockEventFetch.days.get(dayString))
    d = d.add(1, 'day')
  }

  // Persist the mocked data:
  sessionStorage['mock demo map'] = JSON.stringify([...mockEventFetch.days])
  return result
}

function reviveDemoSession() {
  try {
    const stored = sessionStorage['mock demo map']
    const parsed = JSON.parse(stored)

    const revived = parsed.map(([key, list]) => [key, reviveEvents(list)])
    return new Map(revived)
  } catch (e) {
    return new Map()
  }
}

function pickRandom(arr) {
  return arr[Math.floor(arr.length * Math.random())]
}

function mockDescription(summary) {
  const exerciseDescriptions = [
    'Lift weights',
    'Go for a jog',
    'Play tennis',
    'Swim laps',
  ]

  const workDescriptions = [
    'In-office',
    'WFH',
    'Post results for client',
    'Consult with team',
  ]

  const studyDescriptions = [
    'Compute dynamical integration',
    'Compile lab data',
    'Review journal publications',
    'Revise thesis materials',
  ]

  const appointmentDescriptions = [
    'Check-up with Dr. Alice',
    'Visit Dr. Nguyen',
    'Attend open house',
    'Online conference',
  ]

  const meetingDescriptions = [
    'Meeting with corporate',
    'Progress update',
    'Stakeholder check-in',
    'Discuss renovations',
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
    case 'Appointment':
      return pickRandom(appointmentDescriptions)
    case 'Meeting':
      return pickRandom(meetingDescriptions)
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
    id: id ?? String(Math.round(Math.random() * 89999999) + 10000000),
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
  if (baseStyles.has(colorId)) return baseStyles.get(colorId).accentColor

  if (recognizedColors.has(colorId)) return recognizedColors.get(colorId)

  return baseStyles.get('Default').accentColor
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

export const customPalette = [
  '#93032E',
  '#CDB4D2',
  '#E2A035',
  '#b5dead',
  '#546D64',
  '#0E5092',
]

const recognizedColors = new Map(customPalette.map(c => [c, c]))

export const baseStyles = new Map([
  ['Work', '#5283a8'],
  ['Appointment', '#188C6C'],
  ['Study', '#F9B273'],
  ['Meeting', '#d46239'],
  ['Exercise', '#d0518e'],
  ['Social', '#635ac9'],
  ['Default', '#aac'],
])

for (const [key, value] of baseStyles) {
  baseStyles.set(key, {
    accentColor: value,
    augmentedColors: defaultTheme.palette.augmentColor({
      color: { main: value },
    }),
  })
}

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

export function reduceConcurrentEvents(eventList, action) {
  switch (action.type) {
    case 'create': {
      const tags = {
        etag: 'creating',
        stableKey: action.addition.id,
      }
      return mergeKeepDeletions({ ...action.addition, ...tags }, eventList)
    }

    case 'update': {
      const prior = eventList.find(
        e => action.id === e.id || action.id === e.stableKey
      )

      const updated = {
        ...prior,
        ...action.updates,
        unsaved: Date.now(),
      }

      const omitted = eventList.filter(
        e => action.id !== e.id && action.id !== e.stableKey
      )

      return mergeKeepDeletions(updated, omitted)
    }

    case 'delete':
      return eventList.map(e =>
        action.id === e.id || action.id === e.stableKey
          ? { ...e, isDeleting: true, unsaved: Date.now() }
          : e
      )

    default:
      throw Error('Unhandled dispatch: ' + action.type)
  }
}

export function useEventStyles() {
  return baseStyles
}

export function usePalette() {
  return customPalette
}
