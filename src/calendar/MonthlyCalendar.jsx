import {
  Box,
  IconButton,
  InputBase,
  Paper,
  Stack,
  Typography,
  Select,
  styled,
  FormControl,
  MenuItem,
  Autocomplete,
  TextField,
} from '@mui/material'
import { useMemo, useState } from 'react'
import * as dayjs from 'dayjs'
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import { AbbreviatedBreakdown } from './AbbreviatedBreakdown'
import { log } from './log.mjs'
import { weekdayAbbreviations } from './dateLogic.mjs'
import { HoverableBox, alternatingShades } from '../blueDigitalTheme'

const ResponsiveTextField = styled(TextField)(({ theme }) => ({
  '& .MuiInputBase-input': {
    ...theme.typography.h4,
    [theme.breakpoints.down('sm')]: {
      ...theme.typography.h5,
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
      ...theme.typography.h5,
    },
  },
  '& .MuiSvgIcon-root': {
    display: 'none', // hide dropdown triangle
  },
  '& .MuiInputBase-input:focus': {
    backgroundColor: 'unset',
  },
}))

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
    log(`🧮 (${(Math.random() * 1000).toFixed()}) memoizing grid calendar`)

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

export function MonthlyCalendar({ initialDate, onExpand, unfilteredEvents }) {
  const [active, setActive] = useState(initialDate)
  const month = active.format('M')
  const year = active.year()

  const yearOptions = []
  for (let y = year - 5; y <= year + 5; y++) {
    yearOptions.push({ label: String(y) })
  }

  return (
    <Box>
      <Paper elevation={1} sx={{ px: 1, py: [0, 2] }}>
        <Stack direction="row" sx={{ maxWidth: '840px', mx: 'auto' }}>
          <IconButton
            disableTouchRipple
            aria-label="previous month"
            onClick={() => setActive(active.subtract(1, 'month'))}
            sx={{
              '&:active': { boxShadow: '0px 0px 2rem inset #fff4' },
              position: ['absolute', 'static'],
              top: '0.5rem',
              left: '-0.25rem',
              borderTopRightRadius: 0,
              borderBottomRightRadius: 0,
            }}
          >
            <NavigateBeforeIcon />
          </IconButton>

          <Stack direction="column" sx={{ mt: [0, 1], mb: 4, flexGrow: 1 }}>
            <div>
              <FormControl sx={{ mt: 1, ml: [3, 0] }} variant="standard">
                <Select
                  sx={{
                    '&&& .MuiSelect-select': {
                      paddingRight: 0,
                      marginRight: [1.25, 1.5],
                    },
                  }}
                  value={month}
                  onChange={e => setActive(active.month(e.target.value - 1))}
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
                onChange={(event, newValue) =>
                  setActive(active.year(newValue.label))
                }
                sx={{ width: ['6.5ch', '9ch'], display: 'inline-block' }}
                renderInput={params => (
                  <ResponsiveTextField
                    {...params}
                    sx={{
                      mt: 1,
                      transform: ['translateY(-1px)', 'translateY(-3px)'],
                    }}
                    aria-label="year"
                    variant="standard"
                    onChange={e => {
                      const matched = e.target.value.match(/\d{4}/)
                      if (matched) setActive(active.year(matched[0]))
                    }}
                  />
                )}
              />
            </div>
            <Box>
              <GridHeader />
              <MonthGrid
                date={active}
                unfilteredEvents={unfilteredEvents}
                onExpand={onExpand}
              />
            </Box>
          </Stack>

          <IconButton
            aria-label="next month"
            disableTouchRipple
            onClick={() => setActive(active.add(1, 'month'))}
            sx={{
              '&:active': { boxShadow: '0px 0px 2rem inset #fff4' },
              position: ['absolute', 'static'],
              top: '0.5rem',
              right: '0.25rem',
              borderBottomLeftRadius: 0,
              borderTopLeftRadius: 0,
            }}
          >
            <NavigateNextIcon />
          </IconButton>
        </Stack>
      </Paper>
    </Box>
  )
}
