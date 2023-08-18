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
import SpinOrText from './SpinOrText'
import { useWrapFetch } from './fetchTimeout.jsx'

const log = console.log.bind(console)

function loginRequest({email, password}) {
  return {
    resource: import.meta.env.VITE_BACKEND + 'login',
    method: 'POST',
    body: JSON.stringify({ email, password }),
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
    credentials: 'include',
  }
}

function registerRequest({email, password, name}) {
  return {
    resource: import.meta.env.VITE_BACKEND + 'register', 
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      credentials: 'include',
  }
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
  const wrapFetch = useWrapFetch()
  const [email, setEmail] = useState('shredman1212@slice.dice')
  const [password, setPassword] = useState('oozy123')
  const [name, setName] = useState('')
  const [newUser, setNewUser] = useState(false)
  const [invalid, setInvalid] = useState(false)
  const theme = useTheme()

  const loginMutation = useMutation({
    mutationFn: wrapFetch(loginRequest),
    onSuccess: (data, variables, context) => {
      if (data.error) {
        log('⚠️ Server reported error: ', data.error)
        setInvalid(true)
        return
      }

      log('☢️🙂 Mutation succeeded with data: ', data)
      onLogin({ uid: data.uid, name: data.name, email: data.email })
    },
    onError: (error, variables, context) => {
      log('☢️😡 Mutation failed with error: ', error)
    },
    retry: 2,
  })

  const registrationMutation = useMutation({
    mutationFn: wrapFetch(registerRequest),
    onSuccess: data => {
      if (data.error) {
        console.log('Error in server response: ', data.error)
        if (data.error === 'email already in use.') {
          setInvalid(true)
        } else {
          throw Error('Server unavailable')
        }
        return
      }

      console.log('registration mutation succeeded, data=', data)
      onRegistered({ uid: data.uid, name: data.name, email: data.email })
    },
    onError: error => {
      console.log('registration mutation failed, error', error)
    },
    retry: 2,
  })

  const sending =
    loginMutation.status === 'loading' ||
    registrationMutation.status === 'loading'
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
          <SpinOrText spin={sending} text={'Register Now'} />
        </Button>
        {registrationMutation.status === 'error' &&
          'Server unavailable. Try again?'}
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
          onClick={() => loginMutation.mutate({ email, password })}
        >
          <SpinOrText spin={sending} text={'Login'} />
        </Button>
        {loginMutation.status === 'error' && 'Server unavailable. Try again?'}
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
              type="password"
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
