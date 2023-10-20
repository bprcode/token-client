import React from 'react'
import { ThemeProvider } from '@mui/material/styles'
import { CssBaseline } from '@mui/material'
import digitalTheme from '../blueDigitalTheme'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import RouterError from './RouterError'
import Root from './routes/Root'
import {Calendar, loader as calendarLoader } from './routes/Calendar'
import Index from './routes/Index'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Root />,
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
        path: 'calendar/:id',
        element: <Calendar />,
        loader: calendarLoader,
      }
    ]
  }]
  },
])

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={digitalTheme}>
      <CssBaseline enableColorScheme>
        <RouterProvider router={router} />
      </CssBaseline>
    </ThemeProvider>
  </React.StrictMode>
)
