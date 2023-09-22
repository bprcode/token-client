import { createTheme } from '@mui/material'
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
    18 - contrast * 0.5 * ((j % 7) + j / 7) + contrast * ((j + 1) % 2 ? 3 : 0)

  return `hsl(${hue}deg ${saturation}% ${lightness}%)`
}

export { barTheme }
export default theme
