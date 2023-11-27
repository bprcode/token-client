import CircularProgress from '@mui/material/CircularProgress'
import { useState } from 'react'
import { ToggleMenuContext, useNarrowCheck } from '../LayoutContext.mjs'
import { Box, Container } from '@mui/material'
import { Outlet, useNavigation } from 'react-router-dom'
import RouterSidebar from '../RouterSidebar'
import { FetchDisplay } from '../../go-fetch'
import SyncStatus from '../SyncStatus'

export const loader = queryClient => async () => {
  return 'unused'
}

export function Root() {
  const isNarrow = useNarrowCheck()
  const [expand, setExpand] = useState(false)
  const navigation = useNavigation()

  return (
    <ToggleMenuContext.Provider value={setExpand}>
      <FetchDisplay />
      <Container
        className="root-container"
        maxWidth="lg"
        disableGutters
        sx={{
          height: '100vh',
          // N.B. overflowX: hidden causes a persistent address bar
          // on mobile Y-scrolling in the DayPage component.
          overflowX: isNarrow ? undefined : 'hidden',
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
            <SyncStatus />

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
