import { keyframes } from '@mui/material/styles'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { bounceEarly, leadingDebounce, hasDebounce } from './debounce.mjs'
import { Box, CircularProgress, Typography } from '@mui/material'

const noop = () => {}
export function Autosaver({
  mutate,
  data,
  isFetching,
  isError,
  getTouchList,
  debounceKey,
  log = noop,
}) {
  const countRef = useRef(1)
  const queryClient = useQueryClient()

  useEffect(() => {
    leadingDebounce(
      debounceKey,
      () => {
        const list = getTouchList(queryClient)
        countRef.current++

        if (list.length > 0) {
          log(`♻️ Autosaving... (check # ${countRef.current})`)
          mutate(list)
        } else {
          log(`✅ Autosaver clean. (check # ${countRef.current})`)
        }
      },
      4000
    )()
  }, [data, queryClient, mutate, log, getTouchList, debounceKey])

  useEffect(() => {
    if (!isFetching && !isError) {
      log(`👁️ fetch success. ${Math.floor(Math.random() * 1000000000)}`)
      if (hasDebounce(debounceKey)) {
        log(`Autosaver already ran or running.`)
        return
      }

      leadingDebounce(
        debounceKey,
        () => {
          const list = getTouchList(queryClient)

          if (list.length > 0) {
            log(`♻️👁️ Fetch sentinel syncing...`)
            mutate(list)
          } else {
            log(`✅👁️ Fetch sentinel clean.`)
          }
        },
        4000
      )()
    }
  }, [queryClient, mutate, isFetching, isError, log, getTouchList, debounceKey])

  useEffect(() => {
    return () => {
      log('🫧 Unmounting autosave effect')
      bounceEarly(debounceKey)
    }
  }, [log, debounceKey])
}

const saveAnimation = keyframes`
  0% {
    opacity: 1.0;
  }
  50% {
    opacity: 0.0;
  }
  100% {
    opacity: 0.0;
  }
`

export function AutosaverStatus({ touchList, isPending, label }) {
  const [show, setShow] = useState(false)
  const isSaved = touchList.length === 0

  useEffect(() => {
    if (!isSaved) {
      return setShow(true)
    }

    const tid = setTimeout(() => {
      setShow(false)
    }, 3000)

    return () => {
      clearTimeout(tid)
    }
  }, [isSaved])

  let color = 'success.main'
  let status = `${label} saved.`

  if (touchList.length > 0) {
    color = 'info.main'
    status = `Unsaved (${touchList.length})`
  }
  if (isPending && touchList.length > 0) {
    color = 'warning.main'
    status = `Saving... (${touchList.length})`
  }

  return (
    <Box
      sx={{
        backgroundColor: '#222a',
        borderRadius: '4px',
        display: show ? 'flex' : 'none',
        justifyContent: 'end',
        padding: '0.5rem 0.75rem',
        animation: isSaved && `${saveAnimation} 2s ease 2s`,
      }}
    >
      <Typography variant="subtitle2" color={color}>
        {status}
      </Typography>
      {isPending && (
        <CircularProgress
          size="18px"
          sx={{ ml: '1rem', color, alignSelf: 'center' }}
        />
      )}
    </Box>
  )
}
