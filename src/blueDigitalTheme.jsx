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

export function alternatingShades(j, contrast = 1.0) {
  const hue = 190
  const saturation = 17
  const lightness =
    18 - contrast * 0.5 * ((j % 7) + j / 7) + contrast * (j % 2 ? 0 : 3)

  return `hsl(${hue}deg ${saturation}% ${lightness}%)`
}

export function sunriseShades(j, contrast = 1.0) {
  const daylight = Math.max(0, Math.cos(0.7*(j-12) / 24 * 2 * Math.PI))
  const hue = 155 + 180 * j/24 + 270*Math.max(0, (j-12) / 24)
  const saturation = 17 + (daylight * 50/25 * (j-12)**2)
  const lightness = 7 + 40 * daylight
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
