import UploadIcon from '@mui/icons-material/Upload'
import { IconButton, Typography } from '@mui/material'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { goFetch } from '../go-fetch'
import { useReducer } from 'react'

function useUploadMockEvent() {
  function randomIdemKey() {
    return String(Math.floor(Math.random() * 1e9))
  }

  const [idemKey, resetIdemKey] = useReducer(() => randomIdemKey(), null, () => randomIdemKey())

  const timeout = 5000
  const queryClient = useQueryClient()
  const { id } = useParams()
  const endpoint = `calendars/${id}/events`

  const { mutate } = useMutation({
    onMutate: variables => {
      console.log('🟩 mock mutation had variables:', variables, 'and idemkey=', idemKey)
      variables.key = idemKey
      resetIdemKey()
    },
    mutationFn: variables => {
      const datum = queryClient.getQueryData(['calendars', id])[0]
      console.log('key for mutation:', variables.key)
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

  return mutate
}

export function EventSyncStatus() {
  const uploadMockEvent = useUploadMockEvent()

  return (
    <Typography variant="subtitle2" color={'info.main'}>
      Event sync placeholder
      <IconButton onClick={uploadMockEvent}>
        <UploadIcon />
      </IconButton>
    </Typography>
  )
}
