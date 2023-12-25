import { Fade, Paper, Snackbar, Typography, useTheme } from '@mui/material'
import { clearConflicts, useConflictList } from './reconcile.mjs'
import { useEffect, useState } from 'react'
import { alpha } from '@mui/material/styles'
import { useNarrowCheck } from './LayoutContext.mjs'

export function ConflictDisplay({tag}) {
  const isNarrow = useNarrowCheck()
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

  // debug -- causes horizontal scroll bar popping on Chrome mobile.
  // todo: make this behave like SyncStatus, which does not have that issue.
  return (
      <Snackbar
        key={key}
        sx={{
          position: isNarrow ? 'fixed' : 'absolute',
          mb: isNarrow ? '4rem' : undefined,
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
