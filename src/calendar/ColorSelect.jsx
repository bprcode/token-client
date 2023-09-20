import { Box, FormControl, InputLabel, MenuItem, Select } from '@mui/material'
import { useContext } from 'react'
import { LayoutContext } from './LayoutContext.mjs'

export function PaletteSelect({ color, onSelect, palette }) {
  const isMobile = useContext(LayoutContext) === 'mobile'

  return (
    <FormControl sx={{ mr: 2, mb: 2 }}>
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
          <MenuItem key={c} value={c} dense={isMobile}
          >
            <Box
              sx={{
                backgroundColor: c,
                height: '1.25rem',
                width: ['3rem', '2.25rem'],
                borderRadius: ['10%', '2px'],
              }} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}
