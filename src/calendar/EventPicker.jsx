import EventIcon from '@mui/icons-material/Event'
import { FormControl, Paper, TextField, Typography } from '@mui/material'
import { useEventStyles, mockPalette } from './mockCalendar.mjs'
import { useState } from 'react'
import { PaletteSelect } from './ColorSelect'

export function EventPicker() {
  const eventStyles = useEventStyles()
  const [type, setType] = useState('Default')
  const [color, setColor] = useState(mockPalette[0])
  const [summary, setSummary] = useState('New Event')

  const typeStyles = []
  for (const [key, value] of eventStyles) {
    typeStyles.push({ key: key === 'Default' ? 'Other...' : key, value })
  }

  return (
    <Paper
      elevation={2}
      sx={{
        height: '200px',
        width: '100%',
        boxShadow: '0 -0.5rem 2rem #0004',
        borderTop: '1px solid #fff2',
        p: 1,
      }}
    >
      <Typography variant="subtitle2">Add Event</Typography>
      
      <FormControl sx={{ mr: 2, mb: 2 }}>
                <TextField
                  label="Event"
                  variant="standard"
                  value={summary}
                  onChange={e => setSummary(e.target.value)}
                />
              </FormControl>

      <PaletteSelect color={color} onSelect={setColor} palette={mockPalette} />
    </Paper>
  )
}
