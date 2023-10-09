import { Box } from '@mui/material'
import { gradualShades } from '../blueDigitalTheme'
import { useLogger } from './Logger'
import { useEffect } from 'react'

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
  header,
}) {
  const logger = useLogger()

  // the following useEffect is solely to fix a Safari bug where scrolling to
  // the end of the page can cause position: sticky elements to disappear.
  useEffect(() => {
    console.log('useEffect draft~')

    const target = document.querySelector('.blue-box')
    const viewHeader = document.querySelector('.view-header')
    const observer = new IntersectionObserver(watchEnd, {
      root: null,
      treshold: 1.0,
    })

    observer.observe(document.querySelector('.blue-box'))
    function watchEnd() {
      logger('observer callback' + Math.random())
      viewHeader.scrollIntoView()
    }

    return () => {
      logger('unobserving')
      observer.unobserve(target)
    }
  }, [logger])

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
            paddingLeft: '0.5rem',
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
      style={{
        width: '100%',
        height: '100%',
        overflowY: 'auto',
      }}
    >
      {header}
      <div
        className="section-outer"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onClick={onClick}
        style={{
          paddingTop: '1.5rem',
          paddingBottom: '1.5rem',
          height: outsideHeight,
          userSelect: 'none',
          WebkitUserSelect: 'none',
          backgroundColor: `hsl(190deg 8% 10%)`,
        }}
      >
        <Box
          className="section-inner"
          sx={{
            zIndex: 1,
            position: 'relative',
            height: insideHeight,
            paddingLeft: ['0.5rem', '5rem'],
            paddingRight: '0.5rem',
            marginBottom: endMargin,
          }}
        >
          {children}
          {sections}
        </Box>
        <div
          className="blue-box"
          style={{
            zIndex: 0,
            backgroundColor: 'blue',
            // backgroundImage:
            //   'radial-gradient(60% 120% at bottom right, '
            //   +'hsl(190deg 8% 12%) 30%, transparent 150%)',
            // position: 'absolute',
            // bottom: 0,
            height: endMargin,
            width: '100%',
          }}
        />
      </div>
    </div>
  )
}
