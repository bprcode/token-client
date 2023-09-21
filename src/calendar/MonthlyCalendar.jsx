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
} from '@mui/material'
import { useMemo, useState } from 'react'
import * as dayjs from 'dayjs'
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import { AbbreviatedBreakdown } from './AbbreviatedBreakdown'
import { log } from './log.mjs'
import { weekdayAbbreviations } from './dateLogic.mjs'

const HoverableBox = styled(Box)(({ theme }) => ({
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}))

const LeanSelector = styled(InputBase)(({ theme }) => ({
  '& .MuiInputBase-input': {
    borderRadius: 4,
    position: 'relative',
    ...theme.typography.h4,
    marginRight: '-1.25rem',
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
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        textAlign: 'left',
        paddingTop: '1.5rem',
        paddingBottom: '1rem',
      }}
    >
      {weekdayAbbreviations.map(a => (
        <div key={a}>{a}</div>
      ))}
    </div>
  )
}

function MonthGrid({ date, onExpand, unfilteredEvents }) {
  return useMemo(() => {
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
        // hsl(191deg 17% 15%)
        const hue = 190 + 0.7*(j%2 ? j : -j)
        // const saturation = (j+1)%2 ? 15 - 1.5*(j%7 + j/7) : 17
        const saturation = 17
        const lightness = 21 - 0.3*(j%7 + j/7) + ((j+1)%2 ? 2 : 0)

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
                  : 0.8,
            }}
          >
            {day.format('D')}
          </Typography>
        )

        week.push(
          <div
            key={day.format('MM D')}
            style={{
              overflow: 'hidden',
              paddingRight: '0.25rem',
              paddingBottom: '0.25rem',
              lineHeight: 1.25,
              backgroundColor: `hsl(${hue}deg ${saturation}% ${lightness}%)`,
            }}
          >
            {numbering}
            <AbbreviatedBreakdown
              day={day}
              unfilteredEvents={unfilteredEvents}
            />
          </div>
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
        }}
      >
        {rows}
      </div>
    )
  }, [date, onExpand, unfilteredEvents])
}

export function MonthlyCalendar({ initialDate, onExpand, unfilteredEvents }) {
  const [active, setActive] = useState(initialDate)
  const month = active.format('M')
  const year = active.year()

  return (
    <Box>
      <Paper elevation={1} sx={{ px: [2, 2], py: [0, 2] }}>
        <Stack direction="row">
          <IconButton
            aria-label="previous month"
            onClick={() => setActive(active.subtract(1, 'month'))}
            sx={{
              position: ['absolute', 'static'],
              top: '1.75rem',
              left: '-0.25rem',
            }}
          >
            <NavigateBeforeIcon />
          </IconButton>

          <Stack direction="column" sx={{ mt: 1, mb: 4, flexGrow: 1 }}>
            <div>
              <FormControl sx={{ mr: 1, mt: 1, ml: [3, 0] }} variant="standard">
                <Select
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

              <Typography
                variant="h4"
                component="span"
                sx={{
                  transform: 'translateY(0.75rem)',
                  display: 'inline-block',
                }}
              >
                {year}
              </Typography>
            </div>
            <div>
              <GridHeader />
              <MonthGrid
                date={active}
                unfilteredEvents={unfilteredEvents}
                onExpand={onExpand}
              />
            </div>
          </Stack>

          <IconButton
            aria-label="next month"
            onClick={() => setActive(active.add(1, 'month'))}
            sx={{
              position: ['absolute', 'static'],
              top: '1.75rem',
              right: '0.25rem',
            }}
          >
            <NavigateNextIcon />
          </IconButton>
        </Stack>
      </Paper>
    </Box>
  )
}
