import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const defaultNav = {
  navigate: () => console.warn(`No navigation controller provided.`),
}

const control = { current: defaultNav }
const ignoreList = ['/login', '/login?a=register',]

let redirectedFrom = ''

export function navigateTo(route) {
  const current = window.location.pathname + window.location.search
  if (!ignoreList.includes(current)) {
    redirectedFrom = current
  }

  return control.current.navigate(route)
}

export function resumeOrNavigateTo(route) {
  console.log('🏡 resumeOrNavigateTo had redirectedFrom = ', redirectedFrom)
  if (redirectedFrom) {
    control.current.navigate(redirectedFrom)
    redirectedFrom = ''
    return
  }

  return control.current.navigate(route)
}

export function useNavigationControl() {
  const navigate = useNavigate()

  useEffect(() => {
    console.log('⬆️ subscribing to nav control.')
    control.current = { navigate }

    return () => {
      control.current = defaultNav
      console.log('🔽 unsubscribing to nav control.')
    }
  }, [navigate])
}
