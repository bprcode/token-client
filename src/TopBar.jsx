import { useState } from 'react'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import {
  Alert,
  Avatar,
  Container,
  FormGroup,
  Snackbar,
  useTheme,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import DrawIcon from '@mui/icons-material/Draw'
import { TextField } from '@mui/material'

import { ThemeProvider } from '@mui/material'
import { barTheme } from './blueDigitalTheme'

export default function TopBar({
  onLogout,
  onGetStarted,
  clearInvalid,
  user,
  sending,
  invalid,
}) {
  const theme = useTheme()

  let interactivity = <></>

  if (!user) {
    interactivity = (
      <>
        <Button variant="contained" onClick={onGetStarted}>
          Get Started
        </Button>
      </>
    )
  } else {
    interactivity = (
      <>
        <Avatar
          alt={user.name}
          sx={{ mr: 2, backgroundColor: theme.palette.secondary.main }}
        >
          {[...user.name][0]}
        </Avatar>
        Welcome, {user.name}{' '}
        <Button onClick={onLogout} color="secondary" sx={{ ml: 4 }}>
          Logout
        </Button>
      </>
    )
  }

  return (
    <ThemeProvider theme={barTheme}>
      <Box
        sx={{
          flexGrow: 1,
          borderBottom: `1px solid ${theme.palette.background.default}`,
        }}
      >
        <AppBar
          position="static"
          sx={{
            backgroundColor: alpha(theme.palette.background.default, 0.3),
            backdropFilter: 'blur(3px)',
          }}
        >
          <Container maxWidth="lg" disableGutters>
            <Toolbar>
              <IconButton
                size="large"
                edge="start"
                color="inherit"
                aria-label="menu"
                alt="writing pencil"
              >
                <DrawIcon />
              </IconButton>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                Note Scribbler
              </Typography>

              {interactivity}
            </Toolbar>
          </Container>
        </AppBar>
      </Box>
    </ThemeProvider>
  )
}
