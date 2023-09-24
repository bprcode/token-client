import { Box } from '@mui/material'
import { sunriseColor } from '../blueDigitalTheme'
import skyTexture from '../assets/sky512-transparent2.png'

export function SectionedInterval({
  initial,
  final,
  step,
  children,
  outsideHeight,
  insideHeight,
  onClick,
}) {
  const sections = []
  let t = initial
  const t1 = initial.add(...step)
  const stepPercentage = (100 * t1.diff(initial)) / final.diff(initial)
  let n = 0
  let j = -1
  while (t.isBefore(final)) {
    j++
    sections.push(
      <div
        key={sections.length}
        style={{
          position: 'absolute',
          top: `${n * stepPercentage}%`,
          left: 0,
          height: stepPercentage + '%',
          width: '100%',
          color: '#fff4',
          backgroundColor: sunriseColor(j),
          // mixBlendMode: 'hue',
        }}
      >
        <span
          style={{
            paddingLeft: '0.25rem',
            fontSize: '0.875em',
          }}
        >
          {t.format('h:mm A')}
        </span>
      </div>
    )
    t = t.add(...step)
    n++
  }

  return (
    <div
      onClick={onClick}
      style={{
        paddingTop: '1.5rem',
        paddingBottom: '1.5rem',
        overflowY: 'auto',
        height: outsideHeight,
        userSelect: 'none',
        WebkitUserSelect: 'none',

      }}
    >
      <Box
        sx={{
          position: 'relative',
          height: insideHeight,
          paddingLeft: ['0.5rem', '5rem'],
          paddingRight: '0.5rem',
          marginBottom: '8rem',

          
        }}
      >
        {children}
        {sections}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',

          backgroundImage: `url(${skyTexture})`,
          backgroundSize: 'cover',
          mixBlendMode: 'multiply',
        }}/>
      </Box>
    </div>
  )
}
