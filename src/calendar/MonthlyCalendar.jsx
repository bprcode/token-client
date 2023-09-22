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
import { alternatingShades } from '../blueDigitalTheme'

const HoverableBox = styled(Box)(({ theme }) => ({
  '&:hover': {
    // debug -- not working, regression
    backgroundColor: 'red',
    //boxShadow: '0 0 5rem inset magenta',
    // backgroundColor: theme.palette.action.hover,
  },
}))

const LeanSelector = styled(InputBase)(({ theme }) => ({
  '& .MuiInputBase-input': {
    borderRadius: 4,
    position: 'relative',
    marginRight: '-1.25rem',
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

const YearTypography = styled(Box)(({ theme }) => ({
  ...theme.typography.h4,
  [theme.breakpoints.down('sm')]: {
    ...theme.typography.h5,
  },
}))

function GridHeader() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        // textAlign: 'center',
        paddingTop: '0.0rem',
        marginTop: '1.25rem',
        paddingBottom: '0rem',
        borderTop: '1px solid #aaf3',
      }}
    >
      {weekdayAbbreviations.map((a, j) => (
        <div key={a} style={{ 
          backgroundColor: alternatingShades(j-1, 0.6) 
          }}>
            <div style={{marginLeft: '8px', opacity: 0.85}}>
          {a}</div>
        </div>
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
              paddingLeft: ['0.25rem', '0.5rem'],
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
  }, [date, onExpand, unfilteredEvents])
}

export function MonthlyCalendar({ initialDate, onExpand, unfilteredEvents }) {
  const [active, setActive] = useState(initialDate)
  const month = active.format('M')
  const year = active.year()

  return (
    <Box>
      <Paper elevation={1} sx={{ px: [1, 2], py: [0, 2] }}>
        <Stack direction="row" sx={{ maxWidth: '840px', mx: 'auto' }}>
          <IconButton
            aria-label="previous month"
            onClick={() => setActive(active.subtract(1, 'month'))}
            sx={{
              position: ['absolute', 'static'],
              top: '0.75rem',
              left: '-0.25rem',
              borderTopRightRadius: 0,
              borderBottomRightRadius: 0,
            }}
          >
            <NavigateBeforeIcon />
          </IconButton>

          <Stack direction="column" sx={{ mt: [0, 1], mb: 4, flexGrow: 1 }}>
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

              <YearTypography
                component="span"
                sx={{
                  transform: 'translateY(0.75rem)',
                  display: 'inline-block',
                }}
              >
                {year}
              </YearTypography>
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
            onClick={() => setActive(active.add(1, 'month'))}
            sx={{
              position: ['absolute', 'static'],
              top: '0.75rem',
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
