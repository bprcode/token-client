import { Typography, useTheme } from '@mui/material'
import { useState } from 'react'

export function ClockPicker({ size = 240, time }) {
  const theme = useTheme()
  const [current, setCurrent] = useState(time)
  const [mode, setMode] = useState('minutes')
  const pi = Math.PI
  const rotation = (5 * pi) / 6 + (mode === 'minutes' ? pi / 6 : 0)
  const twelveHour = current.format('h')
  const isPM = current.format('A') === 'PM'
  console.log('is PM?', isPM)
  const currentMinute = String(
    (current.minute() < 10 && '0') + current.minute()
  )
  const hourDegrees = 180 + (twelveHour % 12) * 30
  const minuteDegrees = 180 + 6 * current.minute() //+ (twelveHour % 12) * 30

  const numbering = Array(12)
    .fill(0)
    .map((_, i) => {
      const hourString = String(i + 1)
      const minuteString = String((i <= 1 && '0') + i * 5)
      const highlight =
        mode === 'hours'
          ? hourString === twelveHour
          : minuteString === currentMinute

      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: 50 + 40 * Math.cos((-2 * pi * i) / 12 + rotation) + '%',
            left: 50 + 40 * Math.sin((-2 * pi * i) / 12 + rotation) + '%',
            transform: 'translate(-50%,-50%)',
            backgroundColor: highlight && theme.palette.secondary.main,
            padding: '4px',
            width: '2rem',
            height: '2rem',
            borderRadius: '50%',
            textAlign: 'center',
            color: highlight && theme.palette.secondary.contrastText,
          }}
        >
          {mode === 'hours' ? hourString : minuteString}
        </div>
      )
    })

  return (
    <div
      style={{
        border: '1px solid gray',
        width: size + 'px',
        paddingBottom: '1rem',
      }}
    >
      <Typography
        variant="h3"
        py={1}
        mb={2}
        sx={{ textAlign: 'center' }}
        component="div"
      >
        <span
          style={{
            backgroundColor: mode === 'hours' && theme.palette.secondary.dark,
            borderRadius: '8px',
            display: 'inline-block',
            minWidth: '1em',
            paddingLeft: '0.25rem',
            paddingRight: '0.25rem',
            border: '1px solid #fff4',
          }}
          onClick={() => setMode('hours')}
        >
          {current.format('h')}
        </span>
        :
        <span
          style={{
            backgroundColor: mode === 'minutes' && theme.palette.secondary.dark,
            borderRadius: '8px',
            paddingLeft: '0.25rem',
            paddingRight: '0.25rem',
            border: '1px solid #fff4',
          }}
          onClick={() => setMode('minutes')}
        >
          {current.format('mm')}
        </span>
        &nbsp;
        <span
          style={{
            borderRadius: '8px',
            border: '1px solid #fff4',
            paddingLeft: '0.25rem',
            paddingRight: '0.25rem',
          }}
          onClick={() => {
            if (isPM) {
              setCurrent(current.subtract(12, 'hours'))
            } else {
              setCurrent(current.add(12, 'hours'))
            }
          }}
        >
          {current.format('A')}
        </span>
      </Typography>
      <div
        style={{
          backgroundColor: '#00f4',
          width: size + 'px',
          height: size + 'px',
          position: 'relative',
          borderRadius: '50%',
          userSelect: 'none',
        }}
        onClick={e => {
          const bounds = e.currentTarget.getBoundingClientRect()
          const x = (e.clientX - bounds.left) / size - 0.5
          const y = -(e.clientY - bounds.top) / size + 0.5
          const angle = Math.atan2(y, x)
          // for 12-hour:
          const section = 1 + ((11 + Math.round(3 - angle / (pi / 6))) % 12)

          if (mode === 'hours') {
            setCurrent(current.hour((section % 12) + (isPM ? 12 : 0)))
          }
          if (mode === 'minutes') {
            setCurrent(current.minute((section % 12) * 5))
          }
        }}
      >
        {numbering}

        {/* hour hand */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            height: size * 0.25 + 'px',
            width: '5px',
            backgroundColor: '#fffa',
            transformOrigin: 'top',
            transform: `translateX(-50%) rotate(${hourDegrees}deg)`,
            transition: 'transform 0.25s ease-out',
            borderRadius: '4px',
          }}
        />

        {/* minute hand */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            height: size * 0.3 + 'px',
            width: '2px',
            backgroundColor: '#fffa',
            transformOrigin: 'top',
            transform: `translateX(-50%) rotate(${minuteDegrees}deg)`,
            transition: 'transform 0.25s ease-out',
          }}
        />

        {/* pivot */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '0.5rem',
            height: '0.5rem',
            backgroundColor: '#ccc',
            borderRadius: '50%',
            transform: 'translate(-50%,-50%)',
          }}
        />
      </div>
    </div>
  )
}
