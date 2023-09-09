import { styled, Box } from '@mui/material'

const StyledAlternateBox = styled(Box)(() => ({
  '&:nth-of-type(odd)': { backgroundColor: '#0004' },
}))

export function SectionedInterval({
  initial,
  final,
  step,
  children,
  outsideHeight,
  insideHeight,
  onClick
}) {
  const sections = []
  let t = initial
  const t1 = initial.add(...step)
  const stepPercentage = (100 * t1.diff(initial)) / final.diff(initial)
  let n = 0
  while (t.isBefore(final)) {
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
        }}
      >
        {t.format('HH:mm')}
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
      }}
    >
      <div
        style={{
          position: 'relative',
          height: insideHeight,
        }}
      >
        {children}
        {sections}
      </div>
    </div>
  )
}
