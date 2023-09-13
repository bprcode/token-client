import { Button, Typography, useTheme } from '@mui/material'
import { useState } from 'react'

export function ClockPicker({ size = '240px', time, onPick }) {
  const theme = useTheme()
  const [mode, setMode] = useState('hours')
  const pi = Math.PI
  const rotation = (5 * pi) / 6 + (mode === 'minutes' ? pi / 6 : 0)
  const twelveHour = time.format('h')
  const isPM = time.format('A') === 'PM'
  const currentMinute = String((time.minute() < 10 && '0') + time.minute())
  const hourDegrees = 270 + (twelveHour % 12) * 30
  const minuteDegrees = 270 + 6 * time.minute() //+ (twelveHour % 12) * 30

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
        borderBottomLeftRadius: '4px',
        borderBottomRightRadius: '4px',
        width: size,
        paddingTop: '0.25rem',
        paddingBottom: '1rem',
        paddingLeft: '1rem',
        paddingRight: '1rem',
      }}
    >
      <Typography
        variant="h4"
        py={0.5}
        mb={2}
        sx={{ textAlign: 'center' }}
        component="div"
      >
        <span
          style={{
            backgroundColor: mode === 'hours' && theme.palette.secondary.dark,
            borderRadius: '8px',
            display: 'inline-block',
            minWidth: '1.5em',
            marginRight: '0.25rem',
            border: '1px solid #fff4',
          }}
          onClick={() => setMode('hours')}
        >
          {time.format('h')}
        </span>
        :
        <span
          style={{
            backgroundColor: mode === 'minutes' && theme.palette.secondary.dark,
            borderRadius: '8px',
            display: 'inline-block',
            minWidth: '1.5em',
            marginLeft: '0.25rem',
            marginRight: '0.5rem',
            border: '1px solid #fff4',
          }}
          onClick={() => setMode('minutes')}
        >
          {time.format('mm')}
        </span>
        <Button
          variant="outlined"
          sx={{
            fontSize: theme.typography.h4.fontSize,
            fontWeight: theme.typography.h4.fontWeight,
            borderRadius: '8px',
            color: theme.palette.text.primary,
            borderColor: '#fff4',
            minWidth: '2.25em',
            lineHeight: 'unset',
            paddingTop: 'unset',
            paddingBottom: 'unset',
            paddingLeft: '0.5rem',
            paddingRight: '0.5rem',
            '&:hover': { borderColor: theme.palette.secondary.light },
            '&:active': { borderColor: theme.palette.secondary.light },
            // Align with the clickable spans:
            transform: 'translateY(-3px)',
          }}
          onClick={() => {
            if (isPM) {
              onPick(time.subtract(12, 'hours'))
            } else {
              onPick(time.add(12, 'hours'))
            }
          }}
        >
          {time.format('A')}
        </Button>
      </Typography>

      {/* clock face */}
      <div
        style={{
          backgroundColor: '#363c87',
          width: '100%',
          paddingBottom: '100%', // alternative to aspect-ratio
          position: 'relative',
          borderRadius: '50%',
          userSelect: 'none',
          filter: 'drop-shadow(8px 5px 4px #28100070)',
        }}
        onClick={e => {
          const bounds = e.currentTarget.getBoundingClientRect()
          const x = (e.clientX - bounds.left) / bounds.width - 0.5
          const y = -(e.clientY - bounds.top) / bounds.height + 0.5
          const angle = Math.atan2(y, x)
          // for 12-hour:
          const section = 1 + ((11 + Math.round(3 - angle / (pi / 6))) % 12)

          if (mode === 'hours') {
            onPick(time.hour((section % 12) + (isPM ? 12 : 0)))
            setMode('minutes')
          }
          if (mode === 'minutes') {
            onPick(time.minute((section % 12) * 5))
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
            width: '25%',
            height: '5px',
            backgroundColor:
              mode === 'hours' ? theme.palette.secondary.main : '#fffa',
            transformOrigin: 'left',
            transform: `translateY(-50%) rotate(${hourDegrees}deg)`,
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
            width: '30%',
            height: '2px',
            backgroundColor:
              mode === 'minutes' ? theme.palette.secondary.main : '#fffa',
            transformOrigin: 'left',
            transform: `translateY(-50%) rotate(${minuteDegrees}deg)`,
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
