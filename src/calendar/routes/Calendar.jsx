import { Paper, Slide } from '@mui/material'
import { useContext, useMemo, useState } from 'react'
import { useLoaderData, useParams, useSearchParams } from 'react-router-dom'
import { PreferencesContext } from '../PreferencesContext.mjs'
import { createSampleWeek, useEventListHistory } from '../calendarLogic.mjs'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { MonthlyCalendar } from '../MonthlyCalendar'
import { WeeklyCalendar } from '../WeeklyCalendar'
import { DailyCalendar } from '../DailyCalendar'
import { isOverlap } from '../dateLogic.mjs'

dayjs.extend(utc)

export function loader({ request, params }) {
  const data = createSampleWeek(dayjs())

  return new Promise(k => {
    setTimeout(() => k(data), Math.random() * 1500 + 1000)
  })
}

export function Calendar() {
  const [searchParams, setSearchParams] = useSearchParams()
  const params = useParams()
  const loaded = useLoaderData()
  const view = searchParams.get('v') || 'month'

  const preferences = useContext(PreferencesContext)
  const [eventListHistory, dispatchEventListHistory] =
    useEventListHistory(loaded)
  const eventList = eventListHistory[eventListHistory.length - 1]
  const dispatchAction = dispatchEventListHistory
  const canUndo = eventListHistory.length > 1

  const activeDate = searchParams.has('d')
    ? dayjs(searchParams.get('d').replaceAll('.', ':'))
    : dayjs()

  if (searchParams.has('d')) {
    console.log('d specified:', searchParams.get('d'))
  }

  const dayEvents = useMemo(() => {
    console.log('memoizing day events')
    if (view !== 'day') {
      return null
    }

    const startOfDay = activeDate.startOf('day')
    const endOfDay = activeDate.endOf('day')
    return eventList.filter(e =>
      isOverlap(startOfDay, endOfDay, e.start.dateTime, e.end.dateTime)
    )
  }, [view, eventList, activeDate])

  return (
    <Paper
      elevation={1}
      sx={{
        height: '100%',
        width: '100%',
        position: 'relative',
      }}
    >
      <Slide
        key={params.id}
        timeout={350}
        in={true}
        direction="left"
        mountOnEnter
        unmountOnExit
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            width: '100%',
            height: '100%',
          }}
        >
          {view === 'month' && (
            <MonthlyCalendar
              activeDate={activeDate}
              unfilteredEvents={eventList}
              onExpand={date => updateParams({ view: 'week', date })}
              onChange={date => updateParams({ date })}
            />
          )}
          {view === 'week' && (
            <WeeklyCalendar
              onBack={() => {
                updateParams({ view: 'month' })
              }}
              activeDate={activeDate}
              eventList={eventList}
              onExpand={date => updateParams({ view: 'day', date })}
              onChange={date => updateParams({ date })}
            />
          )}
          {view === 'day' && (
            <DailyCalendar
              onBack={() => {
                updateParams({ view: 'week' })
              }}
              activeDate={activeDate}
              unfilteredEvents={eventList}
              filteredEvents={dayEvents}
              onCreate={addition =>
                dispatchAction({
                  type: 'create',
                  merge: preferences.merge,
                  addition,
                })
              }
              onUpdate={updates =>
                dispatchAction({
                  type: 'update',
                  id: updates.id,
                  merge: preferences.merge,
                  updates,
                })
              }
              onDelete={id =>
                dispatchAction({
                  type: 'delete',
                  id: id,
                })
              }
              onUndo={() => dispatchAction({ type: 'undo' })}
              canUndo={canUndo}
            />
          )}
        </div>
      </Slide>
    </Paper>
  )

  function updateParams({ view, date }) {
    const newParams = new URLSearchParams(searchParams)
    if (view) {
      newParams.set('v', view)
    }
    if (date) {
      newParams.set('d', date.utc().format().replaceAll(':', '.'))
    }
    setSearchParams(newParams)
  }
}
