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

export function gradualShades(j, contrast = 1.0) {
  const hue = 190 + (105 * j) / 24
  const saturation = 17 + ((5 * j) / 24) * (j % 2)
  const lightness = 12 + contrast * (j % 2 ? 3 : 0)

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
  },
  '&:hover .section-inner': {
    filter: 'brightness(140%)',
  },
  '&:hover .event-pane': {
    // stacks with the parent brightness filter -- still slightly brightened:
    filter: 'brightness(85%) saturate(120%)',
  },
}))

export { barTheme }
export default theme
