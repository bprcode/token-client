import { createTheme } from '@mui/material'
import * as dayjs from 'dayjs'

function createSampleEvent({ startTime, endTime, summary }) {
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
    },
    // object
    end: {
      // RFC3339-compatible datetime
      dateTime: endTime || startTime.add(1, 'hour'),
    },
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
  palette: { tonalOffset: 0.25 },
})

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
      accentColor: '#6000ac',
      fontSize: '0.75em',
      augmentedColors: defaultTheme.palette.augmentColor({
        color: { main: '#6000ac' },
      }),
    },
  ],
])

export const sampleEvents = createSampleWeek(dayjs())
