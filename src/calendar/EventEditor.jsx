import CloseIcon from '@mui/icons-material/Close'
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputAdornment,
  TextField,
  useMediaQuery,
} from '@mui/material'
import { useState } from 'react'
import {
  getAugmentedColor,
  mockPalette,
  resolveColor,
  useEventStyles,
} from './mockCalendar.mjs'
import { ClockPicker } from './ClockPicker'
import { PaletteSelect } from './ColorSelect'
import { EventTypeSelect } from './EventTypeSelect'

export function EventEditor({ onClose, onSave, onDelete, event }) {
  console.log(
    `Event ${event.id} spanning ${event.start.dateTime.format(
      'H:mm:ss'
    )} - ${event.end.dateTime.format('H:mm:ss')}`
  )
  console.log('event has colorId:', event.colorId)

  const [showConfirm, setShowConfirm] = useState(false)

  const sideBySide = useMediaQuery('(min-width: 660px)')
  const [summary, setSummary] = useState(event.summary)
  const [description, setDescription] = useState(event.description || '')
  const [colorPick, setColorPick] = useState(
    mockPalette.includes(event.colorId) ? event.colorId : mockPalette[0]
  )
  const [colorId, setColorId] = useState(event.colorId)

  const [startTime, setStartTime] = useState(event.start.dateTime)
  const [endTime, setEndTime] = useState(event.end.dateTime)

  const typeStyles = []
  const eventStyles = useEventStyles()

  const typeList = [...eventStyles.keys()].filter(k => k !== 'Default')
  typeList.push('Other...')

  for (const [key, value] of eventStyles) {
    typeStyles.push({ key: key === 'Default' ? 'Other...' : key, value })
  }

  const isDefaultStyle =
    eventStyles.has(event.summary) &&
    eventStyles.get(event.summary).accentColor === resolveColor(event.colorId)

  const [type, setType] = useState(isDefaultStyle ? event.summary : 'Other...')

  const titleColor = getAugmentedColor(colorId)

  function isChanged() {
    return (
      summary != event.summary ||
      type !== event.summary ||
      colorId !== event.colorId ||
      description != event.description ||
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
      colorId,
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
          <EventTypeSelect
            type={type}
            typeList={typeList}
            onSelect={v => {
              setType(v)
              setSummary(v)
              setColorId(v === 'Other...' ? colorPick : v)
            }}
          />

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

              <PaletteSelect
                color={colorPick}
                onSelect={s => {
                  setColorPick(s)
                  setColorId(s)
                }}
                palette={mockPalette}
              />
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
      <DialogActions sx={{ px: 3, pt: 0, pb: 2 }}>
        <Button
          variant="outlined"
          sx={{ mr: 2 }}
          onClick={() => {
            onDelete(event.id)
            onClose()
          }}
        >
          Delete
        </Button>
        <Button variant="contained" onClick={save}>
          Save
        </Button>
      </DialogActions>

      <ConfirmDialog open={showConfirm} onDiscard={onClose} onSave={save} />
    </Dialog>
  )
}

function ConfirmDialog({ open, onDiscard, onSave }) {
  return (
    <Dialog open={open} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ pb: 0.5 }}>Save changes?</DialogTitle>
      <Divider />
      <DialogActions sx={{ px: 2, pt: 3, pb: 3, justifyContent: 'center' }}>
        <Button variant="outlined" onClick={onDiscard} sx={{ mr: 2 }}>
          Discard
        </Button>
        <Button variant="contained" onClick={onSave}>
          Save
        </Button>
      </DialogActions>
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
