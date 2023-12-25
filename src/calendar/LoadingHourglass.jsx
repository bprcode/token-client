import { Box } from '@mui/material'
import hourglassSvg from '../assets/hourglass-icon.svg'
import { keyframes } from '@mui/material/styles'
import { useEffect, useReducer } from 'react'

const spin1 = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(180deg);
  }
`

const spin2 = keyframes`
  from {
    transform: rotate(180deg);
  }
  to {
    transform: rotate(360deg);
  }
`

export function LoadingHourglass({ sx }) {
  const heightPixels = 64
  const [spin, flip] = useReducer(a => (a === spin1 ? spin2 : spin1), spin1)
  useEffect(() => {
    const tid = setInterval(flip, 1700)
    return () => clearTimeout(tid)
  }, [])

  return (
    <Box
      sx={{
        transform: spin === spin2 ? 'rotate(0deg)' : 'rotate(180deg)',
        animation: `${spin} 1.25s cubic-bezier(.6,-0.43,.19,1.01)`,
        ...sx,
      }}
    >
      <img src={hourglassSvg} height={heightPixels} />
    </Box>
  )
}
