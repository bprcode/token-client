import DoubleUpIcon from '@mui/icons-material/KeyboardDoubleArrowUp'
import DoubleDownIcon from '@mui/icons-material/KeyboardDoubleArrowDown'
import AlignTopIcon from '@mui/icons-material/VerticalAlignTop'
import AlignBottomIcon from '@mui/icons-material/VerticalAlignBottom'
import EditIcon from '@mui/icons-material/Edit'
import { mockStyles } from './mockCalendar.mjs'
import { IconButton } from '@mui/material'

const noop = () => {}

function PaneControls({ augmentedColors }) {
  return (
    <>
      <IconButton
        sx={{
          zIndex: -1,
          color: augmentedColors.contrastText,
          backgroundColor: augmentedColors.main,
          position: 'absolute',
          top: '0%',
          left: '50%',
          borderRadius: 0,
          boxShadow: '0.25rem 0.25rem 0.5rem #0008',
          transform: 'translate(-50%, -100%) scale(2)',
          padding: '0 0 0.125rem 0',
          '&:hover': {
            backgroundColor: augmentedColors.light
          }
        }}
      >
        <AlignTopIcon />
      </IconButton>
      <IconButton
        sx={{
          zIndex: -1,
          color: augmentedColors.contrastText,
          backgroundColor: augmentedColors.main,
          position: 'absolute',
          top: '100%',
          left: '50%',
          borderRadius: 0,
          boxShadow: '0.25rem 0.25rem 0.5rem #0008',
          transform: 'translate(-50%, 0%) scale(2)',
          padding: '0 0 0.125rem 0',
          '&:hover': {
            backgroundColor: augmentedColors.light
          }
        }}
      >
        <AlignBottomIcon />
      </IconButton>
    </>
  )
}

export function EventPane({
  initial,
  final,
  event,
  indent = 0,
  columns = 1,
  label = 'detailed',
  selected,
  onSelect = noop,
}) {
  const selectable = label === 'detailed'

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
  const augmentedColors = referenceStyle.augmentedColors
  const verboseBackground = selected && selectable ? '#ddf' : '#223'

  const borderColor = selected ? augmentedColors.light : accentColor

  const borderStyles =
    label !== 'none'
      ? {
          borderLeft: `0.125rem ${borderColor} solid`,
          borderRight: `0.125rem ${borderColor} solid`,
          borderTop:
            `0.125rem ${borderColor} ` + (overflowBefore ? 'dashed' : 'solid'),
          borderBottom:
            `0.125rem ${borderColor} ` + (overflowAfter ? 'dashed' : 'solid'),
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
        onClick={e => {
          if (label !== 'detailed') return
          e.stopPropagation()
          onSelect(event.id)
          console.log('selecting ', event.id)
        }}
        style={{
          position: 'absolute',
          top: (topOffset / intervalSize) * 100 + '%',
          left: indent * (100 / columns) + '%',
          height: (windowLength / intervalSize) * 100 + '%',
          width: 100 / columns + '%',
          zIndex: selected ? 2 : 1,
          
        }}
      >
        {overflowArrows}

        {/* Inner container -- overflow hidden */}
        <div
          style={{
            boxShadow: label === 'none' && `0px 0px 2rem ${accentColor} inset`,
            ...borderStyles,
            ...referenceStyle,
            backgroundColor:
              label === 'detailed' ? verboseBackground : shadeColor,

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
              backgroundColor: selected ? augmentedColors.light : accentColor,
              color: augmentedColors.contrastText,
              paddingLeft: '0.25rem',
              paddingRight: '0.25rem',
              whiteSpace: 'nowrap',
              position: 'relative',
            }}
          >
            {header}
          </div>
          {/* pane body */}
          {selected && <PaneControls augmentedColors={augmentedColors} />}
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

              {/* pencil icon */}
              {selected && <EditIcon
        fontSize="large"
        sx={{
          zIndex: 1,
          color: '#222',
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          borderRadius: '25%',
          scale: '1.25',
          filter: `drop-shadow(0px 0px 8px #fff)`
        }}
      />}

              {event.description && (
                // fade-out overlay to indicate possible overflowing text:
                <div
                  style={{
                    height: '2em',
                    width: '100%',
                    position: 'absolute',
                    bottom: 0,
                    background:
                      `linear-gradient(to top, ` +
                      `${verboseBackground}, transparent)`,
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
          boxShadow: !selected && '0.25rem 0.25rem 0.5rem #0008',
        }}
      />
    </>
  )
}
