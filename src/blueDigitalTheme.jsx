import { Box, createTheme, styled } from '@mui/material'
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#4dd0e1',
    },
    secondary: {
      main: '#ff9b00',
    },
    background: {
      default: '#091116',
      paper: '#182629',
    },
    divider: 'rgba(62,190,255,0.32)',
    text: {
      primary: '#f0feff',
    },
  },

  // components: {
  //   MuiButtonBase: {
  //     styleOverrides: {
  //       root: {
  //         '&.MuiButton-root': { textTransform: 'none' },
  //       },
  //     },
  //   },
  // },
})

const barTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#4dd0e1',
    },
    secondary: {
      main: '#ffd180',
    },
    divider: 'rgba(62,190,255,0.32)',
    text: {
      primary: '#f0feff',
    },
  },
})

function lerpHSL (a, b, t) {
  const wraparound = b.h + 360
  const closest = Math.abs(a.h - b.h) < Math.abs(a.h - wraparound) ? b.h : wraparound

  return {
    h: a.h * (1-t) + closest * t,
    s: (a.s * (1-t) + b.s * t) / 2,
    l: a.l * (1-t) + b.l * t,
  }
}

const sunriseColorpoints = [
  {hour: 0, h: 243, s: 56, l: 19},
  {hour: 5, h: 234, s: 52, l: 42}, // predawn
  {hour: 7, h: 263, s: 60, l: 72}, // daybreak
  {hour: 12, h: 198, s: 73, l: 65}, // midday
  {hour: 15, h: 216, s: 75, l: 60}, // paling day
  {hour: 17, h: 246, s: 50, l: 56}, // paling day
  {hour: 18, h: 6, s: 100, l: 71}, // brightest sunset
  {hour: 20, h: -46, s: 71, l: 21},
  {hour: 20.5, h: -33, s: 61, l: 54},
  {hour: 21, h: -101, s: 30, l: 20},
  {hour: 24, h: -117, s: 56, l: 19},
]

export function sunriseColor(h) {
  let left, right

  let i = 0

  for ( ; i < sunriseColorpoints.length; i++) {
    if(sunriseColorpoints[i].hour > h) { break }
  }

  right = sunriseColorpoints[i]
  left = sunriseColorpoints[i - 1]

  const t = (h - left.hour) / (right.hour - left.hour)
  const hsl = lerpHSL(left, right, t)

  return `hsl(${hsl.h}deg ${hsl.s}% ${hsl.l}%)`
}

export function alternatingShades(j, contrast = 1.0) {
  const hue = 190
  const saturation = 17
  const lightness =
    18 - contrast * 0.5 * ((j % 7) + j / 7) + contrast * (j % 2 ? 0 : 3)

  return `hsl(${hue}deg ${saturation}% ${lightness}%)`
}

export function sunriseShadesSoft(j, contrast = 1.0) {
  const daylight = Math.max(0, Math.cos(0.7*(j-12) / 24 * 2 * Math.PI))
  const hue = 155 + 180 * j/24 + 720*Math.max(0, (j-17) / 18)**1.5
  const saturation = 20 + (daylight * 50/25 * (j-12)**2)
  const lightness = 7 + 60 * daylight
    //18 //+ contrast * j + contrast * (j % 2 ? 0 : 3)

  return `hsl(${hue}deg ${saturation}% ${lightness}%)`
}

export function sunriseShades(j, contrast = 1.0) {
  const daylight = Math.max(0, Math.cos(0.7*(j-12) / 24 * 2 * Math.PI))
  const hue = 155 + 180 * j/24 + 360*Math.max(0, (j-9) / 24)**2
  const saturation = 10 + (daylight * 50/25 * (j-12)**2)
  const lightness = 7 + 90 * daylight
    //18 //+ contrast * j + contrast * (j % 2 ? 0 : 3)

  return `hsl(${hue}deg ${saturation}% ${lightness}%)`
}

export const HoverableBox = styled(Box)(({ theme }) => ({
  position: 'relative',
  '&:hover::after': {
    content: '""',
    display: 'block',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: theme.palette.action.hover,
  },
  '&:active::after': {
    backgroundColor: theme.palette.action.selected,
  }
}))

export { barTheme }
export default theme
