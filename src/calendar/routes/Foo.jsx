import { Box, Button } from '@mui/material'
import { useEffect, useReducer, useRef } from 'react'

const schedule = new Map()

function backoff(key, callback, log = console.log.bind(console)) {
  const now = Date.now()
  const wait = 1000

  if (!schedule.has(key)) {
    log(`immediate activation: ${key}`)
    schedule.set(key, { time: now })

    return callback()
  }

  const scheduled = schedule.get(key)
  if (now < scheduled.time) {
    const timeLeft = (scheduled.time - now) / 1000
    log(`⏳ ${key} has ${timeLeft} seconds to go...`)

    return
  }

  log(`Scheduling ${key} in ${wait / 1000} seconds...`)

  setTimeout(() => {
    log(`⏰ ${key} triggering.`)
    callback()
  }, wait)

  schedule.set(key, {
    time: now + wait,
  })
}

export function Foo() {
  const scrollRef = useRef(null)
  const [current, increment] = useReducer(
    c => ({ count: c.count + 1, time: Date.now() }),
    { count: 1, time: Date.now() }
  )

  const [history, log] = useReducer(
    (history, message) => [
      ...history,
      {
        message,
        timestamp: Date.now(),
      },
    ],
    []
  )

  useEffect(() => {
    scrollRef.current?.scrollIntoView()
  }, [history])

  return (
    <Box
      sx={{
        bgcolor: '#00f1',
        display: 'grid',
        placeContent: 'center',
        height: '100%',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      }}
    >
      <Box
        sx={{
          height: '30rem',
          width: '80ch',
          bgcolor: 'background.paper',
          p: 3,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div>Count is: {current.count}</div>
        <div>Last stamped: {current.time}</div>
        <div
          ref={scrollRef}
          style={{
            height: '100%',
            backgroundColor: '#0004',
            overflowY: 'auto',
            borderTop: '1px solid #000',
            borderLeft: '1px solid #000',
            borderBottom: '1px solid #fff2',
            padding: '0.75rem',
          }}
        >
          {history.map(r => (
            <div key={r.timestamp}>{r.message}</div>
          ))}
          <div ref={scrollRef} />
        </div>
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <Button
            variant="contained"
            sx={{ mt: 'auto' }}
            onClick={() => {
              backoff(`Foofy`, increment, log)
            }}
          >
            Ping
          </Button>
        </div>
      </Box>
    </Box>
  )
}
