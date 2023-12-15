import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const defaultNavigation = () =>
  console.warn(`No navigation controller provided.`)
const control = { current: defaultNavigation }

export function navigateTo(route) {
  return control.current(route)
}

export function useNavigationControl() {
  const navigate = useNavigate()
  useEffect(() => {
    console.log('⬆️ subscribing to nav control.')
    control.current = navigate

    return () => {
      control.current = defaultNavigation
      console.log('🔽 unsubscribing to nav control.')
    }
  }, [navigate])
}
