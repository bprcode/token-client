import EventIcon from '@mui/icons-material/Event'
import { FormControl, InputLabel, MenuItem, Select } from '@mui/material'
import { retrieveColor } from './mockCalendar.mjs'

export function EventTypeSelect({ type, typeList, onSelect }) {
  return (
    <FormControl sx={{ mr: 2, mb: 2 }}>
      <InputLabel id="type-select-label" sx={{ paddingTop: 1, ml: -1.5 }}>
        Type
      </InputLabel>
      <Select
        labelId="type-select-label"
        value={type}
        onChange={e => onSelect(e.target.value)}
        label="Type"
        variant="standard"
        autoWidth
      >
        {typeList.map(t => (
          <MenuItem key={t} value={t}>
            <EventIcon
              sx={{
                position: 'absolute',
                mr: 1,
                color: retrieveColor(t),
              }}
            />
            <span style={{ paddingLeft: '2rem' }}>{t}</span>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}
