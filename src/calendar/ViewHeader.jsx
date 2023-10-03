import { Box, useMediaQuery } from '@mui/material'

export function ViewHeader({ children }) {
  const isNarrow = useMediaQuery('(max-width: 800px)')

  return (<>
    <Box
      component="header"
      sx={{
        backgroundColor: '#1f292bd1',
        backdropFilter: 'blur(3px)',
        position: 'sticky',
        top: 0,
        pt: 0.5,
        pb: 0.5,
        pl: isNarrow ? ['2.5rem', '3.5rem'] : 1,
        height: ['3rem', '4rem'],
        borderBottom: `1px solid #0008`,
        zIndex: 1,
      }}
    >
      {children}
    </Box>
    </>
  )
}
