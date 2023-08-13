import { useState, useRef, useEffect } from 'react'
import {
  Divider,
  Stack,
  Container,
  useTheme,
  TextField,
  Button,
  Paper,
  Typography,
} from '@mui/material'
import { useMutation } from '@tanstack/react-query'
const log = console.log.bind(console)

async function acquireToken({ email, password }) {
  console.log('acquiring token with credentials: ', email, password)
  const response = await fetch(import.meta.env.VITE_BACKEND + 'login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
  })
  return response.json()
}

function parseToken(token) {
  try {
    if (!token) {
      return
    }
    return JSON.parse(atob(token.split('.')[1]))
  } catch (e) {
    return { name: 'Not Authorized 😦' }
  }
}

async function registerUser({ email, password, name }) {
  console.log('attempting to register with: ', email, password, name)
  return fetch(import.meta.env.VITE_BACKEND + 'register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name }),
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
  }).then(response => response.json())
}

function FocusingName({ name, setName, sending, invalid }) {
  const textRef = useRef(null)
  useEffect(() => {
    textRef.current.focus()
  }, [])

  return (
    <TextField
      inputRef={textRef}
      label="display name"
      variant="standard"
      disabled={sending}
      error={invalid}
      defaultValue={name}
      onChange={e => {
        setName(e.target.value)
      }}
    />
  )
}

const LoginForm = function ({ onLogin, onRegistered, signInRef }) {
  const [email, setEmail] = useState('shredman1212@slice.dice')
  const [password, setPassword] = useState('oozy123')
  const [name, setName] = useState('')
  const [newUser, setNewUser] = useState(false)
  const [invalid, setInvalid] = useState(false)
  const theme = useTheme()

  const loginUser = useMutation({
    mutationFn: acquireToken,
    onSuccess: (data, variables, context) => {
      log('☢️🙂 Mutation succeeded with data: ', data)
      if (data.token) {
        const parsed = parseToken(data.token)
        onLogin(parsed)
      } else {
        log("... but the server didn't like it:", data.error)
        onLogin('')
        setInvalid(true)
      }
    },
    onError: (error, variables, context) => {
      log('☢️😡 Mutation failed with error: ', error)
    },
  })

  const registrationMutation = useMutation({
    mutationFn: registerUser,
    onSuccess: data => {
      if (data.error === 'email already in use.') {
        setInvalid(true)
      }
      if (data.token) {
        log('Registered, got a token back')
        const parsed = parseToken(data.token)
        onRegistered(parsed)
      }
      console.log('reg mut good, data=', data)
    },
    onError: error => {
      console.log('bad reg mut, error', error)
    },
  })

  const sending =
    loginUser.status === 'loading' || registrationMutation.status === 'loading'
  let buttons = <></>

  if (newUser) {
    buttons = (
      <Stack spacing={4} pt={4}>
        <Button
          type="submit"
          variant="contained"
          disabled={sending}
          color="secondary"
          onClick={() => registrationMutation.mutate({ email, password, name })}
        >
          Register Now
        </Button>
        <Button
          variant="text"
          disabled={sending}
          color="primary"
          onClick={() => {
            setNewUser(false)
            setInvalid(false)
          }}
        >
          Go Back
        </Button>
      </Stack>
    )
  } else {
    buttons = (
      <Stack spacing={2}>
        <Button
          type="submit"
          variant="contained"
          disabled={sending}
          onClick={() => loginUser.mutate({ email, password })}
        >
          Login
        </Button>
        <Divider sx={{ mb: 3, mt: 3, color: theme.palette.divider }}>
          OR
        </Divider>
        <Button
          variant="contained"
          disabled={sending}
          color="secondary"
          onClick={() => {
            setNewUser(true)
            setInvalid(false)
          }}
        >
          Register
        </Button>
      </Stack>
    )
  }

  return (
    <Paper
      elevation={1}
      sx={{
        py: 6,
        px: 2,
        mb: 8,
        flexGrow: 1,
        minWidth: 300,
        maxWidth: 450,
        ml: 'auto',
      }}
    >
      <form onSubmit={e => e.preventDefault()}>
        <Container>
          <Typography variant="h4" component="h2" sx={{ mb: 1 }}>
            {newUser ? 'Register' : 'Sign In'}
          </Typography>
          <Divider sx={{ mb: 6 }} />
          <Stack spacing={6}>
            <TextField
              inputRef={signInRef}
              label="email"
              helperText={invalid && newUser ? 'Already in use.' : ' '}
              variant="standard"
              disabled={sending}
              error={invalid}
              defaultValue={email}
              onChange={e => {
                setEmail(e.target.value)
                setInvalid(false)
              }}
            />
            <TextField
              label="password"
              variant="standard"
              helperText={
                invalid && !newUser ? 'Invalid email or password.' : ' '
              }
              disabled={sending}
              error={invalid}
              defaultValue={password}
              onChange={e => {
                setPassword(e.target.value)
                setInvalid(false)
              }}
            />
            {newUser && (
              <FocusingName {...{ name, setName, sending, invalid }} />
            )}

            {buttons}
          </Stack>
        </Container>
      </form>
    </Paper>
  )
}

export default LoginForm
