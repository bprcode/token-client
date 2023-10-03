import MenuIcon from '@mui/icons-material/Menu'
import { AppBar, IconButton, Toolbar, useMediaQuery } from '@mui/material'
import { DrawerContext } from './LayoutContext.mjs'
import { useContext } from 'react'

export function ViewHeader({ children }) {
  const { setExpanded } = useContext(DrawerContext)
  const isNarrow = useMediaQuery('(max-width: 800px)')

  return (
    <AppBar
      position="sticky"
      sx={{
        boxShadow: 'none',
        borderBottom: `1px solid #0128`,
        backgroundColor: '#1f292bd1',
        backgroundImage: 'none',
        zIndex: 3,
      }}
    >
      <Toolbar
        sx={{
          backdropFilter: 'blur(3px)',
        }}
      >
        {isNarrow && (
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
            onClick={() => setExpanded(x => !x)}
          >
            <MenuIcon />
          </IconButton>
        )}
        {children}
      </Toolbar>
    </AppBar>
  )
}
