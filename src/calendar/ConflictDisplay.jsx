import { Box, Fade, Paper, Typography, useTheme } from '@mui/material'
import { clearConflicts, useConflictList } from './reconcile.mjs'
import { useEffect, useState } from 'react'
import { alpha } from '@mui/material/styles'
import { useNarrowCheck } from './LayoutContext.mjs'

export function ConflictDisplay({ tag }) {
  const { palette } = useTheme()
  const [open, setOpen] = useState(false)
  const [lastCount, setLastCount] = useState(0)
  const [key, setKey] = useState(0)
  const conflicts = useConflictList(tag)

  useEffect(() => {
    if (conflicts.length) {
      setOpen(true)
      setKey(Math.random())
      setLastCount(conflicts.length)
      clearConflicts(tag)
    }
  }, [conflicts, tag])

  return (
    <Snapbar key={key} open={open}>
      <Paper
        elevation={0}
        sx={{
          px: 2,
          py: 1.25,
        }}
      >
        <Typography
          variant="subtitle2"
          color={alpha(palette.text.primary, 0.85)}
        >
          {`Updated with ${lastCount} ` +
            `remote change${lastCount > 1 ? 's' : ''}.`}
        </Typography>
      </Paper>
    </Snapbar>
  )
}

function Snapbar({ sx, open, children }) {
  const [show, setShow] = useState(true)
  const isNarrow = useNarrowCheck()

  useEffect(() => {
    const tid = setTimeout(() => {
      setShow(false)
    }, 3000)

    return () => clearTimeout(tid)
  }, [])

  return (
    open && (
      <Box
        sx={{
          pointerEvents: 'none',
          zIndex: 4,
          right: 0,
          bottom: 0,
          mr: 3,
          position: isNarrow ? 'fixed' : 'absolute',
          mb: isNarrow ? '4rem' : '1rem',
          ...sx,
        }}
      >
        <Fade in={show} timeout={{ enter: 250, exit: 1700 }}>
          {children}
        </Fade>
      </Box>
    )
  )
}
