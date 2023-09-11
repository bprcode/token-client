import { Typography, useTheme } from "@mui/material"
import { useState } from "react"

export function ClockPicker({ size = 240, time }) {
  const theme = useTheme()
  const [current, setCurrent] = useState(time)
  const [mode, setMode] = useState('hours')
  const pi = Math.PI
  const rotation = 5 * pi / 6 + (mode === 'minutes' ? pi / 6 : 0)
  const twelveHour = current.format('h')
  const hourDegrees = 180 + (twelveHour % 12) * 30
  const numbering = Array(12)
    .fill(0)
    .map((_, i) => {
      const highlight = String(i+1) === twelveHour
      return <div
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
          color: highlight && theme.palette.secondary.contrastText
        }}
      >
        {mode === 'hours' ? i + 1 : i * 5}
      </div>
})

  return (
    <div style={{border: '1px solid gray', width: size + 'px', paddingBottom: '1rem'}}>
      <Typography variant="h3" py={1} sx={{textAlign: 'center'}}>
        {current.format('h:mm A')}
      </Typography>
    <div
      style={{
        backgroundColor: '#00f4',
        width: size + 'px',
        height: size + 'px',
        position: 'relative',
        borderRadius: '50%',
      }}
      onClick={e => {
        const bounds = e.currentTarget.getBoundingClientRect()
        const x = (e.clientX - bounds.left) / size - .5
        const y = -(e.clientY - bounds.top) / size + .5
        const angle = Math.atan2(y,x)
        // for 12-hour:
        const section = 1 + (11 + Math.round(3 - angle / (pi/6))) % 12
        console.log(section)
        setCurrent(current.hour(section))
      }}
    >
      {numbering}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        height: size * 0.25 + 'px',
        width: '5px',
        backgroundColor: '#fffa',
        transformOrigin: 'top',
        transform: `rotate(${hourDegrees}deg)`,
        transition: 'transform 0.3s ease-out',
      }} />
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        height: size * 0.3 + 'px',
        width: '2px',
        backgroundColor: '#fffa',
        transformOrigin: 'top',
        transform: `rotate(${0}deg)`,
      }} />
      
    </div>
    </div>
  )
}
