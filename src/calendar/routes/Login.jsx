import {
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
import { resumeOrNavigateTo } from '../NavigationControl.jsx'
import { useSearchParams } from 'react-router-dom'
import { enableTutorial } from '../TutorialDialog.jsx'

function LoginSection() {
  const spacing = 4

  const theme = useTheme()
  const [searchParams] = useSearchParams()
  const isRegisterLink = searchParams.get('a') === 'register'
  const [email, setEmail] = useState(isRegisterLink ? '' : 'Demo Account')
  const [displayName, setDisplayName] = useState(isRegisterLink ? '' : ' ')
  const [invalid, setInvalid] = useState(false)
  const [password, setPassword] = useState(isRegisterLink ? '' : '123')
  const [showRegister, setShowRegister] = useState(isRegisterLink)

  const signInRef = useRef(null)
  const sending = false

  const queryClient = useQueryClient()
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
        setInvalid(true)
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
      enableTutorial()
      onLoginSuccess(data)
    },
    onError: error => {
      if (error.status === 403 || error.status === 409) {
        setInvalid(true)
      }
    },
  })

  return (
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
        boxShadow: '0.75rem 1.625rem 1.25rem #00081190',
        borderBottom: '1px solid #0009',
        borderRight: '1px solid #0009',
      }}
    >
      <form onSubmit={e => e.preventDefault()}>
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
              helperText={invalid && showRegister ? 'Already in use.' : ' '}
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
              sx={{ mb: spacing }}
              label="password"
              variant="standard"
              type="password"
              helperText={
                invalid && !showRegister ? 'Invalid email or password.' : ' '
              }
              disabled={sending}
              error={invalid}
              defaultValue={password}
              onChange={e => {
                setPassword(e.target.value)
                setInvalid(false)
              }}
            />
            <Collapse in={showRegister}>
              <TextField
                sx={{ mb: 8, width: '100%' }}
                label="display name"
                variant="standard"
                disabled={sending}
                error={invalid}
                defaultValue={displayName}
                onChange={e => {
                  setDisplayName(e.target.value)
                }}
              />
            </Collapse>

            <Stack spacing={3}>
              <Button
                disabled={loginMutation.isPending || registerMutation.isPending}
                onClick={() => {
                  if (showRegister) {
                    return registerMutation.mutate({
                      email,
                      password,
                      name: displayName,
                    })
                  }
                  loginMutation.mutate({ email, password })
                }}
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
                  setInvalid(false)
                }}
              >
                {showRegister ? 'Back' : 'Register'}
              </Button>
            </Stack>
          </Stack>
        </Container>
      </form>
    </Paper>
  )
}

export function LoginPage() {
  return (
    <ViewContainer>
      <LoginSection />
    </ViewContainer>
  )
}
