import { useQueryClient } from '@tanstack/react-query'
import { Navigate } from 'react-router-dom'

export default function Index() {
  const queryClient = useQueryClient()

  if (queryClient.getQueryData(['heartbeat'])) {
    return <Navigate to="/catalog" />
  }

  return <Navigate to="/login" />
}
