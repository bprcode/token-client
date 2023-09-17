import CloseIcon from '@mui/icons-material/Close'
import EventIcon from '@mui/icons-material/Event'
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { useState } from 'react'
import { mockStyles, mockPalette } from './mockCalendar.mjs'
import { ClockPicker } from './ClockPicker'

export function EventEditor({ onClose, onSave, event }) {
  console.log(
    `Event ${event.id} spanning ${event.start.dateTime.format(
      'H:mm:ss'
    )} - ${event.end.dateTime.format('H:mm:ss')}`
  )

  const [showConfirm, setShowConfirm] = useState(false)

  const sideBySide = useMediaQuery('(min-width: 660px)')
  const theme = useTheme()
  const [summary, setSummary] = useState(event && event.summary)
  const [description, setDescription] = useState(
    event && (event.description || '')
  )
  const [color, setColor] = useState(mockPalette[0])
  const augmentedColor = theme.palette.augmentColor({ color: { main: color } })
  const [type, setType] = useState((event && event.summary) || 'Default')

  const [startTime, setStartTime] = useState(event.start.dateTime)
  const [endTime, setEndTime] = useState(event.end.dateTime)

  const typeStyles = []
  for (const [key, value] of mockStyles) {
    typeStyles.push({ key: key === 'Default' ? 'Other...' : key, value })
  }

  const titleColor =
    type === 'Other...'
      ? augmentedColor
      : typeStyles.find(s => s.key === type).value.augmentedColors

  function isChanged() {
    return (
      summary !== event.summary ||
      type !== event.summary ||
      description !== event.description ||
      !startTime.isSame(event.start.dateTime) ||
      !endTime.isSame(event.end.dateTime)
    )
  }

  function save() {
    const firstTime = startTime.isBefore(endTime) ? startTime : endTime
    const secondTime = endTime.isAfter(firstTime) ? endTime : startTime

    onSave({
      summary,
      description,
      start: { dateTime: firstTime },
      end: { dateTime: secondTime },
    })
    onClose()
  }

  return (
    <Dialog
      onClose={() => {
        if (isChanged()) return setShowConfirm(true)
        onClose()
      }}
      open={true}
    >
      <DialogTitle
        sx={{
          pt: 1,
          pb: 1,
          pr: 8,
          backgroundColor: titleColor.main,
          color: titleColor.contrastText,
        }}
      >
        {summary}
      </DialogTitle>

      <IconButton
        onClick={onClose}
        sx={{
          position: 'absolute',
          top: 4,
          right: 8,
          color: titleColor.contrastText,
        }}
      >
        <CloseIcon />
      </IconButton>
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
              onChange={e => {
                setType(e.target.value)
                if (e.target.value !== 'Other...') {
                  setSummary(e.target.value)
                }
              }}
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

          {type === 'Other...' && (
            <span>
              <FormControl sx={{ mr: 2, mb: 2 }}>
                <TextField
                  label="Event"
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
            </span>
          )}
        </div>

        <div
          style={{
            columnGap: '1.25rem',
            display: 'flex',
            justifyContent: sideBySide ? 'space-between' : 'center',
            flexWrap: sideBySide ? 'nowrap' : 'wrap',
          }}
        >
          <ClockControl
            label="Start"
            width={'100%'}
            time={startTime}
            onSet={setStartTime}
          />
          <ClockControl
            label="End"
            width={'100%'}
            time={endTime}
            onSet={setEndTime}
          />
        </div>

        <TextField
          label="Description"
          multiline
          minRows={1}
          sx={{ width: '100%' }}
          variant="filled"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={save}>Save</Button>
      </DialogActions>

      <Dialog open={showConfirm} maxWidth='xs' fullWidth>
          <DialogTitle>Save changes?</DialogTitle>
        <DialogActions sx={{px: 2, pt: 2, pb:3, justifyContent: 'center'}}>
          <Button variant="outlined" onClick={onClose} sx={{mr: 2}}>Discard</Button>
          <Button variant="contained" onClick={save}>Save</Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  )
}

function ClockControl({ width, label, time, onSet }) {
  return (
    <FormControl
      sx={{
        mb: 2,
        width: width,
        maxWidth: '300px',
      }}
    >
      <TextField
        label={label}
        value={time.format('dddd, MMM D')}
        sx={{ '& .MuiInputBase-root': { p: 0 } }}
        InputProps={{
          inputProps: {
            // Beware that setting the padding symmetrically may cause a
            // "jumping" bug in the select item alignment
            style: {
              textAlign: 'center',
              paddingTop: '8px',
              paddingBottom: '12px',
            },
          },
          readOnly: true,
          startAdornment: (
            <InputAdornment position="start">
              <IconButton onClick={() => onSet(time.subtract(1, 'day'))}>
                <NavigateBeforeIcon />
              </IconButton>
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={() => onSet(time.add(1, 'day'))}>
                <NavigateNextIcon />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
      <ClockPicker size="100%" time={time} onPick={t => onSet(t)} />
    </FormControl>
  )
}
