import MenuIcon from '@mui/icons-material/Menu'
import AddCircleOutlinedIcon from '@mui/icons-material/AddCircleOutlined'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import { AppBar, Box, IconButton, Toolbar, useTheme } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useContext } from 'react'
import { ActionContext } from './ActionContext.mjs'

export function ActionBar({ onBehavior }) {
  const action = useContext(ActionContext)
  const theme = useTheme()
  const faintPrimary = alpha(theme.palette.primary.main, 0.2)

  return (
    <>
      <AppBar position="fixed" color="primary" sx={{ top: 'auto', bottom: 0 }}>
        <Toolbar>
          <IconButton aria-label="menu">
            <MenuIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }} />
          <IconButton
            aria-label="rearrange events"
            sx={
              action === 'edit'
                ? {
                    borderRadius: '20%',
                    backgroundColor: faintPrimary,
                    border: `1px solid ${theme.palette.primary.main}`,
                    color: theme.palette.primary.main,
                  }
                : { border: '1px solid transparent' }
            }
            onClick={() => onBehavior('edit')}
          >
            <EditIcon />
          </IconButton>
          <IconButton
            aria-label="delete event"
            sx={
              action === 'delete'
                ? {
                    borderRadius: '20%',
                    backgroundColor: faintPrimary,
                    border: `1px solid ${theme.palette.primary.main}`,
                    color: theme.palette.primary.main,
                  }
                : { border: '1px solid transparent' }
            }
            onClick={() => onBehavior('delete')}
          >
            <DeleteIcon />
          </IconButton>
          <IconButton
            aria-label="create event"
            sx={
              action === 'create'
                ? {
                    borderRadius: '20%',
                    backgroundColor: faintPrimary,
                    border: `1px solid ${theme.palette.primary.main}`,
                    color: theme.palette.primary.main,
                  }
                : { border: '1px solid transparent' }
            }
            onClick={() => onBehavior('create')}
          >
            <AddCircleOutlinedIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Toolbar /> {/* for page bottom padding */}
    </>
  )
}
