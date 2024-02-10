import CloseIcon from '@mui/icons-material/Close'
import AddCircleOutlinedIcon from '@mui/icons-material/AddCircleOutlined'
import { useTheme } from '@emotion/react'
import { Box, IconButton } from '@mui/material'
import { useEffect, useState } from 'react'
import { useNarrowCheck } from './LayoutContext.mjs'
import { Link } from 'react-router-dom'

const tutorialTips = {
  'demo mode': (
    <>
      Welcome to <strong>Demo Mode</strong>. Your changes won't be saved.
      <br />
      Ready for a real account? <Link to="/login?a=register">Sign up </Link>
      today!
    </>
  ),
  'expand a week': <>Tap on any week to get started.</>,
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

let tutorialStages = JSON.parse(sessionStorage['tutorial stages'] || '[]')
const listeners = new Set()

function onUpdateTutorial() {
  for (const f of listeners) {
    f(tutorialStages[0])
  }
}

export function updateTutorial(update) {
  if (typeof update === 'function') {
    update = update(tutorialStages)
  }

  sessionStorage['tutorial stages'] = JSON.stringify(update)
  tutorialStages = update
  onUpdateTutorial()
}

export function advanceTutorial() {
  updateTutorial(tutorialStages.slice(1))
}

export function removeTutorialStage(stage) {
  updateTutorial(tutorialStages.filter(s => s !== stage))
}

export function useTutorialStage() {
  const [stage, setStage] = useState(tutorialStages[0])

  useEffect(() => {
    listeners.add(setStage)

    return () => {
      listeners.delete(setStage)
    }
  }, [])

  return stage
}

export function enableTutorial(stages) {
  if (!sessionStorage.tutorialEnabled) {
    sessionStorage.tutorialEnabled = true
    updateTutorial(stages || Object.keys(tutorialTips))
  }

  return null
}

const noop = () => {}

export function TutorialDialog({ position, tip, onClose = noop, sx }) {
  const theme = useTheme()
  const isNarrow = useNarrowCheck()
  const currentStage = useTutorialStage()

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

  if (currentStage !== tip) {
    return <></>
  }

  return (
    <Box
      sx={{
        position: isNarrow ? 'fixed' : 'absolute',
        zIndex: 4,

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
          advanceTutorial()
          onClose()
        }}
      >
        <CloseIcon />
      </IconButton>
      {tutorialTips[tip] || '<Missing tutorial text>'}
    </Box>
  )
}
