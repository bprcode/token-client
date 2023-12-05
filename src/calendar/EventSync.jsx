import UploadIcon from '@mui/icons-material/Upload'
import { CircularProgress, IconButton, Typography } from '@mui/material'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useSearchParams } from 'react-router-dom'
import { goFetch } from '../go-fetch'
import { useRef } from 'react'
import { createSampleWeek } from './calendarLogic.mjs'
import dayjs from 'dayjs'

function useUploadMockEvents() {
  const [searchParams] = useSearchParams()

  function randomIdemKey() {
    return String(Math.floor(Math.random() * 1e9))
  }

  const idemKey = useRef(null)
  const timeout = 5000
  const { id } = useParams()
  const endpoint = `calendars/${id}/events`

  const mockEventMutation = useMutation({
    onMutate: variables => {
      idemKey.current = randomIdemKey()
      variables.key = idemKey.current

      // console.log('🟩 mock mutation had variables:', variables)
    },
    mutationFn: variables => {
      const datum = variables
      // console.log('key for mutation:', variables.key)
      return goFetch(endpoint, {
        method: 'POST',
        body: {
          summary: datum.summary,
          description: datum.description,
          start_time: datum.startTime,
          end_time: datum.endTime,
          color_id: datum.colorId,
          key: variables.key,
        },
        timeout,
        // signal,
      })
    },
  })

  const mockEventBundle = useMutation({
    retry: 0,
    onMutate: variables => {
      const d = searchParams.get('d')?.replaceAll('.',':')
      const day = dayjs(d ?? undefined)
      variables.mockEvents = createSampleWeek(day, 10)
    },
    mutationFn: variables => {
      console.log('bundle mockEvents = ', variables.mockEvents)
      return Promise.all(
        variables.mockEvents.map(e => mockEventMutation.mutateAsync({ ...e }))
      )
    },
  })

  return mockEventBundle
}

export function EventSyncStatus() {
  const { mutate, isPending } = useUploadMockEvents()

  return (
    <Typography variant="subtitle2" color={'info.main'}>
      Event sync placeholder
      {isPending ? (
        <CircularProgress size="16px" sx={{ ml: 2 }} />
      ) : (
        <IconButton onClick={mutate}>
          <UploadIcon />
        </IconButton>
      )}
    </Typography>
  )
}
