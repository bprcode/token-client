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
import {
  useCallback,
  useContext,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react'
import dayjs from 'dayjs'
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import { AbbreviatedBreakdown } from './AbbreviatedBreakdown'
import { log } from './log.mjs'
import { weekdayAbbreviations } from './calendarLogic.mjs'
import { HoverableBox, alternatingShades } from './blueDigitalTheme'
import { ViewHeader } from './ViewHeader'
import { ViewContainer } from './ViewContainer'
import { useViewQuery } from './routes/Calendar'
import { useNarrowCheck } from './LayoutContext.mjs'
import { DemoContext } from './DemoContext.mjs'
import { TutorialDialog, removeTutorialStage } from './TutorialDialog'
import { bounceEarly, debounce } from '../debounce.mjs'

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
        paddingBottom: '0rem',
        borderTop: '1px solid #aaf3',
      }}
    >
      {weekdayAbbreviations.map((abbr, j) => (
        <div
          key={abbr}
          style={{
            backgroundColor: alternatingShades(j - 1, 0.6),
          }}
        >
          <Box sx={{ ml: ['1px', 1], opacity: 0.85 }}>{abbr}</Box>
        </div>
      ))}
    </Box>
  )
}

function MonthGrid({ date, events }) {
  const activeDay = date.date()
  const activeMonth = date.month()
  const activeYear = date.year()

  return useMemo(() => {
    const date = dayjs().date(activeDay).month(activeMonth).year(activeYear)
    log(
      `🧮 (${(Math.random() * 1000).toFixed()}) memoizing grid calendar (${
        events.length
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
            <AbbreviatedBreakdown day={day} unfilteredEvents={events} />
          </Box>
        )
      }
      rows.push(
        <HoverableBox
          className="week-box"
          data-week={days[i].toString()}
          key={i}
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
          }}
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
  }, [activeDay, activeMonth, activeYear, events])
}

function MonthHeader({ date, onChange }) {
  const month = date.format('M')
  const year = date.year()
  const inputRef = useRef()
  const [yearInput, setYearInput] = useState(String(year))

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
        aria-label="previous month"
        onPointerDown={() =>
          onChange(date.subtract(1, 'month').startOf('month'))
        }
        sx={{
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
        onPointerDown={() => onChange(date.add(1, 'month'))}
        sx={{
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
        ref={inputRef}
        freeSolo
        disableClearable
        options={yearOptions}
        value={String(year)}
        onChange={(event, newValue) => {
          console.log('onChange newValue=', newValue)
          onChange(date.year(newValue.label || newValue))
        }}
        inputValue={yearInput}
        onInputChange={(event, newInputValue, reason) => {
          console.log('%coic reason:', 'color:limegreen', reason)
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
          console.log('yearInput comparison', yearInput, newInputValue)
          setYearInput(newInputValue)
          if (reason === 'input') {
            debounce(
              'read year input',
              () => {
                if (!inputRef.current) {
                  console.log('skipping ryi read')
                  return
                }
                console.log('bounce landing for ryi')
                const input = inputRef.current.querySelector('input')
                console.log('ref check:', input.value)
                onChange(date.year(input.value))
              },
              2000
            )()
          }
        }}
        onBlur={() => bounceEarly('read year input')}
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

export function MonthlyView({ date, onChange, onExpand }) {
  const [shouldDismount, dismount] = useReducer(() => true, false)
  const touchRef = useRef({})
  const { data: events } = useViewQuery()
  const isNarrow = useNarrowCheck()
  const isDemo = useContext(DemoContext)

  const onExpandCallback = useCallback(
    d => {
      removeTutorialStage('expand a week')
      dismount()
      onExpand(d)
    },
    [onExpand]
  )

  console.log('%cMonthlyView rendering', 'color:#08f', date.toString())
  if (shouldDismount) {
    console.log('%cdismounting monthly view', 'color:#08f')
    return <></>
  }

  return (
    <ViewContainer containOverflow={!isNarrow}>
      <MonthHeader date={date} onChange={onChange} />
      <TutorialDialog tip="expand a week" position="right" />

      <Stack
        direction="column"
        sx={{
          mt: [0, 2],
          pr: 1,
          pl: isNarrow ? 1 : 4,
          // blank space for address bar drag-hide:
          mb: 'max(calc(100lvh - 100svh), 2rem)',
          flexGrow: 1,
          alignItems: isNarrow ? 'center' : 'start',
        }}
      >
        <Box
          sx={{
            width: '100%',
            maxWidth: '856px',
            marginTop: [1, 2],
            boxShadow: '0.75rem 1.25rem 1.5rem #00081190',
            borderBottom: '1px solid #000a',
            borderRight: '1px solid #0009',
          }}
          onClick={e => {
            console.log('onClick', Date.now())
            const weekBox = e.target.closest('.week-box')
            if (weekBox) {
              onExpandCallback(dayjs(weekBox.dataset.week))
              weekBox.classList.add('tapped')
            }
          }}
          onTouchStart={e => {
            console.log('touchStart', Date.now())
            const weekBox = e.target.closest('.week-box')
            if (weekBox) {
              touchRef.current.lastTapped = weekBox
              weekBox.classList.add('tapped')
            }
          }}
          onTouchEnd={() => {
            console.log('touchend', Date.now())
            if (touchRef.current.lastTapped) {
              touchRef.current.lastTapped.classList.remove('tapped')
            }
          }}
        >
          <GridHeader />
          <MonthGrid date={date} events={events} />
          {isDemo && isNarrow && (
            <TutorialDialog position="right" tip="demo mode" />
          )}
        </Box>
      </Stack>
    </ViewContainer>
  )
}
