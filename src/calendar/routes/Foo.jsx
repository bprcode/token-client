import { Box, Button } from '@mui/material'
import { useEffect, useReducer, useRef } from 'react'
import { keyframes } from '@mui/system'
import { styled } from '@mui/material/styles'
import { backoff } from '../../debounce'

const myEffect = keyframes`
from {
  color: #fea;
  text-shadow: 0 0 0.5rem #f40f;
}
to {
  color: #ccc;
  text-shadow: 0 0 0.5rem #f400;
}
`

const BlinkyBox = styled('div')({
  color: '#ccc',
  textShadow: '0 0 0.5rem #f400',
  animation: `${myEffect} 0.5s linear`,
})



export function Foo() {
  const [key, onReset] = useReducer(r => r + 1, 1)

  return <Bar key={key} onReset={onReset} />
}

function Bar({ onReset }) {
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
        justifyContent: 'center',
        height: '100%',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        overflowY: 'auto',
      }}
    >
      <Box
        sx={{
          height: '30rem',
          width: '80ch',
          bgcolor: 'background.paper',
          p: 3,
          mt: 4,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <BlinkyBox key={current.count}>
          Count is: {current.count}
          <div>Last stamped: {new Date(current.time).toLocaleTimeString()}</div>
        </BlinkyBox>
        <div
          style={{
            marginTop: '1rem',
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
            <div key={r.timestamp + r.message}>
              <span
                style={{
                  display: 'inline-block',
                  opacity: 0.5,
                  width: '10ch',
                }}
              >
                {new Date(r.timestamp).toLocaleTimeString().split(' ')[0]}
              </span>
              {r.message}
            </div>
          ))}
          <div ref={scrollRef} />
        </div>
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <Button
            variant="contained"
            sx={{ mt: 'auto' }}
            onClick={() => {
              backoff(`Foofy`, increment)
            }}
          >
            Ping
          </Button>
          <Button variant="outlined" sx={{ ml: 2 }} onClick={onReset}>
            Reset
          </Button>
        </div>
      </Box>
    </Box>
  )
}
