import UndoIcon from '@mui/icons-material/Undo';
import MenuIcon from '@mui/icons-material/Menu'
import AddCircleOutlinedIcon from '@mui/icons-material/AddCircleOutlined'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import { AppBar, Box, IconButton, Toolbar, useTheme } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useContext } from 'react'
import { ActionContext } from './ActionContext.mjs'
import { LayoutContext } from './LayoutContext.mjs'

export function ActionBar({ onBehavior, canUndo }) {
  const layout = useContext(LayoutContext)
  const action = useContext(ActionContext)
  const theme = useTheme()
  const faintPrimary = alpha(theme.palette.primary.main, 0.2)

  const interactions = [
    { label: 'edit', icon: <EditIcon fontSize="large" /> },
    { label: 'delete', icon: <DeleteIcon fontSize="large" /> },
    { label: 'create', icon: <AddCircleOutlinedIcon fontSize="large" /> },
  ]

  const alignment = { p: 0.5, ml: 1 }
  const undo = <IconButton
  disabled={!canUndo}
    onClick={() => onBehavior('undo')}
  >
    <UndoIcon fontSize="large" />
  </IconButton>

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

  return layout === 'mobile' ? (
    <MobileBar>{undo}{buttons}</MobileBar>
  ) : (
    <SideBar>{undo}{buttons}</SideBar>
  )
}

function SideBar({ children }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        rowGap: '1rem',
        position: 'absolute',
        right: '8px',
        top: '8px',
        zIndex: 3,
      }}
    >
      {children}
    </Box>
  )
}

function MobileBar({ children }) {
  return (
    <AppBar
      position="fixed"
      sx={{
        top: 'auto',
        bottom: 0,
        borderTop: '1px solid #fff2',
        backgroundColor: '#0007',
        backdropFilter: 'blur(3px)',
      }}
    >
      <Toolbar>
        <IconButton aria-label="menu">
          <MenuIcon fontSize="large" />
        </IconButton>

        <Box sx={{ flexGrow: 1 }} />

        {children}
      </Toolbar>
    </AppBar>
  )
}
