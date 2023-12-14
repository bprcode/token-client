import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted'
import { CircularProgress, IconButton, Paper, Slide } from '@mui/material'
import { useContext, useMemo, useReducer, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { isOverlap, reduceCurrentEvents } from '../calendarLogic.mjs'
import dayjs from 'dayjs'
import { MonthlyView } from '../MonthlyView'
import { WeeklyView } from '../WeeklyView'
import { DailyView } from '../DailyView'
import { goFetch } from '../../go-fetch'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { reconcile } from '../reconcile.mjs'

const log = console.log.bind(console)

function mergeView(list, incoming) {
  const log = () => {}
  // const log = console.log.bind(console)
  const merged = []
  log('mergeViewList(...)', Math.random())

  function format(first, second) {
    const display = `<DD>HH:mm`
    return (
      first.from.utc().format(display) +
      '–' +
      first.to.utc().format(display) +
      ' & ' +
      second.from.utc().format(display) +
      '–' +
      second.to.utc().format(display)
    )
  }

  function merge(view) {
    if (view.to.diff(view.from) <= 1) {
      log(`skipping degenerate view`)
      return
    }

    merged.push(view)
  }

  for (const v of list) {
    if (!isOverlap(v.from, v.to, incoming.from, incoming.to)) {
      log('🟢 no collision in ', format(v, incoming))

      merge(v)
      continue
    }

    if (v.from.isBefore(incoming.from) && v.to.isAfter(incoming.to)) {
      const before = { from: v.from, to: incoming.from }
      const after = { from: incoming.to, to: v.to }
      log(
        '🪓 should split:',
        format(v, incoming),
        'source into:',
        format(before, after)
      )

      merge({ ...v, ...before })
      merge({ ...v, ...after })
      continue
    }

    // negation to handle edge overlap
    if (!v.from.isBefore(incoming.from) && !v.to.isAfter(incoming.to)) {
      log('📥 should absorb ', format(v, incoming))
      continue
    }

    if (v.from.isBefore(incoming.from)) {
      const before = { from: v.from, to: incoming.from }
      log('💥 before-collision: ', format(v, incoming))

      merge({ ...v, ...before })
      continue
    }
    if (v.to.isAfter(incoming.to)) {
      const after = { from: incoming.to, to: v.to }
      log('💥 after-collision: ', format(v, incoming))

      merge({ ...v, ...after })
      continue
    }

    console.warn('Unhandled view collision.')
    merge(v)
  }

  merge(incoming)
  const sorted = merged.toSorted((x, y) => x.from.unix() - y.from.unix())
  return sorted
}

function useSearchRange() {
  const [searchParams] = useSearchParams()
  const currentDate =
    searchParams.get('d')?.replaceAll('_', ':') ?? new Date().toISOString()
  let from, to

  switch (searchParams.get('v')) {
    case 'week':
      from = dayjs(currentDate).startOf('week')
      to = dayjs(currentDate).endOf('week')
      break
    case 'day':
      from = dayjs(currentDate).startOf('day')
      to = dayjs(currentDate).endOf('day')
      break
    default:
      // Show edges of weeks overlapping current month grid
      from = dayjs(currentDate).startOf('month').startOf('week')
      to = dayjs(currentDate).endOf('month').endOf('week')
  }

  return { from, to }
}

/**
 * If the latest view is fully covered by the cache,
 * find the age of the most-outdated overlapping view.
 * Otherwise, return undefined.
 */
function findViewAge(views, latest) {
  let earliest = Infinity
  const overlaps = []

  for (const v of views) {
    if (isOverlap(v.from, v.to, latest.from, latest.to)) {
      if (v.at < earliest) {
        earliest = v.at
      }
      overlaps.push(v)
    }
  }

  if (overlaps.length === 0) {
    log(`No overlaps. Cannot supply from cache.`)
    return undefined
  }

  let uncovered = 0
  for (let i = 1; i < overlaps.length; i++) {
    const gap = overlaps[i].from.diff(overlaps[i - 1].to)
    log(`difference #${i}:`, gap)
    if (gap > 1) {
      uncovered += gap
    }
  }
  if (uncovered > 0) {
    log(`views were not continuous`)
    return undefined
  }

  // If the new view is wholly covered,
  // return the age of the oldest matching data.
  if (
    !overlaps[0].from.isAfter(latest.from) &&
    !overlaps[overlaps.length - 1].to.isBefore(latest.to)
  ) {
    log(`earliest view match was:`, earliest)
    return earliest
  }

  log(`cache partially matched, but not fully.`)
  return undefined
}

function serveFromCache(cache, from, to) {
  return cache.filter(e => isOverlap(e.startTime, e.endTime, from, to))
}

function useViewQuery() {
  const { id } = useParams()
  const { from, to } = useSearchRange()
  const queryClient = useQueryClient()

  const staleTime = 1 * 60 * 1000

  return useQuery({
    gcTime: 0,
    staleTime,
    queryKey: ['views', id, { from: from.toISOString(), to: to.toISOString() }],
    initialData: () => {
      log(`🍗 initialData function`)
      const cached = queryClient.getQueryData(['primary cache', id])
      const viewAge = findViewAge(cached.sortedViews, { from, to })

      if (viewAge) {
        const filtered = serveFromCache(cached.stored, from, to)
        log(
          `👍 using (${filtered.length}) events from cache, ` +
            `data is ${(Date.now() - viewAge) / 1000} seconds old, ` +
            `${Math.floor(
              (100 * (Date.now() - viewAge)) / staleTime
            )}% to stale.`
        )
        return filtered
      }

      log(`🤷‍♂️ cache not available for this request. Fetching the hard way.`)
      return undefined
    },
    initialDataUpdatedAt: () => {
      const cached = queryClient.getQueryData(['primary cache', id])
      const viewAge = findViewAge(cached.sortedViews, { from, to })

      return viewAge
    },
    queryFn: async ({ queryKey }) => {
      const [, calendar_id, filters = {}] = queryKey
      log(`🦃 queryFn executing for view:`, queryKey)
      const endpoint = `calendars/${calendar_id}/events`
      const search = new URLSearchParams(filters).toString()

      const response = await goFetch(endpoint + (search && '?' + search))
      const parsed = response.map(row => ({
        id: row.event_id,
        etag: row.etag,
        created: dayjs(row.created),
        summary: row.summary || 'Default Event',
        description: row.description || 'Default Description',
        startTime: dayjs(row.start_time),
        endTime: dayjs(row.end_time),
        colorId: row.color_id,
      }))

      // Reconcile conflicts between present state and fetched data
      const local = queryClient
        .getQueryData(['primary cache', id])
        .stored.filter(e => isOverlap(e.startTime, e.endTime, from, to))
      // const local = queryClient.getQueryData(queryKey) ?? []
      const reconciled = reconcile({
        localData: local,
        serverData: parsed,
        key: 'id',
        log: console.log,
        allowRevival: true,
      })

      // Add the new data into the primary cache.
      queryClient.setQueryData(['primary cache', id], cache => {
        // Events not included in this range are persisted unchanged.
        const unseen = cache.stored.filter(
          e => !isOverlap(e.startTime, e.endTime, from, to)
        )
        return {
          stored: [...unseen, ...reconciled],
          sortedViews: mergeView(cache.sortedViews, {
            from: dayjs(filters.from),
            to: dayjs(filters.to),
            at: Date.now(),
          }),
        }
      })

      return reconciled
    },
  })
}

export const loader =
  queryClient =>
  ({ request, params }) => {
    console.log('🐜 debug / placeholder / working on centralizing cache')
    queryClient.setQueryData(['primary cache', params.id], data => {
      if (data) {
        log(`🌙 primary cache already initialized`)
        return
      }

      return { stored: [], sortedViews: [] }
    })
    // const data = createSampleWeek(dayjs())
    return 'not yet implemented'
    // return new Promise(k => {
    //   setTimeout(() => {
    //     queryClient.setQueryData(['calendars', params.id], () => data)
    //     k(null)
    //   }, Math.random() * 1000 + 500)
    // })
  }

export function resetViewsToCache(queryClient, calendarId) {
  const primaryCache = queryClient.getQueryData([
    'primary cache',
    calendarId,
  ]).stored

  queryClient
    .getQueryCache()
    .findAll({ queryKey: ['views', calendarId] })
    .forEach(q => {
      queryClient.setQueryData(
        q.queryKey,
        serveFromCache(
          primaryCache,
          dayjs(q.queryKey[2].from),
          dayjs(q.queryKey[2].to)
        )
      )
    })
}

function usePrimaryDispatch() {
  const queryClient = useQueryClient()
  const { id } = useParams()
  return action => {
    queryClient.setQueryData(['primary cache', id], data => ({
      sortedViews: data.sortedViews,
      stored: reduceCurrentEvents(data.stored, action),
    }))

    resetViewsToCache(queryClient, id)
  }
}

export function Calendar() {
  const params = useParams()
  return <CalendarContents key={params.id} calendarId={params.id} />
}

export function CalendarContents({ calendarId }) {
  const [showViewList, toggleViewList] = useReducer(on => !on, false)

  const { data: calendarData } = useViewQuery()
  const { data: primaryCacheData } = useQuery({
    queryKey: ['primary cache', calendarId],
    enabled: false,
  })

  const [searchParams, setSearchParams] = useSearchParams()
  const params = useParams()
  const view = searchParams.get('v') || 'month'

  // const [currentEvents, dispatchCurrentEvents] = useCurrentEvents(calendarData)
  // const dispatch = useCalendarDispatch()
  const dispatch = usePrimaryDispatch()

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
    return (
      <div
        style={{
          display: 'grid',
          height: '100%',
          placeContent: 'center',
        }}
      >
        <CircularProgress />
      </div>
    )
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
            height: '12rem',
            overflowY: 'auto',
            zIndex: 3,
          }}
        >
          {primaryCacheData.sortedViews.map((v, i) => (
            <div key={i}>
              {v.from.utc().format('MMM-DD HH:mm:ss')}
              &nbsp;to {v.to.utc().format('MMM-DD HH:mm:ss')}
              &nbsp;at {Math.round((v.at / 1000) % 10000)}
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
                  addition,
                })
              }
              onUpdate={updates =>
                dispatch({
                  type: 'update',
                  id: updates.id,
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
