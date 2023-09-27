import { Box } from '@mui/material'
import { gradualShades } from '../blueDigitalTheme'

export function SectionedInterval({
  initial,
  final,
  step,
  children,
  outsideHeight,
  insideHeight,
  onClick,
  onPointerDown,
  onPointerUp,
  endMargin = '8rem',
  lockScroll,
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
          backgroundColor: gradualShades(j),
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
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onClick={onClick}
      style={{
        paddingTop: '1.5rem',
        paddingBottom: '1.5rem',
        overflowY: 'auto',
        height: outsideHeight,
        userSelect: 'none',
        WebkitUserSelect: 'none',
        backgroundColor: `hsl(190deg 8% 10%)`,
      }}
    >
      <Box
        sx={{
          zIndex: 1,
          position: 'relative',
          height: insideHeight,
          paddingLeft: ['0.5rem', '5rem'],
          paddingRight: '0.5rem',
          marginBottom: endMargin,
          touchAction: lockScroll ? 'none' : undefined,
        }}
      >
        {children}
        {sections}
      </Box>
      <div
        style={{
          zIndex: 0,
          backgroundImage:
            'radial-gradient(70% 120% at bottom right, '
            +'hsl(190deg 8% 12%) 30%, transparent 150%)',
          position: 'absolute',
          bottom: 0,
          height: endMargin,
          width: '100%',
        }}
      >
        foo
      </div>
    </div>
  )
}
