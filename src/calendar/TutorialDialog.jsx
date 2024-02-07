import CloseIcon from '@mui/icons-material/Close'
import AddCircleOutlinedIcon from '@mui/icons-material/AddCircleOutlined'
import { useTheme } from '@emotion/react'
import { Box, IconButton } from '@mui/material'
import { useContext, useMemo, useState } from 'react'
import { useNarrowCheck } from './LayoutContext.mjs'
import { TutorialContext } from './TutorialContext.mjs'

const tutorialTips = {
  'demo mode': (
    <>
      Welcome to <strong>Demo Mode</strong>. Your changes won't be saved.
      <br />
      Ready for a real account? <a href="../../login?a=register">
        Sign up
      </a>{' '}
      today!
    </>
  ),
  'drag and drop': <>Drag and drop events to easily rearrange your schedule.</>,
  'drag create': (
    <>
      Select the <AddCircleOutlinedIcon sx={{ verticalAlign: 'bottom' }} />,
      then click and drag on the calendar to schedule a new event.
      <br />
      You can schedule a whole week of events at once.
    </>
  ),
  'daily tabs': (
    <>
      Tap an event to show its <strong>resize handles</strong>. Drag the handles
      to resize the event.
    </>
  ),
}

export function enableTutorial() {
  if (!sessionStorage.tutorialEnabled) {
    console.log('%cenabling tutorial', 'color: yellow')

    sessionStorage.tutorialEnabled = true

    for (const tip in tutorialTips) {
      sessionStorage[tip] = true
    }
  }

  return null
}

const noop = () => {}

export function TutorialDialog({ position, tip, onClose = noop, sx }) {
  const [message, setMessage] = useState(() =>
    sessionStorage[tip] ? tutorialTips[tip] : ''
  )

  const theme = useTheme()
  const isNarrow = useNarrowCheck()

  let location = {}
  switch (position) {
    case 'over':
      location = {
        bottom: '100%',
        mb: 2,
      }
      break
    case 'right':
      location = {
        top: '5rem',
        right: '1rem',
      }
      break
    case 'bottom-right':
      location = {
        bottom: '4.5rem',
        right: '1rem',
      }
      break
    default:
      location = {
        top: '5rem',
      }
  }

  return !message ? (
    <></>
  ) : (
    <Box
      sx={{
        position: isNarrow ? 'fixed' : 'absolute',
        zIndex: 3,

        backgroundColor: `#ffcd8d`,
        color: '#000',
        borderTop: `2px solid ${theme.palette.secondary.light}`,
        borderLeft: `2px solid ${theme.palette.secondary.light}`,
        borderRight: `2px solid ${theme.palette.secondary.dark}`,
        borderBottom: `2px solid ${theme.palette.secondary.dark}`,
        px: '0.5rem',
        py: '0.25rem',
        height: 'fit-content',
        width: 'min(90vw, 52ch)',
        minHeight: '6rem',
        ml: 2,
        boxShadow: '0.75rem 0.5rem 3rem #0008',
        overflow: 'hidden',
        '& a': {
          color: '#08a',
          fontWeight: 'bold',
          textDecoration: 'none',
        },
        ...location,
        ...sx,
      }}
    >
      <IconButton
        aria-label="Close tooltip"
        sx={{
          color: theme.palette.secondary.dark,
          float: 'right',
          mr: -1,
          mt: -0.5,
        }}
        onPointerDown={() => {
          setMessage(false)
          sessionStorage.removeItem(tip)
          onClose()
        }}
      >
        <CloseIcon />
      </IconButton>
      {message}
    </Box>
  )
}
