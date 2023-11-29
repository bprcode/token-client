import {
  Button,
  CircularProgress,
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
import { useNavigate } from 'react-router-dom'

function LoginSection() {
  const [email, setEmail] = useState('Demo Account')
  const [password, setPassword] = useState('123')

  const navigate = useNavigate()
  const signInRef = useRef(null)
  const newUser = false
  const sending = false
  const invalid = false

  const queryClient = useQueryClient()
  const loginMutation = useMutation({
    mutationFn: ({ email, password }) =>
      goFetch('login', {
        timeout: 5000,
        method: 'POST',
        body: { email, password },
      }),
    onSuccess: data => {
      console.log('mutation success with data: ', data)
      queryClient.cancelQueries()
      queryClient.resetQueries()
      queryClient.setQueryData(['heartbeat'], data)
      navigate('/catalog')
    },
  })

  return (
    <Paper
      elevation={1}
      sx={{
        py: 6,
        px: 2,
        flexGrow: 1,
        minWidth: [240, 300],
        maxWidth: 450,
        maxHeight: 500,
        ml: 'auto',
        mr: 'auto',
        mt: [0, 6],
        // mr: ['auto', 0],
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
                // setInvalid(false)
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
                // setInvalid(false)
              }}
            />
            {/* {newUser && (
          <FocusingName {...{ name, setName, sending, invalid }} />
        )} */}

            {/* {buttons} */}
            <Button
              disabled={loginMutation.isPending}
              onClick={() => loginMutation.mutate({ email, password })}
              variant="outlined"
            >
              {loginMutation.isPending ? (
                <CircularProgress size="1.5rem" />
              ) : (
                'Sign In'
              )}
            </Button>
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
