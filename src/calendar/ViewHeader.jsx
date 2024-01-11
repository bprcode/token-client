import MenuIcon from '@mui/icons-material/Menu'
import { AppBar, IconButton, Toolbar, useMediaQuery } from '@mui/material'
import { useContext, forwardRef } from 'react'
import { ToggleMenuContext, useNarrowCheck } from './LayoutContext.mjs'

const defaultGradient =
  'linear-gradient(50deg, #132b3acc, #1f535aa6 45%, #296b9e00 90%)'

export const ViewHeader = forwardRef(function ViewHeader(
  { children, gradient = defaultGradient },
  ref
) {
  const toggleMenu = useContext(ToggleMenuContext)
  const isNarrow = useNarrowCheck()
  const isWide = useMediaQuery('(min-width:1200px)')
  const disableBlur =
    navigator.userAgent.includes('Mobile') &&
    navigator.userAgent.includes('Firefox')
  const isGradient = isWide && !disableBlur && gradient

  return (
    <AppBar
      ref={ref}
      position="sticky"
      className="view-header"
      sx={{
        boxShadow: 'none',
        borderBottom: isGradient ? `none` : `1px solid #0127`,
        backgroundColor: disableBlur
          ? '#1f292be1'
          : isGradient
          ? 'transparent'
          : '#1f292b81',
        backgroundImage: isGradient ? gradient : 'none',
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
})
