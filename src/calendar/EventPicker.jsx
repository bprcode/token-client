import { FormControl, Paper, TextField, Typography } from '@mui/material'
import { useEventStyles, usePalette, isDefaultStyle } from './mockCalendar.mjs'
import { PaletteSelect } from './ColorSelect'
import { EventTypeSelect } from './EventTypeSelect'

export function EventPicker({ picks, onPick }) {
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
      <Typography variant="subtitle2" mb={2}>
        Tap & drag to create
      </Typography>

      <EventTypeSelect
        type={type}
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
        <>
          <FormControl sx={{ mr: 2, mb: 2 }}>
            <TextField
              label="Event"
              variant="standard"
              value={summary}
              onChange={e => onPick({ ...picks, summary: e.target.value })}
            />
          </FormControl>

          <PaletteSelect
            color={color}
            onSelect={colorId => {
              onPick({ ...picks, colorId })
            }}
            palette={palette}
          />
        </>
      )}
    </Paper>
  )
}
