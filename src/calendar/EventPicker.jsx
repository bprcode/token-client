import {
  FormControl,
  Paper,
  TextField,
  Typography,
  useTheme,
} from '@mui/material'
import { useEventStyles, usePalette, isDefaultStyle } from './calendarLogic'
import { PaletteSelect } from './ColorSelect'
import { EventTypeSelect } from './EventTypeSelect'

export function EventPicker({ picks, onPick, variant = 'subtitle2' }) {
  const theme = useTheme()
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
          <FormControl sx={{ mr: 2, flexGrow: 1 }}>
            <TextField
              label="Title"
              variant="standard"
              sx={{
                '& .MuiInputBase-input': {
                  ...theme.typography[variant],
                  height: '2rem',
                  pt: '0px',
                  pb: '0px',
                },
                '& .MuiInputLabel-root': {
                  marginTop: '-1px',
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
