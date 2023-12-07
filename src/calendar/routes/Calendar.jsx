import { Paper, Slide } from '@mui/material'
import { useContext, useMemo } from 'react'
import { useLoaderData, useParams, useSearchParams } from 'react-router-dom'
import { PreferencesContext } from '../PreferencesContext.mjs'
import {
  isOverlap,
  useEventListHistory,
  useCurrentEvents,
  createSampleWeek,
} from '../calendarLogic.mjs'
import dayjs from 'dayjs'
import { MonthlyView } from '../MonthlyView'
import { WeeklyView } from '../WeeklyView'
import { DailyView } from '../DailyView'
import { goFetch } from '../../go-fetch'
import { useQuery, useQueryClient } from '@tanstack/react-query'

const calendarFetcher = queryClient => async ({queryKey}) => {
  const [, calendar_id, filters = {}] = queryKey
  console.log(
    'queryFn running for calendar_id=',
    calendar_id,
    ' filters=',
    filters
  )

  const response = await goFetch(`calendars/${calendar_id}/events`, )
  return response.map(row => ({
    id: row.event_id,
    etag: row.etag,
    created: dayjs(row.created),
    summary: row.summary || 'Default Event',
    description: row.description || 'Default Description',
    startTime: dayjs(row.start_time),
    endTime: dayjs(row.end_time),
    colorId: row.color_id,
  }))

  // const fetched = await goFetch('calendars', {
  //   credentials: 'include',
  // })
  // const local = queryClient.getQueryData(['catalog']) ?? []

  // return reconcile({
  //   localData: local,
  //   serverData: fetched,
  //   key: 'calendar_id',
  //   log: () => {},
  // })
}

function makeCalendarQuery(queryClient, calendar_id, filters) {
  return {
    queryKey: ['calendars', calendar_id, filters],
    queryFn: calendarFetcher(queryClient),
  }
}

function useCalendarQuery() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  // debug -- wip, not using search params yet
  const currentDate =  searchParams.get('d')?.replaceAll('_', ':') ?? new Date().toISOString()
  let from, to

  if(searchParams.get('v') === 'week') {

      from = dayjs(currentDate).startOf('week')
      to = from.add(6, 'days')

      console.log('Using week range from', from.toISOString(), 'to', to.toISOString())
  }
  const queryClient = useQueryClient()
  return useQuery(makeCalendarQuery(queryClient, id, {from, to}))
}

export const loader =
  queryClient =>
  ({ request, params }) => {
    console.log('🐜 debug / placeholder / not prefetching events yet')
    // const data = createSampleWeek(dayjs())
    return 'not yet implemented'
    // return new Promise(k => {
    //   setTimeout(() => {
    //     queryClient.setQueryData(['calendars', params.id], () => data)
    //     k(null)
    //   }, Math.random() * 1000 + 500)
    // })
  }

export function Calendar() {
  const { data: calendarData } = useCalendarQuery()

  const [searchParams, setSearchParams] = useSearchParams()
  const params = useParams()
  const view = searchParams.get('v') || 'month'

  // const [currentEvents, dispatchCurrentEvents] = useCurrentEvents(calendarData)
  const dispatchCurrentEvents = () => console.log(`placeholder`)

  const preferences = useContext(PreferencesContext)
  /*
  const [eventListHistory, dispatchEventListHistory] =
    useEventListHistory(calendarData)
  const eventList = eventListHistory[eventListHistory.length - 1]
  const dispatchAction = dispatchEventListHistory
  const canUndo = eventListHistory.length > 1
  */

  const date = searchParams.has('d')
    ? dayjs(searchParams.get('d').replaceAll('_', ':'))
    : dayjs()

  /*
  const dayEvents = useMemo(() => {
    console.log('memoizing day events')
    if (view !== 'day') {
      return null
    }

    const startOfDay = date.startOf('day')
    const endOfDay = date.endOf('day')
    return eventList.filter(e =>
      isOverlap(startOfDay, endOfDay, e.startTime, e.endTime)
    )
  }, [view, eventList, date])
  */

  if(!calendarData) {
    return <div>Loading...</div>
  }
  
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
            <MonthlyView
              date={date}
              unfilteredEvents={calendarData}
              onExpand={date => updateParams({ view: 'week', date })}
              onChange={date => updateParams({ date })}
            />
          )}
          {view === 'week' && (
            <WeeklyView
              onBack={() => {
                updateParams({ view: 'month' })
              }}
              date={date}
              eventList={calendarData}
              onExpand={date => updateParams({ view: 'day', date })}
              onChange={date => updateParams({ date })}
            />
          )}
          {view === 'day' && (
            <DailyView
              onBack={() => {
                updateParams({ view: 'week' })
              }}
              date={date}
              unfilteredEvents={calendarData}
              // debug -- need refactoring
              filteredEvents={calendarData}
              onCreate={addition =>
                dispatchCurrentEvents({
                  type: 'create',
                  merge: preferences.merge,
                  addition,
                })
              }
              onUpdate={updates =>
                dispatchCurrentEvents({
                  type: 'update',
                  id: updates.id,
                  merge: preferences.merge,
                  updates,
                })
              }
              onDelete={id =>
                dispatchCurrentEvents({
                  type: 'delete',
                  id: id,
                })
              }
              onUndo={() => console.log(`debug: not implemented.`)}
              canUndo={false}
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
      newParams.set('d', date.utc().format().replaceAll(':', '_'))
    }
    setSearchParams(newParams)
  }
}
