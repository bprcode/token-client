import CloseIcon from '@mui/icons-material/Close'
import EventIcon from '@mui/icons-material/Event'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp'
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import {
  Button,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  useMediaQuery,
} from '@mui/material'
import { useState } from 'react'
import { mockStyles, mockPalette } from './mockCalendar.mjs'
import { ClockPicker } from './ClockPicker'

export function EventEditor({ onClose, event }) {
  const sideBySide = useMediaQuery('(min-width: 660px)')
  const [summary, setSummary] = useState(event && event.summary)
  const [description, setDescription] = useState(
    event && (event.description || '')
  )
  const [color, setColor] = useState(mockPalette[0])
  const [type, setType] = useState((event && event.summary) || 'Default')

  const [startTime, setStartTime] = useState(event.start.dateTime)
  const [endTime, setEndTime] = useState(event.end.dateTime)

  const typeStyles = []
  for (const [key, value] of mockStyles) {
    typeStyles.push({ key: key === 'Default' ? 'New...' : key, value })
  }

  return (
    <Dialog onClose={onClose} open={true}>
      <IconButton
        onClick={onClose}
        sx={{ position: 'absolute', top: 0, right: 0 }}
      >
        <CloseIcon />
      </IconButton>
      <DialogTitle sx={{ pr: 8 }}>Edit Event</DialogTitle>
      <DialogContent sx={{ minWidth: ['70vw', '416px'] }}>
        <div
          style={{ marginBottom: '1rem', display: 'flex', flexWrap: 'wrap' }}
        >
          <FormControl sx={{ mr: 2, mb: 2 }}>
            <InputLabel id="type-select-label" sx={{ paddingTop: 1, ml: -1.5 }}>
              Type
            </InputLabel>
            <Select
              labelId="type-select-label"
              value={type}
              onChange={e => setType(e.target.value)}
              label="Type"
              variant="standard"
              autoWidth
            >
              {typeStyles.map(t => (
                <MenuItem key={t.key} value={t.key}>
                  <EventIcon
                    sx={{
                      position: 'absolute',
                      mr: 1,
                      color: t.value.augmentedColors.main,
                    }}
                  />
                  <span style={{ paddingLeft: '2rem' }}>{t.key}</span>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {type === 'New...' && (
            <>
              <FormControl sx={{ mr: 2, mb: 2 }}>
                <TextField
                  label="Title"
                  variant="standard"
                  value={summary}
                  onChange={e => setSummary(e.target.value)}
                />
              </FormControl>

              <FormControl sx={{ mr: 2, mb: 2 }}>
                <InputLabel
                  id="color-select-label"
                  sx={{ paddingTop: 1, ml: -1.5 }}
                >
                  Color
                </InputLabel>
                <Select
                  labelId="color-select-label"
                  value={color}
                  onChange={e => setColor(e.target.value)}
                  label="Color"
                  variant="standard"
                  autoWidth
                  sx={{ pl: '0.25rem' }}
                >
                  {mockPalette.map(c => (
                    <MenuItem key={c} value={c}>
                      <div
                        style={{
                          backgroundColor: c,
                          height: '1rem',
                          width: '2rem',
                        }}
                      />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </>
          )}
        </div>
        <FormControl
          sx={{
            mr: 2,
            mb: 2,
            width: sideBySide ? '45%' : '100%',
            maxWidth: '300px',
          }}
        >
          <TextField
            label="Start"
            value={startTime.format('dddd, MMM D')}
            sx={{'& .MuiInputBase-root': { p: 0}}}
            InputProps={{
              inputProps: {
                style: { textAlign: 'center' },
              },
              readOnly: true,
              startAdornment: (
                <InputAdornment position="start">
                  <IconButton
                    onClick={() => setStartTime(startTime.subtract(1, 'day'))}
                  >
                    <NavigateBeforeIcon />
                  </IconButton>
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setStartTime(startTime.add(1, 'day'))}
                  >
                    <NavigateNextIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <ClockPicker
            size="100%"
            time={startTime}
            onPick={t => setStartTime(t)}
          />
        </FormControl>

        <FormControl
          sx={{
            mr: 2,
            mb: 2,
            width: sideBySide ? '45%' : '100%',
            maxWidth: '300px',
          }}
        >
          <TextField
            label="End"
            value={endTime.format('dddd, MMM D')}
            sx={{'& .MuiInputBase-root': { p: 0}}}
            InputProps={{
              inputProps: {
                style: { textAlign: 'center' },
              },
              readOnly: true,
              startAdornment: (
                <InputAdornment position="start">
                  <IconButton
                    onClick={() => setEndTime(endTime.subtract(1, 'day'))}
                  >
                    <NavigateBeforeIcon />
                  </IconButton>
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setEndTime(endTime.add(1, 'day'))}>
                    <NavigateNextIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <ClockPicker size="100%" time={endTime} onPick={t => setEndTime(t)} />
        </FormControl>

        <TextField
          label="Description"
          multiline
          minRows={2}
          sx={{ width: '100%' }}
          variant="filled"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button>Save</Button>
      </DialogActions>
    </Dialog>
  )
}
