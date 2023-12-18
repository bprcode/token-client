import { Fade, Paper, Snackbar, Typography, useTheme } from '@mui/material'
import { clearConflicts, useConflictList } from './reconcile.mjs'
import { useEffect, useState } from 'react'
import { alpha } from '@mui/material/styles'

export function ConflictDisplay({tag}) {
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
      <Snackbar
        key={key}
        sx={{
          position: 'absolute',
        }}
        TransitionComponent={Fader}
        open={open}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        onClose={() => {
          setOpen(false)
        }}
        autoHideDuration={3000}
      >
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
      </Snackbar>
  )
}

function Fader(props) {
  return <Fade {...props} timeout={{ enter: 250, exit: 1700 }} />
}
