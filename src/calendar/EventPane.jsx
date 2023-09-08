import DoubleUpIcon from '@mui/icons-material/KeyboardDoubleArrowUp'
import DoubleDownIcon from '@mui/icons-material/KeyboardDoubleArrowDown'
import { mockStyles } from './mockCalendar.mjs'

export function EventPane({
  initial,
  final,
  event,
  indent = 0,
  columns = 1,
  label = 'detailed',
}) {
  if (!event) return null

  const overflowBefore = event.start.dateTime.isBefore(initial)
  const overflowAfter = event.end.dateTime.isAfter(final)
  // Crop the event duration to fit the window
  const fragmentStart = overflowBefore ? initial : event.start.dateTime
  const fragmentEnd = overflowAfter ? final : event.end.dateTime

  const topOffset = fragmentStart.diff(initial)
  const windowLength = fragmentEnd.diff(fragmentStart)
  const intervalSize = final.diff(initial)

  const referenceStyle =
    mockStyles.get(event.summary) || mockStyles.get('Default')
  const accentColor = referenceStyle.augmentedColors.main
  const shadeColor = referenceStyle.augmentedColors.dark

  const borderStyles =
    label !== 'none'
      ? {
          borderLeft: `0.125rem ${accentColor} solid`,
          borderRight: `0.125rem ${accentColor} solid`,
          borderTop:
            `0.125rem ${accentColor} ` + (overflowBefore ? 'dashed' : 'solid'),
          borderBottom:
            `0.125rem ${accentColor} ` + (overflowAfter ? 'dashed' : 'solid'),
        }
      : {}

  let header = null
  let details = null

  if (label === 'brief') {
    header = event.summary
  }

  if (label === 'detailed') {
    header = event.summary
    details = (
      <div
        style={{
          paddingLeft: '0.25rem',
          paddingRight: '0.25rem',
        }}
      >
        {event.start.dateTime.format('MMM DD HH:mm:ss')} &ndash;{' '}
        {event.end.dateTime.format('MMM DD HH:mm:ss')}
        {event.description && (
          <>
            <br />
            {event.description}
            &mdash;Lorem ipsum dolor sit, amet consectetur adipisicing elit.
            Dolor, qui illum dolorum, quaerat corporis dolores optio
            exercitationem totam perspiciatis libero aliquid provident ullam
            similique aut in temporibus autem eligendi obcaecati vel facere at!
            Temporibus eius, iure voluptatibus est dolorem porro. Adipisci
            blanditiis tempora ad architecto reprehenderit deleniti dolor sunt
            officia?
            <br />
          </>
        )}
      </div>
    )
  }

  const overflowArrows = (
    <>
      {overflowBefore && (
        <div
          style={{
            position: 'absolute',
            left: 'calc(50% - 8px)',
            top: -24,
          }}
        >
          <DoubleUpIcon sx={{ fontSize: 16, mb: -0.5, color: accentColor }} />
        </div>
      )}
      {overflowAfter && (
        <div
          style={{
            position: 'absolute',
            left: 'calc(50% - 8px)',
            top: '100%',
          }}
        >
          <DoubleDownIcon sx={{ fontSize: 16, mb: -0.5, color: accentColor }} />
        </div>
      )}
    </>
  )

  return (
    <>
      <div
        style={{
          position: 'absolute',
          top: (topOffset / intervalSize) * 100 + '%',
          left: indent * (100 / columns) + '%',
          height: (windowLength / intervalSize) * 100 + '%',
          width: 100 / columns + '%',
          zIndex: 1,
        }}
      >
        {overflowArrows}

        {/* Inner container -- overflow hidden */}
        <div
          style={{
            boxShadow: label === 'none' && `0px 0px 2rem ${accentColor} inset`,
            ...borderStyles,
            ...referenceStyle,
            backgroundColor: label === 'detailed' ? '#223' : shadeColor,

            overflow: 'hidden',
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* pane header */}
          <div
            style={{
              backgroundColor: accentColor,
              color: referenceStyle.augmentedColors.contrastText,
              paddingLeft: '0.25rem',
              paddingRight: '0.25rem',
              whiteSpace: 'nowrap',
            }}
          >
            {header}
          </div>
          {/* pane body */}
          {details && (
            <div
              style={{
                display: 'flex',
                flexGrow: 1,
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              {details}

              {event.description && (
                // fade-out overlay to indicate possible overflowing text:
                <div
                  style={{
                    height: '2em',
                    width: '100%',
                    position: 'absolute',
                    bottom: 0,
                    background: 'linear-gradient(to top, #223, transparent)',
                  }}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* drop shadow mock pseudo-element for correct z-indexing: */}
      <div
        style={{
          position: 'absolute',
          top: (topOffset / intervalSize) * 100 + '%',
          left: indent * (100 / columns) + '%',
          height: (windowLength / intervalSize) * 100 + '%',
          width: 100 / columns + '%',
          boxShadow: '0.25rem 0.25rem 0.5rem #0008',
        }}
      />
    </>
  )
}
