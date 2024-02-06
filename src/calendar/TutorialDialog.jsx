import CloseIcon from '@mui/icons-material/Close'
import { useTheme } from '@emotion/react'
import { Box, IconButton } from '@mui/material'
import { useState } from 'react'

const tutorialTips = {
  'demo mode': <>Welcome to <strong>demo mode</strong>. Your changes won't be saved.<br/>Ready for a real account? <a href="../../login?a=register">Sign up</a> today!</>,
  'drag and drop': 'Drag and drop explanation / Lorem ipsum dolor sit amet consectetur, adipisicing elit. '+'Odio pariatur dolore ad maiores omnis rerum debitis unde nobis, numquam nihil necessitatibus a officia optio quisquam et perferendis error est iure?'

}

export function enableTutorial() {
  if(!sessionStorage.tutorialEnabled) {
    console.log('%cenabling tutorial', 'color: yellow')
    
    sessionStorage.tutorialEnabled = true

    for(const tip in tutorialTips) {
      sessionStorage[tip] = true
    }
  }

  return null
}

export function TutorialDialog({ position, tip }) {
  const [message, setMessage] = useState(() => sessionStorage[tip] ? tutorialTips[tip] : '')
  const isOver = position === 'over'
  const theme = useTheme()

  return !message ? (
    <></>
  ) : (
    <Box
      sx={{
        position: 'absolute',
        zIndex: 3,

        bottom: isOver ? '100%' : undefined,
        top: isOver ? undefined : '5rem',

        backgroundColor: `#ffcd8d`,
        color: '#000',
        borderTop: `2px solid ${theme.palette.secondary.light}`,
        borderLeft: `2px solid ${theme.palette.secondary.light}`,
        borderRight: `2px solid ${theme.palette.secondary.dark}`,
        borderBottom: `2px solid ${theme.palette.secondary.dark}`,
        px: '0.5rem',
        py: '0.25rem',
        width: '52ch',
        height: '6rem',
        mb: isOver ? 2 : undefined,
        ml: 2,
        boxShadow: '0.75rem 0.5rem 3rem #0008',
        overflow: 'hidden',
        '& a': {
          color: '#08a',
          fontWeight: 'bold',
          textDecoration: 'none',
        }
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
        }}
      >
        <CloseIcon />
      </IconButton>
      {message}
    </Box>
  )
}
