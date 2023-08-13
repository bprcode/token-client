import { useState, useRef } from 'react'
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
import TopBar from './TopBar'
import auroraMesh from './assets/aurora-gradient-2.png'
import LoginForm from './LoginForm'
import Notes from './Notes'
const log = console.log.bind(console)
const queryClient = new QueryClient()

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
  const [user, setUser] = useState('')

  const signInRef = useRef(null)

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
          onLogin={setUser}
          onRegistered={registrant => setUser(registrant)}
        />
      </Stack>
    )
  }

  return (
    <>
      <TopBar
        user={user}
        onLogout={() => {
          console.log('Setting user to blank')
          setUser('')
        }}
        onGetStarted={() => {
          signInRef.current.scrollIntoView()
          signInRef.current.focus()
        }}
      />
      <Hero />
      <Container maxWidth="lg">{mainContent}</Container>
    </>
  )
}

export default Wrapp
