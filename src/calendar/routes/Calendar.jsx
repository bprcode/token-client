import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted'
import { IconButton, Paper, Slide } from '@mui/material'
import { useContext, useMemo, useReducer, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { PreferencesContext } from '../PreferencesContext.mjs'
import { createSampleWeek, reduceCurrentEvents } from '../calendarLogic.mjs'
import dayjs from 'dayjs'
import { MonthlyView } from '../MonthlyView'
import { WeeklyView } from '../WeeklyView'
import { DailyView } from '../DailyView'
import { goFetch } from '../../go-fetch'
import { useQuery, useQueryClient } from '@tanstack/react-query'

const log = console.log.bind(console)

function mergeViewList(list, newView) {
  return [...list, newView]
}

const calendarFetcher = queryClient => async queryContext => {
  const { queryKey } = queryContext
  const setViewList = queryContext.meta.setViewList
  const [, calendar_id, filters = {}] = queryKey
  const endpoint = `calendars/${calendar_id}/events`
  const search = new URLSearchParams(filters).toString()

  log('queryFn running for calendar_id=', calendar_id, ' filters=', filters)
  log('queryContext = ', queryContext)

  const response = await goFetch(endpoint + (search && '?' + search))
  setViewList(list => mergeViewList(list, { from: filters.from, to: filters.to }))
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

function makeCalendarQuery(queryClient, calendar_id, filters, setViewList) {
  return {
    queryKey: ['calendars', calendar_id, filters],
    queryFn: calendarFetcher(queryClient),
    meta: { setViewList },
  }
}

function useCalendarQuery(setViewList) {
  const { id } = useParams()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const currentDate =
    searchParams.get('d')?.replaceAll('_', ':') ?? new Date().toISOString()
  let from, to

  switch (searchParams.get('v')) {
    case 'week':
      log('fetching week')
      from = dayjs(currentDate).startOf('week')
      to = dayjs(currentDate).endOf('week')
      break
    case 'day':
      log('fetching day')
      from = dayjs(currentDate).startOf('day')
      to = dayjs(currentDate).endOf('day')
      break
    default:
      log('fetching month')
      from = dayjs(currentDate).startOf('month')
      to = dayjs(currentDate).endOf('month')
  }

  return useQuery(
    makeCalendarQuery(
      queryClient,
      id,
      {
        from: from.toISOString(),
        to: to.toISOString(),
      },
      setViewList
    )
  )
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

function useCalendarDispatch() {
  const queryClient = useQueryClient()
  const params = useParams()
  // debug -- if multiple queries are active, they generally don't share events
  // the current reducer does not account for this
  return action =>
    queryClient.setQueriesData({ queryKey: ['calendars', params.id] }, data => {
      console.log(`🧑‍🍳 reducing on`, data)
      return reduceCurrentEvents(data, action)
    })
}

export function Calendar() {
  const params = useParams()
  return <CalendarContents key={params.id} />
}

export function CalendarContents() {
  const [viewList, setViewList] = useState(() => [])
  const [showViewList, toggleViewList] = useReducer(v => !v, true)

  const { data: calendarData } = useCalendarQuery(setViewList)

  const [searchParams, setSearchParams] = useSearchParams()
  const params = useParams()
  const view = searchParams.get('v') || 'month'

  // const [currentEvents, dispatchCurrentEvents] = useCurrentEvents(calendarData)
  const dispatch = useCalendarDispatch()

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

  if (!calendarData) {
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
      <IconButton
        onClick={toggleViewList}
        sx={{
          position: 'absolute',
          bottom: 0,
          zIndex: 4,
        }}
      >
        <FormatListBulletedIcon />
      </IconButton>
      {showViewList && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            backgroundColor: '#0af4',
            width: '40ch',
            height: '20rem',
            zIndex: 3,
          }}
        >
          {viewList.map((v, i) => (
            <div key={i}>
              {dayjs(v.from).format('MMM DD')}
              &nbsp;to {dayjs(v.to).format('MMM DD')}
            </div>
          ))}
        </div>
      )}
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
              // debug -- need refactoring --
              // filteredEvents={calendarData/needs filtering}
              onCreate={addition =>
                dispatch({
                  type: 'create',
                  merge: preferences.merge,
                  addition,
                })
              }
              onUpdate={updates =>
                dispatch({
                  type: 'update',
                  id: updates.id,
                  merge: preferences.merge,
                  updates,
                })
              }
              onDelete={id =>
                dispatch({
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
