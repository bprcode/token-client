import { Paper, Slide } from '@mui/material'
import { useContext, useMemo, useState } from 'react'
import { useLoaderData, useParams, useSearchParams } from 'react-router-dom'
import { PreferencesContext } from '../PreferencesContext.mjs'
import { createSampleWeek, useEventListHistory } from '../calendarLogic.mjs'
import dayjs from 'dayjs'
import { MonthlyCalendar } from '../MonthlyCalendar'
import { WeeklyCalendar } from '../WeeklyCalendar'
import { DayPage } from '../DayPage'
import { isOverlap } from '../dateLogic.mjs'

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

  console.log('calendar using search params=', searchParams)
  console.log('search param v=', searchParams.get('v'))

  const preferences = useContext(PreferencesContext)
  const [eventListHistory, dispatchEventListHistory] =
    useEventListHistory(loaded)
  const eventList = eventListHistory[eventListHistory.length - 1]
  const dispatchAction = dispatchEventListHistory
  const canUndo = eventListHistory.length > 1

  const currentDate = dayjs()
  const [expandedDate, setExpandedDate] = useState(null)

  const dayEvents = useMemo(() => {
    if (view !== 'day') {
      return null
    }

    const startOfDay = expandedDate.startOf('day')
    const endOfDay = expandedDate.endOf('day')
    return eventList.filter(e =>
      isOverlap(startOfDay, endOfDay, e.start.dateTime, e.end.dateTime)
    )
  }, [view, eventList, expandedDate])

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
              initialDate={currentDate}
              unfilteredEvents={eventList}
              onExpand={date => {
                setExpandedDate(date)
                const newParams = new URLSearchParams(searchParams)
                newParams.set('v', 'week')
                setSearchParams(newParams)
              }}
            />
          )}
          {view === 'week' && (
            <WeeklyCalendar
              onBack={() => {
                setExpandedDate(null)
                const newParams = new URLSearchParams(searchParams)
                newParams.set('v', 'month')
                setSearchParams(newParams)
              }}
              // key={(expandedDate || currentDate).format('MM D')}
              initialDate={expandedDate || currentDate}
              eventList={eventList}
              onExpand={date => {
                setExpandedDate(date)
                const newParams = new URLSearchParams(searchParams)
                newParams.set('v', 'day')
                setSearchParams(newParams)
              }}
            />
          )}
          {view === 'day' && (
            <DayPage
              onBack={() => {
                const newParams = new URLSearchParams(searchParams)
                newParams.set('v', 'week')
                setSearchParams(newParams)
              }}
              day={expandedDate || dayjs()}
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
}
