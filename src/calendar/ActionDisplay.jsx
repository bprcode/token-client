// import UndoIcon from '@mui/icons-material/Undo'
import AddCircleOutlinedIcon from '@mui/icons-material/AddCircleOutlined'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import { AppBar, Box, IconButton, Toolbar, useTheme } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useContext } from 'react'
import { ActionContext } from './ActionContext.mjs'

export function ActionButtons({ onBehavior, canUndo }) {
  const action = useContext(ActionContext)
  const theme = useTheme()
  const faintPrimary = alpha(theme.palette.primary.main, 0.2)

  const interactions = [
    { label: 'edit', icon: <EditIcon fontSize="large" /> },
    { label: 'delete', icon: <DeleteIcon fontSize="large" /> },
    { label: 'create', icon: <AddCircleOutlinedIcon fontSize="large" /> },
  ]

  const alignment = { p: 0.5, ml: 1 }
  // undo functionality not yet implemented in a concurrency-tolerant form:
  const undo = <></>
  // const undo = (
  //   <IconButton disabled={!canUndo} onClick={() => onBehavior('undo')}>
  //     <UndoIcon fontSize="large" />
  //   </IconButton>
  // )

  const buttons = interactions.map(i => (
    <IconButton
      key={i.label}
      aria-label={i.label}
      sx={
        action === i.label
          ? {
              borderRadius: '20%',
              backgroundColor: faintPrimary,
              border: `1px solid ${theme.palette.primary.main}`,
              color: theme.palette.primary.main,
              ...alignment,
            }
          : { border: '1px solid transparent', ...alignment }
      }
      onClick={() => onBehavior(i.label)}
    >
      {i.icon}
    </IconButton>
  ))

  return (
    <>
      {undo}
      {buttons}
    </>
  )
}

export function MobileBar({ children }) {
  const disableBlur =
    navigator.userAgent.includes('Mobile') &&
    navigator.userAgent.includes('Firefox')

  return (
    <AppBar
      position="fixed"
      sx={{
        top: 'auto',
        bottom: 0,
        borderTop: '1px solid #fff2',
        backgroundColor: disableBlur ? '#000c' : '#0007',
        backdropFilter: disableBlur ? undefined : 'blur(3px)',
      }}
    >
      <Toolbar>
        <Box sx={{ flexGrow: 1 }} />
        {children}
      </Toolbar>
    </AppBar>
  )
}
