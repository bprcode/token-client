import { useState } from 'react'
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

export default function LoginForm({
  onLogin,
  onRegister,
  clearInvalid,
  sending,
  invalid,
}) {
  const [email, setEmail] = useState('shredman1212@slice.dice')
  const [password, setPassword] = useState('oozy123')
  const theme = useTheme()

  return (<Paper elevation={1} sx={{ p: 6, maxWidth: 500, mx: 'auto'}}>
    <form>
      <Container maxWidth="xs">
          <Typography variant="h4" component="h2" sx={{mb: 1}}>
            Sign In
          </Typography>
          <Divider sx={{mb: 4}}/>
        <Stack spacing={6}>
          <TextField
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
              variant="contained"
              onClick={() => onLogin({ email, password })}
            >
              Login
            </Button>
            <Divider sx={{ mb: 3, mt: 3, color: theme.palette.divider }}>
              OR
            </Divider>
            <Button
              variant="contained"
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
