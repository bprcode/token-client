import { FormControl, Paper, TextField, Typography } from '@mui/material'
import { useEventStyles, mockPalette } from './mockCalendar.mjs'
import { useState } from 'react'
import { PaletteSelect } from './ColorSelect'
import { EventTypeSelect } from './EventTypeSelect'

export function EventPicker() {
  const eventStyles = useEventStyles()
  const [type, setType] = useState('Custom')
  const [color, setColor] = useState(mockPalette[0])
  const [summary, setSummary] = useState('New Event')

  const typeList = [...eventStyles.keys()].map(s =>
    s !== 'Default' ? s : 'Custom'
  )

  return (
    <Paper
      elevation={2}
      sx={{
        height: '180px',
        width: '100%',
        boxShadow: '0 -0.5rem 2rem #0004',
        borderTop: '1px solid #fff2',
        p: 1,
      }}
    >
      <Typography variant="subtitle2" mb={2}>Tap & drag to create</Typography>

      <EventTypeSelect type={type} onSelect={setType} typeList={typeList} />

      {type === 'Custom' && (
        <>
          <FormControl sx={{ mr: 2, mb: 2 }}>
            <TextField
              label="Event"
              variant="standard"
              value={summary}
              onChange={e => setSummary(e.target.value)}
            />
          </FormControl>

          <PaletteSelect
            color={color}
            onSelect={setColor}
            palette={mockPalette}
          />
        </>
      )}
    </Paper>
  )
}
