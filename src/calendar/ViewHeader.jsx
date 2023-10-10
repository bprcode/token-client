import MenuIcon from '@mui/icons-material/Menu'
import { AppBar, IconButton, Toolbar } from '@mui/material'
import { useContext } from 'react'
import { ToggleMenuContext, useNarrowCheck } from './LayoutContext.mjs'

export function ViewHeader({ children }) {
  const toggleMenu = useContext(ToggleMenuContext)
  const isNarrow = useNarrowCheck()
  const disableBlur =
    navigator.userAgent.includes('Mobile') &&
    navigator.userAgent.includes('Firefox')

  return (
    <AppBar
      position="sticky"
      className="view-header"
      sx={{
        boxShadow: 'none',
        borderBottom: `1px solid #0127`,
        backgroundColor: disableBlur ? '#1f292be1' : '#1f292bc1',
        backgroundImage: 'none',
        zIndex: 3,
      }}
    >
      <Toolbar
        sx={{
          backdropFilter: disableBlur ? undefined : 'blur(3px)',
        }}
      >
        {isNarrow && (
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
            onClick={() => toggleMenu(true)}
          >
            <MenuIcon />
          </IconButton>
        )}
        {children}
      </Toolbar>
    </AppBar>
  )
}
