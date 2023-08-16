import { useState, useRef } from 'react'
import './App.css'
import {
  useQuery,
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { CssBaseline, Container, Stack, ThemeProvider } from '@mui/material'
import digitalTheme from './blueDigitalTheme'
import TopBar from './TopBar'
import auroraMesh from './assets/aurora-gradient-2.png'
import LoginForm from './LoginForm'
import Notes from './Notes'
import { fetchTimeout } from './fetchTimeout.mjs'

const log = console.log.bind(console)
const queryClient = new QueryClient()

function fetchLogout({ signal }) {
  return fetchTimeout(import.meta.env.VITE_BACKEND + 'login', {
    method: 'DELETE',
    credentials: 'include',
    signal
  }).then(response => {
    log('delete resolved. returning.')
    return response.json()
  })
}

function fetchCurrentUser({ signal }) {
  return fetchTimeout(import.meta.env.VITE_BACKEND + 'me', {
    credentials: 'include',
    signal,
  }).then(response => response.json())
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
          height: 'max(20rem, 55vh)',
          width: '100%',
          zIndex: -1,
        }}
      />
    </>
  )
}

function App() {
  const rememberLoginTime = 1000 * 60 * 2
  const queryClient = useQueryClient()

  const signInRef = useRef(null)

  const heartbeatQuery = useQuery({
    queryKey: ['heartbeat'],
    queryFn: fetchCurrentUser,
    initialData: () => {
      const lastLogin = JSON.parse(
        localStorage.lastLogin || '{ "error": "No stored login."}'
      )
      if (lastLogin.epoch) {
        log('login age: ', (Date.now() - lastLogin.epoch) / 1000)
      }
      if (lastLogin.epoch && Date.now() - lastLogin.epoch < rememberLoginTime) {
        log('using last login=', lastLogin)

        return lastLogin
      }
      return ''
    },
  })

  const user = heartbeatQuery.data.error ? '' : heartbeatQuery.data

  const logoutMutation = useMutation({
    mutationFn: fetchLogout,
    onSuccess: async () => {
      log('>> logout success...')
      await queryClient.cancelQueries()
      queryClient.setQueryData(['heartbeat'], '')
      localStorage.lastLogin = ''
    },
    retry: 3,
  })

  log('💓 heartbeat result: ', heartbeatQuery.data)

  let mainContent = <></>

  if (user) {
    mainContent = <Notes {...user} />
  } else {
    mainContent = (
      <Stack direction="row" mt={4} sx={{ flexWrap: 'wrap' }}>
        <h1
          style={{
            fontSize: '3.25rem',
            lineHeight: '1.35em',
            letterSpacing: '-0.02em',
            marginRight: '1em',
          }}
        >
          Scribble notes.
          <br />
          Test this placeholder app.
        </h1>
        <LoginForm
          signInRef={signInRef}
          onLogin={async newUser => {
            await queryClient.cancelQueries({ queryKey: ['heartbeat'] })
            queryClient.setQueryData(['heartbeat'], newUser)
            localStorage.lastLogin = JSON.stringify({
              ...newUser,
              epoch: Date.now(),
            })
            log('setting lastlogin=', localStorage.lastLogin)
            log(JSON.parse(localStorage.lastLogin))
          }}
          onRegistered={async registrant => {
            await queryClient.cancelQueries({ queryKey: ['heartbeat'] })
            queryClient.setQueryData(['heartbeat'], registrant)
            localStorage.lastLogin = JSON.stringify({
              ...registrant,
              epoch: Date.now(),
            })
          }}
        />
      </Stack>
    )
  }

  return (
    <>
      {/* <QueryClientProvider client={queryClient}> */}
      <TopBar
        user={user}
        onLogout={logoutMutation.mutate}
        onGetStarted={() => {
          signInRef.current.scrollIntoView()
          signInRef.current.focus()
        }}
        isLoggingOut={logoutMutation.status === 'loading'}
      />
      <Hero />
      <Container maxWidth="lg">{mainContent}</Container>
      {/* <ReactQueryDevtools initialIsOpen={true} /> */}
      {/* </QueryClientProvider> */}
    </>
  )
}

export default Wrapp
