import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import { Avatar, Container, useTheme } from '@mui/material'
import { alpha } from '@mui/material/styles'
import DrawIcon from '@mui/icons-material/Draw'

import { ThemeProvider } from '@mui/material'
import { barTheme } from './blueDigitalTheme'
import SpinOrText from './SpinOrText'

export default function TopBar({ onLogout, onGetStarted, isLoggingOut, user }) {
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
          sx={{ mr: 2,
            backgroundColor: theme.palette.secondary.main,
            display: ['none', 'inherit'] }}
        >
          {[...user.name][0]}
        </Avatar>
        <Typography sx={{ display: ['none', 'inherit']}}>
        Welcome, {user.name || user.email}
        </Typography>
        <Button onClick={onLogout} color="secondary" sx={{ ml: 4 }}>
          <SpinOrText spin={isLoggingOut} text="Logout" />
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
                sx={{ display: ['none', 'block']}}
              >
                <DrawIcon />
              </IconButton>
              <Box sx={{flexGrow: 1}}>
              <Typography variant="h6" component="span" fontWeight='bold'>
                Note
              </Typography>
              <Typography variant="h6" component="span" fontWeight='light'>
                Scribbler
              </Typography>
              </Box>

              {interactivity}
            </Toolbar>
          </Container>
        </AppBar>
      </Box>
    </ThemeProvider>
  )
}
