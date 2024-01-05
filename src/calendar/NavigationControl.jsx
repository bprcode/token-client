import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const defaultNav = {
  navigate: () => console.warn(`No navigation controller provided.`),
  navigation: {},
  location: {},
}

const control = { current: defaultNav }

let redirectedFrom = ''

export function navigateTo(route) {
  redirectedFrom =
    control.current.location.pathname + control.current.location.search
  return control.current.navigate(route)
}

export function resumeOrNavigateTo(route) {
  console.log('🏡 resumeOrNavigateTo had redirectedFrom = ', redirectedFrom)
  if(redirectedFrom) {
    control.current.navigate(redirectedFrom)
    redirectedFrom = ''
    return
  }

  return control.current.navigate(route)
}

export function useNavigationControl() {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    console.log('⬆️ subscribing to nav control.')
    control.current = { navigate, location }

    return () => {
      control.current = defaultNav
      console.log('🔽 unsubscribing to nav control.')
    }
  }, [navigate, location])
}
