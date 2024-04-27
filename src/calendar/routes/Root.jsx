import CircularProgress from '@mui/material/CircularProgress'
import { useContext, useState } from 'react'
import { ToggleMenuContext } from '../LayoutContext'
import { Box, Container } from '@mui/material'
import { Outlet, useNavigation } from 'react-router-dom'
import RouterSidebar from '../RouterSidebar'
import { FetchDisplay } from '../../go-fetch'
import SyncMonitor from '../SyncMonitor'
import { useNavigationControl } from '../NavigationControl'
import { ConflictDisplay } from '../ConflictDisplay'
import bokehImage from '../../assets/bokeh-city.webp'
import { DemoContext } from '../DemoContext'

export const loader = queryClient => async () => {
  return 'unused'
}

function Background() {
  return (
    <Box
      className="background-box"
      sx={{
        zIndex: -9,
        position: 'fixed',
        // Do not use 100vw; causes Chrome horizontal scroll issues:
        width: '100%',
        height: '100vh',
        backgroundImage: `url(${bokehImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: 0.7,
      }}
    />
  )
}

export function Root() {
  const isLive = useContext(DemoContext) === false
  const [expand, setExpand] = useState(false)
  const navigation = useNavigation()
  useNavigationControl()

  return (
    <ToggleMenuContext.Provider value={setExpand}>
      <FetchDisplay />
      <Background />
      <Container
        className="root-container"
        maxWidth="lg"
        disableGutters
        sx={{
          height: '100vh',
        }}
      >
        <Box
          sx={{
            height: '100%',
            display: 'flex',
          }}
        >
          <RouterSidebar expand={expand} />

          <div
            style={{
              flexGrow: 1,
              position: 'relative',
            }}
          >
            {/* SyncMonitor is kept mounted to allow autosave operations
                to continue during navigation. */}
            {isLive && <SyncMonitor />}
            <ConflictDisplay tag="views" />

            {navigation.state === 'loading' && (
              <div
                style={{
                  zIndex: 4,
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(21, 28, 50, 0.28)',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <CircularProgress color="primary" />
              </div>
            )}
            <Outlet />
          </div>
        </Box>
      </Container>
    </ToggleMenuContext.Provider>
  )
}
