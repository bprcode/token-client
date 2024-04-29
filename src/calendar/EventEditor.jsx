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
import { useRef, useState, useCallback } from 'react'
import {
  getAugmentedColor,
  isDefaultStyle,
  usePalette,
  useEventStyles,
} from './calendarLogic'
import { ClockPicker } from './ClockPicker'
import { PaletteSelect } from './ColorSelect'
import { EventTypeSelect } from './EventTypeSelect'

export function EventEditor({ onClose, onSave, onDelete, event }) {
  const endDivRef = useRef(null)
  const shadeCallback = useCallback(node => {
    if (!node) {
      if (endDivRef.current) {
        endDivRef.current.observer.unobserve(endDivRef.current.node)
        endDivRef.current = null
      }
      return
    }

    const observer = new IntersectionObserver(entries => {
      for (const e of entries) {
        if (e.isIntersecting) {
          setShowShade(false)
        } else {
          setShowShade(true)
        }
      }
    })

    observer.observe(node)
    endDivRef.current = {
      observer,
      node,
    }
  }, [])

  const [showConfirm, setShowConfirm] = useState(false)

  const sideBySide = useMediaQuery('(min-width: 660px)')
  const [summary, setSummary] = useState(event.summary)
  const [description, setDescription] = useState(event.description || '')

  const palette = usePalette()
  const [colorPick, setColorPick] = useState(() =>
    palette.includes(event.colorId) ? event.colorId : palette[0]
  )
  const [colorId, setColorId] = useState(event.colorId)

  const [startTime, setStartTime] = useState(event.startTime)
  const [endTime, setEndTime] = useState(event.endTime)

  const typeStyles = []
  const eventStyles = useEventStyles()

  const typeList = [...eventStyles.keys()].filter(k => k !== 'Default')
  typeList.push('Other...')

  for (const [key, value] of eventStyles) {
    typeStyles.push({ key: key === 'Default' ? 'Other...' : key, value })
  }

  const [type, setType] = useState(() =>
    isDefaultStyle(event, eventStyles) ? event.summary : 'Other...'
  )

  const titleColor = getAugmentedColor(colorId)

  const [showShade, setShowShade] = useState(true)

  function isChanged() {
    return (
      summary !== event.summary ||
      colorId !== event.colorId ||
      description !== event.description ||
      !startTime.isSame(event.startTime) ||
      !endTime.isSame(event.endTime)
    )
  }

  function save() {
    const firstTime = startTime.isBefore(endTime) ? startTime : endTime
    const secondTime = endTime.isAfter(firstTime) ? endTime : startTime

    onSave({
      summary,
      description,
      colorId,
      startTime: firstTime,
      endTime: secondTime,
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
      sx={{
        // This seemingly pointless filter fixes a Chrome mobile glitch
        // where the dialog otherwise flickers when first rendered:
        filter: 'brightness(100%)',
      }}
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
                palette={palette}
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
        <div
          ref={shadeCallback}
        />
      </DialogContent>
      <DialogActions
        sx={{
          px: 3,
          pt: 1,
          pb: 2,
          boxShadow: `0 -1.5rem 2.5rem 1.5rem #222a31${showShade ? 'ff' : '00'}`,
          transition: 'box-shadow 0.3s ease',
          zIndex: 1,
        }}
      >
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
