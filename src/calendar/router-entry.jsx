import React from 'react'
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { ThemeProvider } from '@mui/material/styles'
import { CssBaseline } from '@mui/material'
import digitalTheme from '../blueDigitalTheme'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import RouterError from './RouterError'
import {Root, loader as rootLoader}  from './routes/Root'
import {Catalog, loader as catalogLoader} from './routes/Catalog'
import { Calendar, loader as calendarLoader } from './routes/Calendar'
import Index from './routes/Index'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { retryCheck } from '../go-fetch'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: retryCheck
    }
  }
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
            path: 'foo',
            element: <div>Foo Element</div>,
          },
          {
            path: 'catalog',
            element: <Catalog />,
            loader: catalogLoader(queryClient),
          },
          {
            path: 'calendar/:id',
            element: <Calendar />,
            loader: calendarLoader,
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
