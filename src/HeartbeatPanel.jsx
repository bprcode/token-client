import LogoutIcon from '@mui/icons-material/Logout'
import {
  Box,
  List,
  ListItem,
  useTheme,
  Button,
  Avatar,
  IconButton,
  CircularProgress,
} from '@mui/material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { goFetch } from './go-fetch'

export function useHeartbeatQuery() {
  return useQuery({
    staleTime: 2 * 60 * 1000,
    queryKey: ['heartbeat'],
    queryFn: ({ signal }) => goFetch('me', { signal }),
  })
}

export function HeartbeatPanel({ children }) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const theme = useTheme()

  const loginMutation = useMutation({
    mutationFn: () => {
      queryClient.cancelQueries()

      return goFetch('login', {
        timeout: 5000,
        method: 'POST',
        body: {
          email: 'Demo Account',
          password: '123',
        },
      })
    },
    onSuccess: data => {
      console.log('mutation success with data: ', data)
      queryClient.invalidateQueries({ queryKey: ['catalog'] })
      queryClient.setQueryData(['heartbeat'], data)
      navigate('/catalog')
    },
  })

  const logoutMutation = useMutation({
    mutationFn: () =>
      goFetch('login', {
        timeout: 5000,
        method: 'DELETE',
      }),
    onSuccess: data => {
      console.log('logout mutation yielded ', data)
      queryClient.cancelQueries()
      queryClient.setQueryData(['heartbeat'], null)
      navigate('/login')
    },
  })

  const heartbeatResult = useHeartbeatQuery()

  let interactions = (
    <Box sx={{ mx: 'auto' }}>
      <CircularProgress size="1.75rem" />
    </Box>
  )
  if (!loginMutation.isPending && !logoutMutation.isPending) {
    interactions = heartbeatResult.data?.name ? (
      <>
        <Avatar
          sx={{
            bgcolor: theme.palette.primary.main,
            mr: 1,
            ml: 1,
            width: '30px',
            height: '30px',
          }}
        >
          {heartbeatResult.data.name[0]}
        </Avatar>
        <span
          style={{
            overflow: 'hidden',
            flexGrow: 1,
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            verticalAlign: 'center',
          }}
        >
          {heartbeatResult.data.name}
        </span>
        <IconButton onClick={logoutMutation.mutate}>
          <LogoutIcon />
        </IconButton>
      </>
    ) : (
      <Button
        variant="contained"
        onClick={loginMutation.mutate}
        sx={{ mx: 'auto' }}
      >
        Login Sample User
      </Button>
    )
  }

  return (
    <>
      {heartbeatResult.data && children}
      <List disablePadding sx={{ mt: 'auto' }}>
        <ListItem
          sx={{
            backgroundColor: '#0002',
            py: 1,
            borderTop: '1px solid #0004',
          }}
          disablePadding
        >
          <Box
            sx={{
              width: '100%',
              display: 'flex',
              height: '2.5rem',
              alignItems: 'center',
            }}
          >
            {interactions}
          </Box>
        </ListItem>
      </List>
    </>
  )
}
