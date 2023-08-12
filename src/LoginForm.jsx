import { useState, forwardRef } from 'react'
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

const LoginForm = function ({
  onLogin,
  onRegister,
  clearInvalid,
  sending,
  invalid,
  focusRef,
}) {
  const [email, setEmail] = useState('shredman1212@slice.dice')
  const [password, setPassword] = useState('oozy123')
  const theme = useTheme()

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
            Sign In
          </Typography>
          <Divider sx={{ mb: 6 }} />
          <Stack spacing={6}>
            <TextField
              inputRef={focusRef}
              label="email"
              variant="standard"
              disabled={sending}
              error={invalid}
              defaultValue={email}
              onChange={e => {
                setEmail(e.target.value)
                clearInvalid()
              }}
            />
            <TextField
              label="password"
              variant="standard"
              helperText={invalid ? 'Invalid email or password.' : ' '}
              disabled={sending}
              error={invalid}
              defaultValue={password}
              onChange={e => {
                setPassword(e.target.value)
                clearInvalid()
              }}
            />

            <Stack spacing={2}>
              <Button
                type="submit"
                variant="contained"
                disabled={sending}
                onClick={() => onLogin({ email, password })}
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
                onClick={() => onRegister({ email, password })}
              >
                Register
              </Button>
            </Stack>
          </Stack>
        </Container>
      </form>
    </Paper>
  )
}

export default LoginForm
