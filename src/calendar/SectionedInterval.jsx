import { styled, Box } from '@mui/material'
import { sunriseShades } from '../blueDigitalTheme'
import skyTexture from '../assets/sky512.jpg'

const StyledAlternateBox = styled(Box)(() => ({
  '&:nth-of-type(odd)': { backgroundColor: '#0004' },
}))

const RuledBox = styled(Box)(() => ({
  borderTop: `1px solid #fff2`,
  backgroundColor: '#0002',
}))

export function SectionedInterval({
  initial,
  final,
  step,
  children,
  outsideHeight,
  insideHeight,
  onClick,
}) {
  console.log('skyTexture=', skyTexture)
  const sections = []
  let t = initial
  const t1 = initial.add(...step)
  const stepPercentage = (100 * t1.diff(initial)) / final.diff(initial)
  let n = 0
  let j = -1
  while (t.isBefore(final)) {
    j++
    sections.push(
      <StyledAlternateBox
        key={sections.length}
        style={{
          position: 'absolute',
          top: `${n * stepPercentage}%`,
          left: 0,
          height: stepPercentage + '%',
          width: '100%',
          color: '#fff4',
          backgroundColor: sunriseShades(j),
          mixBlendMode: 'multiply',
          //backgroundColor: alternatingShades((j++ % 6), 1.6),
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
      </StyledAlternateBox>
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

          backgroundImage: `url(${skyTexture})`,
          backgroundSize: 'cover',
        }}
      >
        {children}
        {sections}
      </Box>
    </div>
  )
}

export function RuledInterval({
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
  while (t.isBefore(final)) {
    sections.push(
      <RuledBox
        key={sections.length}
        style={{
          position: 'absolute',
          top: `${n * stepPercentage}%`,
          left: 0,
          height: stepPercentage + '%',
          width: '100%',
          color: '#fff4',
        }}
      >
        <span
          style={{
            position: 'absolute',
            transform: 'translateY(-0.75rem)',
            backgroundColor: '#1f2a2d',
            paddingLeft: '0.25rem',
            paddingRight: '0.5rem',
            borderTopRightRadius: '0.5rem',
            fontSize: '0.875em',
          }}
        >
          {t.format('h:mm A')}
        </span>
      </RuledBox>
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
      }}
    >
      <div
        style={{
          position: 'relative',
          height: insideHeight,
          paddingLeft: '5rem',
          paddingRight: '0.5rem',
        }}
      >
        {children}
        {sections}
      </div>
    </div>
  )
}
