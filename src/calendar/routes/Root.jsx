import CircularProgress from '@mui/material/CircularProgress'
import { useState } from 'react'
import { ToggleMenuContext, useNarrowCheck } from '../LayoutContext.mjs'
import { Box, Container } from '@mui/material'
import { Outlet, useNavigation } from 'react-router-dom'
import RouterSidebar from '../RouterSidebar'
import { FetchDisplay } from '../../go-fetch'
import SyncStatus from '../SyncStatus'
import { useNavigationControl } from '../NavigationControl.jsx'
import { ConflictDisplay } from '../ConflictDisplay'
import bokehImage from '../../assets/bokeh.png'

export const loader = queryClient => async () => {
  return 'unused'
}

function Background() {
  return <Box 
  className="background-box"
  sx={{
    zIndex: -9,
    position: 'absolute',
    // Do not use 100vw; causes Chrome horizontal scroll issues:
    width: '100%',
    height: '100vh',
    backgroundImage: `url(${bokehImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    opacity: 0.5,
  }}/>
}

export function Root() {
  const isNarrow = useNarrowCheck()
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
          // N.B. overflowX: hidden causes a persistent address bar
          // on mobile Y-scrolling.
          // overflowX: isNarrow ? undefined : 'hidden',
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
            {/* SyncStatus is kept mounted to allow autosave operations
                to continue during navigation. */}
            <SyncStatus />
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
