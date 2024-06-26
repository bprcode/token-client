import { Box, FormControl, InputLabel, MenuItem, Select } from '@mui/material'
import { useNarrowCheck } from './LayoutContext'

export function PaletteSelect({ color, onSelect, palette, smaller }) {
  const isNarrow = useNarrowCheck()

  return (
    <FormControl sx={{ mb: 2, flexShrink: 0 }}>
      <InputLabel id="color-select-label" sx={{ paddingTop: 1, ml: -1.5 }}>
        Color
      </InputLabel>
      <Select
        labelId="color-select-label"
        value={color}
        onChange={e => onSelect(e.target.value)}
        label="Color"
        variant="standard"
        autoWidth
        sx={{ pl: '0.25rem' }}
      >
        {palette.map(c => (
          <MenuItem key={c} value={c} dense={isNarrow}
          >
            <Box
              sx={{
                backgroundColor: c,
                height: '1.1rem',
                width: [smaller ? '2rem' : '3rem', '2.25rem'],
                borderRadius: ['10%', '2px'],
                transform: 'translateY(2px)'
              }} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}
