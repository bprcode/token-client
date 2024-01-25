import { Alert, AlertTitle, Box, Button, Slide } from '@mui/material'
import { createSearchParams, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { isOverlap, reduceConcurrentEvents } from '../calendarLogic.mjs'
import dayjs from 'dayjs'
import { MonthlyView } from '../MonthlyView'
import { WeeklyView } from '../WeeklyView'
import { DailyView } from '../DailyView'
import { goFetch } from '../../go-fetch'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { reconcile } from '../reconcile.mjs'
import { updateCacheData } from '../cacheTracker.mjs'
import { LoadingHourglass } from '../LoadingHourglass'
import { ViewContainer } from '../ViewContainer'
import { ViewHeader } from '../ViewHeader'
import { useTheme } from '@emotion/react'
import { alpha } from '@mui/material/styles'
import { isEventDuplicate } from '../EventSync'
import { useState } from 'react'

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

const viewReconcileLog = (...args) =>
  console.log(`%cView Reconciler>`, `color:darkslategray`, ...args)

export function useViewQuery() {
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

      const reconciled = reconcile({
        localData: local,
        serverData: parsed,
        key: 'id',
        tag: 'views',
        log: viewReconcileLog,
        isDuplicate: isEventDuplicate,
        allowRevival: true,
      })

      // Add the new data into the primary cache.
      updateCacheData(queryClient, id, cache => {
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
    console.log('🐜 debug / no cache local/route loader implemented.')
    updateCacheData(queryClient, params.id, data => {
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
    updateCacheData(queryClient, id, data => ({
      sortedViews: data.sortedViews,
      stored: reduceConcurrentEvents(data.stored, action),
    }))

    resetViewsToCache(queryClient, id)
  }
}

export function Calendar() {
  const params = useParams()
  return <CalendarContents key={params.id} calendarId={params.id} />
}

export function CalendarContents({ calendarId }) {
  const dispatch = usePrimaryDispatch()
  const navigate = useNavigate()
  const theme = useTheme()

  const { data: calendarData, error: viewError } = useViewQuery()
  const { data: primaryCacheData } = useQuery({
    queryKey: ['primary cache', calendarId],
    enabled: false,
  })

  const [searchParams, setSearchParams] = useSearchParams()
  const view = searchParams.get('v') || 'month'
  const date = searchParams.has('d')
    ? dayjs(searchParams.get('d').replaceAll('_', ':'))
    : dayjs()

  const [debugView, setDebugView] = useState(view)

  

  const updaters = {
    onCreate: addition =>
      dispatch({
        type: 'create',
        addition,
      }),
    onUpdate: (id, updates) =>
      dispatch({
        type: 'update',
        id,
        updates,
      }),
    onDelete: id =>
      dispatch({
        type: 'delete',
        id,
      }),
  }

  console.log('%cCalendarContents rendering with view=', 'color:cyan', view, searchParams)
  console.log('%cand debugView=','color:#aaf',debugView)

  // Workaround for React-Router re-rendering with outdated search params:
  if(view !== debugView) {
    return <div style={{
      width: '100%',
      height: '100%',
      backgroundColor: 'purple'
    }}/>
  }

  if (viewError) {
    return (
      <ViewContainer>
        <ViewHeader />
        <div
          style={{
            display: 'grid',
            height: '100%',
            placeContent: 'center',
          }}
        >
          <Alert
            severity="error"
            sx={{
              border: '1px solid ' + alpha(theme.palette.error.main, 0.08),
            }}
            action={
              <Button sx={{ mt: 'auto' }} onClick={() => navigate(-1)}>
                Back
              </Button>
            }
          >
            <AlertTitle>Error</AlertTitle>
            Error loading view: {viewError.message}
          </Alert>
        </div>
      </ViewContainer>
    )
  }

  if (!calendarData) {
    return (
      <ViewContainer>
        <ViewHeader />
        <div
          style={{
            display: 'grid',
            height: '100%',
            placeContent: 'center',
          }}
        >
          <LoadingHourglass />
        </div>
      </ViewContainer>
    )
  }

  return (
    <Box
      sx={{
        height: '100%',
        width: '100%',
        position: 'relative',
        backgroundColor: 'transparent',
        backgroundImage:
          'linear-gradient(110deg, #111b20f0 25%, #1d5c1400 70%)',
      }}
    >
      {/* <Slide
        key={params.id}
        timeout={350}
        in={true}
        direction="left"
        mountOnEnter
        unmountOnExit
      > */}
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
            {...updaters}
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
            {...updaters}
            onUndo={() => console.log(`debug: not implemented.`)}
            canUndo={false}
          />
        )}
      </div>
      {/* </Slide> */}
    </Box>
  )

  function updateParams({ view, date }) {
    console.log('%cupdateParams called with v,d=','color:',view,date)
    const newParams = new URLSearchParams(searchParams)
    if (view) {
      newParams.set('v', view)
      setDebugView(view)
    }
    if (date) {
      newParams.set('d', date.utc().format().replaceAll(':', '_'))
    }
    setSearchParams(newParams)
  }
}
