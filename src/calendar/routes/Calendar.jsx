import { Paper, Slide } from '@mui/material'
import { useContext } from 'react'
import { useLoaderData, useParams } from 'react-router-dom'
import { PreferencesContext } from '../PreferencesContext.mjs'
import { createSampleWeek, useEventListHistory } from '../calendarLogic.mjs'
import dayjs from 'dayjs'
import { MonthlyCalendar } from '../MonthlyCalendar'

export function loader({ params }) {
  const data = createSampleWeek(dayjs())

  return new Promise(k => {
    setTimeout(() => k(data), Math.random() * 1500 + 1000)
  })
}

export function Calendar() {
  const params = useParams()
  const loaded = useLoaderData()

  console.log('loaded=', loaded)
  const preferences = useContext(PreferencesContext)
  const [eventListHistory, dispatchEventListHistory] =
    useEventListHistory(loaded)
  const eventList = eventListHistory[eventListHistory.length - 1]
  const dispatchAction = dispatchEventListHistory
  const canUndo = eventListHistory.length > 1

  const currentDate = dayjs()

  console.log('loaded=', loaded)

  return (
    <Paper
      elevation={1}
      sx={{
        height: '100%',
        width: '100%',
        position: 'relative',
      }}
    >
      <Slide
        key={params.id}
        timeout={350}
        in={true}
        direction="left"
        mountOnEnter
        unmountOnExit
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            width: '100%',
            height: '100%',
          }}
        >
          <MonthlyCalendar
            initialDate={currentDate}
            unfilteredEvents={eventList}
            onExpand={date =>
              console.log('placeholder -- expand:', date.format('MMMM DD'))
            }
            // onExpand={date => {
            //   setExpandedDate(date)
            //   setView('week')
            // }}
          />
        </div>
      </Slide>
    </Paper>
  )
}
