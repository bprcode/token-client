import {
  Box,
  IconButton,
  InputBase,
  Stack,
  Typography,
  Select,
  styled,
  FormControl,
  MenuItem,
  Autocomplete,
  TextField,
  Paper,
} from '@mui/material'
import { useMemo } from 'react'
import dayjs from 'dayjs'
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import { AbbreviatedBreakdown } from './AbbreviatedBreakdown'
import { log } from './log.mjs'
import { weekdayAbbreviations } from './calendarLogic.mjs'
import { HoverableBox, alternatingShades } from '../blueDigitalTheme'
import { ViewHeader } from './ViewHeader'
import { ViewContainer } from './ViewContainer'

const ResponsiveTextField = styled(TextField)(({ theme }) => ({
  '& .MuiInputBase-input': {
    ...theme.typography.h4,
    [theme.breakpoints.down('sm')]: {
      ...theme.typography.h6,
    },
  },
  '& .MuiInputBase-root::before': {
    border: 'none',
  },
}))

const LeanSelector = styled(InputBase)(({ theme }) => ({
  '& .MuiInputBase-input': {
    borderRadius: 4,
    position: 'relative',
    ...theme.typography.h4,
    [theme.breakpoints.down('sm')]: {
      ...theme.typography.h6,
    },
  },
  '& .MuiInputBase-input:focus': {
    backgroundColor: 'unset',
  },
}))

const DropdownPaper = styled(Paper)({
  boxShadow:
    '0px 5px 5px -3px rgba(0,0,0,0.2),' +
    '0px 8px 10px 1px rgba(0,0,0,0.14),' +
    '0px 3px 14px 2px rgba(0,0,0,0.12)',
  backgroundImage:
    'linear-gradient(rgba(255, 255, 255, 0.12), ' +
    'rgba(255, 255, 255, 0.12))',
  '& li': {
    transform: ['translateX(-0.25rem)', undefined],
  },
})

function GridHeader() {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        paddingTop: '0.0rem',
        marginTop: [1, 2],
        paddingBottom: '0rem',
        borderTop: '1px solid #aaf3',
      }}
    >
      {weekdayAbbreviations.map((a, j) => (
        <div
          key={a}
          style={{
            backgroundColor: alternatingShades(j - 1, 0.6),
          }}
        >
          <Box sx={{ ml: ['1px', 1], opacity: 0.85 }}>{a}</Box>
        </div>
      ))}
    </Box>
  )
}

function MonthGrid({ date, onExpand, unfilteredEvents }) {
  const activeDay = date.date()
  const activeMonth = date.month()
  const activeYear = date.year()

  return useMemo(() => {
    const date = dayjs().date(activeDay).month(activeMonth).year(activeYear)
    log(
      `🧮 (${(Math.random() * 1000).toFixed()}) memoizing grid calendar (${
        unfilteredEvents.length
      })`
    )

    const days = []
    const today = dayjs()
    const startOfMonth = date.startOf('month')
    const endOfMonth = date.endOf('month')

    let d = startOfMonth
    let pad = d.day(0) // first Sunday of the initial week

    // pad out the start of the initial week
    while (pad.isBefore(d)) {
      days.push(pad)
      pad = pad.add(1, 'day')
    }

    while (d.isBefore(endOfMonth)) {
      days.push(d)
      d = d.add(1, 'day')
    }

    // pad until the following Sunday
    while (d.day() !== 0) {
      days.push(d)
      d = d.add(1, 'day')
    }

    const rows = []

    for (let i = 0; i < days.length; i += 7) {
      const week = []
      for (let j = i; j < i + 7; j++) {
        const day = days[j]

        const numbering = day.isSame(today, 'day') ? (
          <Typography
            component="span"
            sx={{
              backgroundColor: 'secondary.main',
              color: 'secondary.contrastText',
              paddingLeft: 0.5,
              paddingRight: 0.5,
              borderRadius: 2,
            }}
          >
            {day.format('D')}
          </Typography>
        ) : (
          <Typography
            component="span"
            sx={{
              opacity:
                day.isBefore(startOfMonth) || day.isAfter(endOfMonth)
                  ? 0.2
                  : 0.85,
            }}
          >
            {day.format('D')}
          </Typography>
        )

        week.push(
          <Box
            key={day.format('MM D')}
            sx={{
              overflow: 'hidden',
              paddingLeft: ['1px', '0.5rem'],
              paddingRight: ['0.25rem', '0.5rem'],
              paddingBottom: '0.25rem',
              lineHeight: 1.25,
              backgroundColor: alternatingShades(j),
            }}
          >
            {numbering}
            <AbbreviatedBreakdown
              day={day}
              unfilteredEvents={unfilteredEvents}
            />
          </Box>
        )
      }
      rows.push(
        <HoverableBox
          key={i}
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
          }}
          onClick={() => onExpand(days[i])}
        >
          {week}
        </HoverableBox>
      )
    }

    return (
      <div
        style={{
          display: 'grid',
          gridAutoRows: '6rem',
          boxShadow: '1rem 1.5rem 2rem #0114',
        }}
      >
        {rows}
      </div>
    )
  }, [activeDay, activeMonth, activeYear, onExpand, unfilteredEvents])
}

function MonthHeader({ date, onChange }) {
  const month = date.format('M')
  const year = date.year()

  const yearOptions = []
  for (let y = year - 5; y <= year + 5; y++) {
    if (y > 0) {
      yearOptions.push({ label: String(y) })
    }
  }

  const leftArrow = (
    <Box
      sx={{
        display: 'inline-flex',
      }}
    >
      <IconButton
        disableTouchRipple
        aria-label="previous month"
        onClick={() => onChange(date.subtract(1, 'month').startOf('month'))}
        sx={{
          '&:active': { boxShadow: '0px 0px 2rem inset #fff4' },
          borderTopRightRadius: 0,
          borderBottomRightRadius: 0,
        }}
      >
        <NavigateBeforeIcon />
      </IconButton>
    </Box>
  )

  const rightArrow = (
    <Box
      sx={{
        display: 'inline-flex',
      }}
    >
      <IconButton
        aria-label="next month"
        disableTouchRipple
        onClick={() => onChange(date.add(1, 'month'))}
        sx={{
          '&:active': { boxShadow: '0px 0px 2rem inset #fff4' },
          borderBottomLeftRadius: 0,
          borderTopLeftRadius: 0,
        }}
      >
        <NavigateNextIcon />
      </IconButton>
    </Box>
  )

  return (
    <ViewHeader>
      {leftArrow}
      <FormControl sx={{ mt: 0, ml: 0 }} variant="standard">
        <Select
          sx={{
            '&&& .MuiSelect-select': {
              paddingRight: 0,
              marginRight: [1.25, 1.5],
              transform: [undefined, 'translateY(4px)'],
            },
          }}
          value={month}
          IconComponent={'div'}
          onChange={e => {
            onChange(date.month(e.target.value - 1))
          }}
          input={<LeanSelector />}
        >
          <MenuItem value={1}>January</MenuItem>
          <MenuItem value={2}>February</MenuItem>
          <MenuItem value={3}>March</MenuItem>
          <MenuItem value={4}>April</MenuItem>
          <MenuItem value={5}>May</MenuItem>
          <MenuItem value={6}>June</MenuItem>
          <MenuItem value={7}>July</MenuItem>
          <MenuItem value={8}>August</MenuItem>
          <MenuItem value={9}>September</MenuItem>
          <MenuItem value={10}>October</MenuItem>
          <MenuItem value={11}>November</MenuItem>
          <MenuItem value={12}>December</MenuItem>
        </Select>
      </FormControl>
      <Autocomplete
        freeSolo
        disableClearable
        options={yearOptions}
        value={String(year)}
        onChange={(event, newValue) => onChange(date.year(newValue.label))}
        inputValue={String(date.year())}
        onInputChange={(event, newInputValue) => {
          if (!event) {
            return
          }
          if (!newInputValue.match(/^\d*$/)) {
            return
          }
          if (newInputValue.length > 4) {
            if (event.target.selectionStart > 4) {
              newInputValue =
                newInputValue.slice(0, 3) + newInputValue.slice(-1)
            } else {
              newInputValue = newInputValue.slice(
                0,
                event.target.selectionStart
              )
            }
          }
          onChange(date.year(String(newInputValue)))
        }}
        sx={{
          width: ['6.5ch', '9.25ch'],
          display: 'inline-flex',
          transform: [undefined, 'translateY(4px)'],
        }}
        PaperComponent={DropdownPaper}
        renderInput={params => (
          <ResponsiveTextField
            {...params}
            sx={{
              overflow: 'visible',
              '& .MuiInputBase-input.MuiInput-input': {
                transform: [
                  'translate(-3px, -2.325px)',
                  'translate(0.5px, -4.2px)',
                ],
                textOverflow: 'unset',
                pb: 0,
                pr: 0,
              },
              '& *::before': {
                ml: ['-3px', 0],
                width: ['5ch', '8.5ch'],
              },
              '& *::after': {
                ml: ['-3px', 0],
                width: ['5ch', '8.5ch'],
              },
            }}
            aria-label="year"
            variant="standard"
          />
        )}
      />
      {rightArrow}
    </ViewHeader>
  )
}

export function MonthlyView({ date, onChange, onExpand, unfilteredEvents }) {
  return (
    <ViewContainer>
      <MonthHeader date={date} onChange={onChange} />
      <Stack
        direction="column"
        sx={{ mt: [0, 1], px: [1, 2], mb: 4, flexGrow: 1 }}
      >
        <GridHeader />
        <MonthGrid
          date={date}
          unfilteredEvents={unfilteredEvents}
          onExpand={onExpand}
        />
      </Stack>
    </ViewContainer>
  )
}
