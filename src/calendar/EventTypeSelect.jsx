import EventIcon from '@mui/icons-material/Event'
import { FormControl, InputLabel, MenuItem, Select, Typography } from '@mui/material'
import { resolveColor } from './mockCalendar.mjs'

export function EventTypeSelect({ type, typeList, onSelect, variant = "subtitle2" }) {
  return (
    <FormControl sx={{ mr: 2, mb: 2, flexShrink: 0 }}>
      <InputLabel id="type-select-label" sx={{ pt: 1, ml: -1.5 }}>
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
                color: resolveColor(t),
              }}
            />
            <Typography variant={variant} component="span" pl='2rem'>{t}</Typography>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}
