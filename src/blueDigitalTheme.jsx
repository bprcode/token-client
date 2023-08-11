import { createTheme } from '@mui/material'
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#4dd0e1',
    },
    secondary: {
      main: '#ffd180',
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
    }
  },
})

export { barTheme }
export default theme
