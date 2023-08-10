import { useState } from 'react'
import './App.css'
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
} from '@tanstack/react-query'
import {
  Button,
  CssBaseline,
  Container,
  Stack,
  Box,
  createTheme,
  ThemeProvider,
  Paper,
  Card,
  TextField,
  Typography,
  Avatar,
  AppBar,
} from '@mui/material'
import digitalTheme from './blueDigitalTheme'
import LoginBar from './LoginBar'
const log = console.log.bind(console)
const queryClient = new QueryClient()

async function acquireToken({ email, password }) {
  console.log('acquiring token with credentials: ', email, password)
  const response = await fetch('http://localhost:3000/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
  })
  return response.json()
}

function Wrapp() {
  return (
    <ThemeProvider theme={digitalTheme}>
      <CssBaseline>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </CssBaseline>
    </ThemeProvider>
  )
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

function App() {
  const [reply, setReply] = useState('')
  const [user, setUser] = useState('')
  const [invalid, setInvalid] = useState(false)

  const loginUser = useMutation({
    mutationFn: acquireToken,
    onSuccess: (data, variables, context) => {
      log('☢️🙂 Mutation succeeded with data: ', data)
      if (data.token) {
        const parsed = parseToken(data.token)
        setUser(parsed)
      } else {
        log("... but the server didn't like it:", data.error)
        setUser('')
        setInvalid(true)
      }
    },
    onError: (error, variables, context) => {
      log('☢️😡 Mutation failed with error: ', error)
    },
  })

  return (
    <>
      <LoginBar
        user={user}
        invalid={invalid}
        sending={loginUser.isLoading}
        onLogin={({ email, password }) => loginUser.mutate({ email, password })}
        onLogout={() => setUser('')}
        clearInvalid={() => setInvalid(false)}
      />
      <Container maxWidth="md">
        <h1>
          {loginUser.isLoading && 'Mutation is loading'}
          {loginUser.isError && 'Mutation error: ' + loginUser.error}
          {loginUser.isSuccess && 'Mutation successful'}
        </h1>
        <Paper elevation={1} sx={{ p: 2 }}>
          <Typography
            sx={{
              maxWidth: '100%',
              p: 1,
              mb: 2,
              backgroundColor: 'primary.light',
              color: 'primary.contrastText',
              overflowWrap: 'anywhere',
            }}
          >
            {!user && 'Awaiting token.'}{' '}
            {user && 'User: ' + user.name + ', ' + user.email}
          </Typography>

          <Button
            sx={{ mr: 2 }}
            variant="outlined"
            onClick={() => ringServer(setReply)}
          >
            👋 Ring Server
          </Button>
        </Paper>
        <form action="http://localhost:3000/mock" method="post">
          <input type="text" defaultValue={'Some Text Here'}></input>
          <button>Post</button>
        </form>
        <pre>{reply}</pre>
      </Container>
    </>
  )
}

async function tryLogin(onResult) {
  try {
    const response = await fetch('http://localhost:3000/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'shredman1212@slice.dice',
        password: 'oozy123',
      }),
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    })

    response.json().then(json => onResult(json.token))
  } catch (e) {
    onResult('💀 Unable to acquire token.')
  }
}

async function ringServer(onResult) {
  try {
    console.log('I am a placeholder')
    const response = await fetch('http://localhost:3000/ping')
    onResult(await response.text())

    console.log(response)
  } catch (e) {
    console.log('🙁 Network request failed:', e.message)
    onResult('❌ Network request failed.')
  }
}

async function pokeServer(onResult, token) {
  try {
    const response = await fetch('http://localhost:3000/mock', {
      method: 'POST',
      headers: {
        authorization: 'Bearer ' + token,
      },
    })
    onResult(await response.text())
  } catch (e) {
    onResult("🛑 Couldn't post to server.")
  }
}

export default Wrapp
