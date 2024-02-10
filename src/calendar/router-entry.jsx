import React from 'react'
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { ThemeProvider } from '@mui/material/styles'
import { CssBaseline } from '@mui/material'
import digitalTheme from '../blueDigitalTheme'
import ReactDOM from 'react-dom/client'
import {
  createBrowserRouter,
  Navigate,
  redirect,
  RouterProvider,
} from 'react-router-dom'
import RouterError from './RouterError'
import { Root, loader as rootLoader } from './routes/Root'
import { Catalog, loader as catalogLoader } from './routes/Catalog'
import { Calendar, loader as calendarLoader } from './routes/Calendar'
import { LoginPage } from './routes/Login'
import Index from './routes/Index'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { retryCheck } from '../go-fetch'
import { navigateTo } from './NavigationControl.jsx'
import { DemoContext } from './DemoContext.mjs'
import { TutorialDialog, enableTutorial } from './TutorialDialog.jsx'

const globalExpiryHandler = error => {
  console.log('🌍 global cache error handler:', error.status, error.message)
  if (error.message?.includes('No identification')) {
    console.log('❔ No ID')
    queryClient.setQueryData(['heartbeat'], null)
    queryClient.invalidateQueries({ queryKey: ['heartbeat'] })
    navigateTo(`login`)
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: retryCheck,
    },
    mutations: {
      retry: retryCheck,
    },
  },
  queryCache: new QueryCache({
    onError: globalExpiryHandler,
  }),
  mutationCache: new MutationCache({
    onError: globalExpiryHandler,
  }),
})

const router = createBrowserRouter([
  {
    path: '/',
    element: <Root />,
    loader: rootLoader(queryClient),
    errorElement: <RouterError />,
    children: [
      {
        errorElement: <RouterError />,
        children: [
          {
            index: true,
            element: <Index />,
          },
          {
            path: 'login',
            element: <LoginPage />,
            loader: ({request}) => {
              const searchParams = new URL(request.url).searchParams
              console.log('sp=',searchParams)
              if(searchParams.get('a') === 'register') {
                console.log('register link')
                sessionStorage.clear()
                queryClient.cancelQueries()
                queryClient.clear()
              }
              return null
            }
            
          },
          {
            path: 'catalog',
            element: <Catalog />,
            loader: catalogLoader(queryClient),
          },
          {
            path: 'calendars/:id',
            element: <Calendar />,
            loader: calendarLoader(queryClient),
          },
        ],
      },
    ],
  },
  {
    path: 'demo',
    loader: () => enableTutorial(),
    element: (
      <DemoContext.Provider value={true}>
        <Root />
      </DemoContext.Provider>
    ),
    errorElement: <RouterError />,
    children: [
      {
        errorElement: <RouterError />,
        children: [
          {
            index: true,
            element: <Navigate to="/demo/calendars/demo-calendar" />,
          },

          {
            path: 'login',
            element: <Navigate to="/demo/calendars/demo-calendar" />,
          },
          {
            path: 'calendars/:id',
            element: <Calendar />,
            loader: calendarLoader(queryClient),
          },
        ],
      },
    ],
  },
])

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={digitalTheme}>
        <CssBaseline enableColorScheme>
          <RouterProvider router={router} />
        </CssBaseline>
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>
)
