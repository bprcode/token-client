import {
  Box,
  Button,
  CircularProgress,
  Collapse,
  Container,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useRef, useState } from 'react'
import { ViewContainer } from '../ViewContainer'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { goFetch } from '../../go-fetch'
import { useTheme } from '@emotion/react'
import { navigateTo, resumeOrNavigateTo } from '../NavigationControl.jsx'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  enableTutorial,
  removeTutorialStage,
  updateTutorial,
} from '../TutorialDialog.jsx'

function LoginSection() {
  const spacing = 4

  const theme = useTheme()
  const [searchParams] = useSearchParams()
  const isRegisterLink = searchParams.get('a') === 'register'
  const [email, setEmail] = useState(isRegisterLink ? '' : 'Demo Account')
  const [displayName, setDisplayName] = useState(isRegisterLink ? '' : ' ')
  const [password, setPassword] = useState(isRegisterLink ? '' : '123')
  const [showRegister, setShowRegister] = useState(isRegisterLink)

  const [validation, setValidation] = useState({})

  const signInRef = useRef(null)
  const sending = false
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const onLoginSuccess = data => {
    console.log('mutation success with data: ', data)
    queryClient.invalidateQueries({ queryKey: ['catalog'] })
    queryClient.setQueryData(['heartbeat'], data)
    resumeOrNavigateTo('/catalog')
  }

  const loginMutation = useMutation({
    mutationFn: ({ email, password }) => {
      queryClient.cancelQueries()

      return goFetch('login', {
        timeout: 7000,
        method: 'POST',
        body: { email: email.trim(), password },
      })
    },
    onSuccess: onLoginSuccess,
    onError: error => {
      if (error.status === 403) {
        setValidation({
          email: ' ',
          password: 'Invalid username or password.',
        })
      }
    },
  })

  const registerMutation = useMutation({
    mutationFn: ({ email, password, name }) => {
      queryClient.cancelQueries()

      return goFetch('register', {
        timeout: 5000,
        method: 'POST',
        body: { email: email.trim(), password, name: name.trim() },
      })
    },
    onSuccess: data => {
      removeTutorialStage('demo mode')
      enableTutorial([
        'expand a week',
        'drag create',
        'drag and drop',
        'daily tabs',
      ])
      updateTutorial(tutorial => {
        // In case the user was mid-demo and decided to register,
        // swap the order of the tutorial steps to fit a blank calendar:
        const dragDrop = tutorial.indexOf('drag and drop')
        const dragCreate = tutorial.indexOf('drag create')
        if (dragDrop > -1 && dragCreate > -1 && dragDrop < dragCreate) {
          console.log('swapping tutorial steps')
          tutorial[dragDrop] = 'drag create'
          tutorial[dragCreate] = 'drag and drop'
        }
        return tutorial
      })

      queryClient.invalidateQueries({ queryKey: ['catalog'] })
      queryClient.setQueryData(['heartbeat'], data)
      navigateTo('/catalog')
    },
    onError: error => {
      if (error.status === 403 || error.status === 409) {
        setValidation({
          email: 'Already in use.',
        })
      }
    },
  })

  const onSubmit = () => {
    const passwordMin = import.meta.env.VITE_ENV === 'development' ? 2 : 8

    if(email.length < 3) {
      return setValidation({
        email: 'E-mail required.'
      })
    }
    if(password.length < passwordMin) {
      return setValidation({
        password: 'Longer password required.'
      })
    }
    if (showRegister) {
      return registerMutation.mutate({
        email,
        password,
        name: displayName,
      })
    }
    loginMutation.mutate({ email, password })
  }

  return (
    <>
      <Paper
        elevation={1}
        sx={{
          py: 6,
          px: 2,
          minWidth: [240, 300],
          maxWidth: 450,
          ml: 'auto',
          mr: 'auto',
          mt: [2, 6],
          mb: 4,
          boxShadow: '0.75rem 1.625rem 1.25rem #00081190',
          borderBottom: '1px solid #0009',
          borderRight: '1px solid #0009',
        }}
      >
        <form
          onSubmit={e => {
            e.preventDefault()
            onSubmit()
          }}
        >
          <Container>
            <Typography variant="h4" component="h2" sx={{ mb: 1 }}>
              {showRegister ? 'Register' : 'Sign In'}
            </Typography>
            <Divider sx={{ mb: spacing }} />
            <Stack>
              <TextField
                sx={{ mb: spacing }}
                inputRef={signInRef}
                label="email"
                helperText={validation.email || ' '}
                variant="standard"
                disabled={sending}
                error={validation.email}
                defaultValue={email}
                onChange={e => {
                  setEmail(e.target.value)
                  setValidation({})
                }}
              />

              <TextField
                sx={{ mb: spacing }}
                label="password"
                variant="standard"
                type="password"
                helperText={validation.password || ' '}
                disabled={sending}
                error={validation.password}
                defaultValue={password}
                onChange={e => {
                  setPassword(e.target.value)
                  setValidation({})
                }}
              />
              <Collapse in={showRegister}>
                <TextField
                  sx={{ mb: 8, width: '100%' }}
                  label="display name"
                  variant="standard"
                  disabled={sending}
                  error={false}
                  defaultValue={displayName}
                  onChange={e => {
                    setDisplayName(e.target.value)
                  }}
                />
              </Collapse>

              <Stack spacing={3}>
                <Button
                  type="submit"
                  disabled={
                    loginMutation.isPending || registerMutation.isPending
                  }
                  variant={showRegister ? 'contained' : 'outlined'}
                >
                  {loginMutation.isPending || registerMutation.isPending ? (
                    <CircularProgress size="1.5rem" />
                  ) : showRegister ? (
                    'Sign Up'
                  ) : (
                    'Sign In'
                  )}
                </Button>

                <Divider sx={{ mb: 3, mt: 3, color: theme.palette.divider }}>
                  OR
                </Divider>
                <Button
                  variant={showRegister ? 'outlined' : 'contained'}
                  disabled={sending}
                  color={showRegister ? 'primary' : 'secondary'}
                  onClick={() => {
                    if (!showRegister) {
                      signInRef.current.focus()
                    }
                    setShowRegister(s => !s)
                    setValidation({})
                  }}
                >
                  {showRegister ? 'Back' : 'Register'}
                </Button>
              </Stack>
            </Stack>
          </Container>
        </form>
      </Paper>

      {!showRegister && (
        <Box
          sx={{
            mt: 'auto',
            mb: 4,
            mx: 'auto',
          }}
        >
          <span>Want a tour?</span>
          <Button
            variant="contained"
            onClick={() => {
              queryClient.invalidateQueries({
                queryKey: ['heartbeat'],
              })
              navigate('/demo')
            }}
            sx={{ ml: [2, 3], backgroundColor: '#8dffb4' }}
          >
            Try a quick demo
          </Button>
        </Box>
      )}
    </>
  )
}

export function LoginPage() {
  return (
    <ViewContainer>
      <LoginSection />
    </ViewContainer>
  )
}
