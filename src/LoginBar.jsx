import { useState } from 'react'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import { Avatar, Container } from '@mui/material'
import DrawIcon from '@mui/icons-material/Draw'
import { TextField } from '@mui/material'

export default function LoginBar({
  onLogin,
  onLogout,
  clearInvalid,
  user,
  sending,
  invalid,
}) {
  const [email, setEmail] = useState('shredman1212@slice.dice')
  const [password, setPassword] = useState('oozy123')

  let interactivity

  if (!user) {
    interactivity = (
      <>
        <TextField
          label="email"
          variant="standard"
          disabled={sending}
          error={invalid}
          sx={{ mr: 3 }}
          defaultValue={email}
          onChange={e => {
            setEmail(e.target.value)
            clearInvalid()
          }}
        />
        <TextField
          label="password"
          variant="standard"
          disabled={sending}
          error={invalid}
          sx={{ mr: 3 }}
          defaultValue={password}
          onChange={e => {
            setPassword(e.target.value)
            clearInvalid()
          }}
        />
        <Button
          variant="contained"
          onClick={() => onLogin({ email, password })}
        >
          Login
        </Button>
      </>
    )
  } else {
    interactivity = (
      <>
        <Avatar alt={user.name} sx={{ mr: 2 }}>
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
    <Box sx={{ flexGrow: 1, borderBottom: '1px solid #f806' }}>
      <AppBar position="static">
        <Container maxWidth="md" disableGutters>
          <Toolbar>
            <IconButton
              size="large"
              edge="start"
              color="inherit"
              aria-label="menu"
              alt="testalt"
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
  )
}
