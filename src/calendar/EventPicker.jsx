import { FormControl, Paper, TextField, Typography } from '@mui/material'
import { useEventStyles, usePalette, isDefaultStyle } from './mockCalendar.mjs'
import { PaletteSelect } from './ColorSelect'
import { EventTypeSelect } from './EventTypeSelect'

export function EventPicker({ picks, onPick, variant = 'subtitle2' }) {
  const palette = usePalette()
  const eventStyles = useEventStyles()
  const typeList = [...eventStyles.keys()].map(s =>
    s !== 'Default' ? s : 'Custom'
  )

  const type = isDefaultStyle(picks, eventStyles) ? picks.summary : 'Custom'
  const color = picks.colorId
  const summary = picks.summary

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
      {/* top */}
      <div style={{ display: 'flex' }}>
        <Typography
          variant={variant}
          mb={2}
          component={'span'}
          sx={{ flexGrow: 1 }}
        >
          Tap & drag to create
        </Typography>
      </div>

      {/* second row */}
      <div style={{ display: 'flex' }}>
        <EventTypeSelect
          type={type}
          variant={variant}
          onSelect={type => {
            onPick({
              ...picks,
              summary: type,
              colorId: type !== 'Custom' ? type : palette[0],
            })
          }}
          typeList={typeList}
        />

        {type === 'Custom' && (
          <FormControl sx={{ mr: 2, mb: 1, flexGrow: 1 }}>
            <TextField
              label="Title"
              variant="standard"
              sx={{
                '& .MuiInputBase-input': {
                  fontSize: t => t.typography[variant],
                },
              }}
              value={summary}
              onChange={e => onPick({ ...picks, summary: e.target.value })}
            />
          </FormControl>
        )}
        {type === 'Custom' && (
          <PaletteSelect
            smaller
            color={color}
            onSelect={colorId => {
              onPick({ ...picks, colorId })
            }}
            palette={palette}
          />
        )}
      </div>
    </Paper>
  )
}
