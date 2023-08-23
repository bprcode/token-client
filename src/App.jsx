import { useState, useRef } from 'react'
import './App.css'
import {
  useQuery,
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQueryClient,
  QueryCache,
} from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import {
  CssBaseline,
  Container,
  Stack,
  ThemeProvider,
  Backdrop,
  Button,
  Paper,
  useTheme,
  Box,
} from '@mui/material'
import digitalTheme from './blueDigitalTheme'
import TopBar from './TopBar'
import auroraMesh from './assets/aurora-gradient-2.png'
import LoginForm from './LoginForm'
import Notes from './Notes'
import {
  FetchDisplay,
  FetchStatusProvider,
  useWrapFetch,
} from './fetchTimeout.jsx'

const log = console.log.bind(console)
const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onSuccess: result => {
      if (
        result.error &&
        (result.error === 'No identification provided.' ||
          result.error === 'Token expired.')
      ) {
        log('🦆 Cookie expired')
        queryClient.setQueryData(['heartbeat'], '')
      }
      if (!result.error && result.exp && localStorage.lastLogin) {
        const parsed = JSON.parse(localStorage.lastLogin)
        log(
          '🪦 Got new expiry. Updating ',
          parsed.expires,
          ' to ',
          result.exp * 1000,
          ` (${(result.exp * 1000 - parsed.expires) / 1000}s later)`
        )
        localStorage.lastLogin = JSON.stringify({
          ...parsed,
          expires: result.exp * 1000,
        })
      }
    },
  }),
})

const logoutRequest = {
  resource: import.meta.env.VITE_BACKEND + 'login',
  method: 'DELETE',
  credentials: 'include',
}

const identityRequest = {
  resource: import.meta.env.VITE_BACKEND + 'me',
  credentials: 'include',
}

function Wrapp() {
  return (
    <ThemeProvider theme={digitalTheme}>
      <CssBaseline>
        <QueryClientProvider client={queryClient}>
          <FetchStatusProvider>
            <FetchDisplay />
            <App />
          </FetchStatusProvider>
        </QueryClientProvider>
      </CssBaseline>
    </ThemeProvider>
  )
}

function Hero() {
  return (
    <>
      <Box
        sx={{
          position: 'absolute',
          top: '0px',
          backgroundImage: `url(${auroraMesh})`,
          backgroundSize: ['135vh', 'cover'],
          backgroundPosition: 'center',
          height: ['90vh', 'max(20rem, 55vh)'],
          width: '100%',
          zIndex: -1,
        }}
      />
    </>
  )
}

function App() {
  const rememberLoginTime = 1000 * 60 * 1 // debug, recheck
  const [storedLogin, setStoredLogin] = useState(() => {
    const parsed = JSON.parse(localStorage.lastLogin || '{}')
    if (Date.now() < parsed.expires) {
      log('Using stored login: ', parsed)
      return parsed
    }
    log('stored login missing or expired: ', parsed)
    return null
  })
  const theme = useTheme()
  const wrapFetch = useWrapFetch()

  const queryClient = useQueryClient()

  const signInRef = useRef(null)

  const heartbeatQuery = useQuery({
    queryKey: ['heartbeat'],
    queryFn: wrapFetch(identityRequest),
    placeholderData: storedLogin || { notice: 'Awaiting login.' },
    staleTime: rememberLoginTime,
    enabled: !!storedLogin,
  })

  const user =
    heartbeatQuery.data.notice === 'Awaiting login.' ? '' : heartbeatQuery.data

  const logoutMutation = useMutation({
    mutationFn: wrapFetch(logoutRequest),
    onSuccess: async () => {
      log('>> logout success...')
      // Clean up queries
      await queryClient.cancelQueries()
      queryClient.invalidateQueries()
      queryClient.setQueryData(['heartbeat'], '')
      // Clean up local cache
      sessionStorage.clear()
      localStorage.removeItem('lastLogin')
      setStoredLogin(null)
    },
    retry: 3,
  })

  async function applyIdentity(identity) {
    await queryClient.cancelQueries({ queryKey: ['heartbeat'] })
    queryClient.removeQueries({ queryKey: ['note list'] })
    queryClient.removeQueries({ queryKey: ['note'] })

    queryClient.setQueryData(['heartbeat'], identity)
    const now = Date.now()
    localStorage.lastLogin = JSON.stringify({
      ...identity,
      expires: now + identity.ttl,
    })
    setStoredLogin(JSON.parse(localStorage.lastLogin))
    log('setting lastlogin=', JSON.parse(localStorage.lastLogin))
    sessionStorage.idempotentKey = crypto.randomUUID()
    log('🔑 set idempotent key = ', sessionStorage.idempotentKey)
  }

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
        <LoginForm signInRef={signInRef} onIdentify={applyIdentity} />
      </Stack>
    )
  }

  return (
    <>
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
      
      <Backdrop open={!!storedLogin && !user}>
        <Paper
          elevation={5}
          sx={{ p: 3, borderLeft: `4px solid ${theme.palette.primary.main}` }}
        >
          <Stack>
            <div>You have been logged out due to inactivity.</div>
            <Button
              variant="outlined"
              tabIndex={1}
              sx={{ mx: 'auto', mt: '10px', width: '150px' }}
              onClick={e => {
                e.preventDefault()
                log('user=', user)
                localStorage.removeItem('lastLogin')
                setStoredLogin(null)
              }}
            >
              OK
            </Button>
          </Stack>
        </Paper>
      </Backdrop>
      <Container maxWidth="lg">{mainContent}</Container>
      <ReactQueryDevtools initialIsOpen={false} />
    </>
  )
}

export default Wrapp
