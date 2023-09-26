import { createTheme } from '@mui/material'
import * as dayjs from 'dayjs'
import { useReducer } from 'react'

export function createSampleEvent({ startTime, endTime, summary, colorId }) {
  return {
    // text
    id: String(btoa((Math.random() * 1e6).toFixed())),
    // RFC3339-compatible datetime
    created: dayjs(),
    // RFC3339-compatible datetime
    updated: dayjs(),
    // text
    summary: summary || 'Default Title',
    // text
    description: summary !== 'Exercise' && 'Detailed description',
    // object: creator: id <string> -- not yet exposed
    // object
    start: {
      // RFC3339-compatible datetime
      dateTime: startTime,
      mock: 'start test data',
    },
    // object
    end: {
      // RFC3339-compatible datetime
      dateTime: endTime || startTime.add(1, 'hour'),
      mock: 'end test data',
    },
    // string
    colorId: colorId || summary,
    // array
    //recurrence: ['string'], c.f. RFC 5545 -- not yet implemented
  }
}

export function createSampleWeek(aroundDate) {
  const labels = ['Work', 'Study', 'Exercise']
  const startOfPriorWeek = aroundDate.subtract(1, 'week').startOf('week')
  const sampleEvents = []

  for (let i = 0; i < 180; i++) {
    // Split a three-week interval into random 15-minute chunks:
    const offsetMinutes = Math.trunc(Math.random() * 2016) * 15
    const startTime = startOfPriorWeek.add(offsetMinutes, 'minutes')
    const eventDuration = Math.trunc(Math.random() * 16 + 1) * 15
    const endTime = startTime.add(eventDuration, 'minutes')
    const summary = labels[Math.trunc(Math.random() * labels.length)]

    sampleEvents.push(createSampleEvent({ startTime, endTime, summary }))
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

function reduceEventList(eventList, action) {
  switch (action.type) {
    case 'create':
      return [...eventList, action.addition]

    case 'update':
      return eventList.map(e => {
        if (e.id !== action.id) return e

        const startTime = (
          (action.updates.start && action.updates.start.dateTime) ||
          e.start.dateTime
        ).clone()
        const endTime = (
          (action.updates.end && action.updates.end.dateTime) ||
          e.end.dateTime
        ).clone()

        return {
          ...e,
          ...action.updates,
          start: { ...e.start, ...action.updates.start, dateTime: startTime },
          end: { ...e.end, ...action.updates.end, dateTime: endTime },
        }
      })

    case 'delete':
      return eventList.filter(e => e.id !== action.id)

    default:
      throw Error('Unhandled dispatch: ' + action.type)
  }
}

/**
 * Wraps the Event List to provide history/undo functionality
 */
function reduceEventListHistory(history, action) {
  const maxHistory = 20

  function copySnapshot(original) {
    return original.map(event => ({
      ...event,
      start: { ...event.start, dateTime: event.start.dateTime.clone() },
      end: { ...event.end, dateTime: event.end.dateTime.clone() },
    }))
  }

  const clone = history.map(snap => copySnapshot(snap))

  switch (action.type) {
    case 'undo':
      if (clone.length === 1) {
        return clone
      }

      return clone.slice(0, -1)
    default:
      if (history.length > maxHistory) {
        clone.shift()
      }

      return [...clone, reduceEventList(history[history.length - 1], action)]
  }
}

export function useEventListHistory() {
  return useReducer(reduceEventListHistory, [createSampleWeek(dayjs())])
}

export function useEventStyles() {
  return mockStyles
}

export function usePalette() {
  return mockPalette
}
