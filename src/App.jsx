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
  FormGroup,
  FormControl,
  InputLabel,
  Input,
  Divider,
  Toolbar,
} from '@mui/material'
import digitalTheme from './blueDigitalTheme'
import LoginBar from './LoginBar'
import auroraMesh from './assets/aurora-gradient-2.png'
import LoginForm from './LoginForm'
const log = console.log.bind(console)
const queryClient = new QueryClient()

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

function Hero() {
  return (
    <>
      <div
        style={{
          position: 'absolute',
          top: '0px',
          backgroundImage: `url(${auroraMesh})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          height: '60vh',
          width: '100%',
          zIndex: -1,
        }}
      />
    </>
  )
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
      <Hero />
      <Container maxWidth="md">
          <h1 style={{ fontSize: '3.25rem', lineHeight: '1.35em', letterSpacing: '-0.02em'}}>
            Scribble notes.<br />Test this placeholder app.
          </h1>
          {loginUser.isLoading && 'Mutation is loading'}
          {loginUser.isError && 'Mutation error: ' + loginUser.error}
          {loginUser.isSuccess && 'Mutation successful'}
        
          <LoginForm
          user={user}
          invalid={invalid}
          sending={loginUser.isLoading}
          onLogin={({ email, password }) => loginUser.mutate({ email, password })}
          onLogout={() => setUser('')}
          clearInvalid={() => setInvalid(false)}
          />
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
