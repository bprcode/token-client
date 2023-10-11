import { Box } from '@mui/material'
import { gradualShades } from '../blueDigitalTheme'
import { useLogger } from './Logger'
import { useEffect, useMemo } from 'react'

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
  action,
  header,
}) {
  const logger = useLogger()

  // the following useEffect is solely to fix a Safari bug where scrolling to
  // the end of the page can cause position: sticky elements to disappear.
  useEffect(() => {
    let skipFirst = true
    const target = document.querySelector('.ending-box')
    const viewHeader = document.querySelector('.view-header')
    const observer = new IntersectionObserver(watchEnd, {
      root: null,
      treshold: 1.0,
    })

    observer.observe(document.querySelector('.ending-box'))
    function watchEnd() {
      if (skipFirst) {
        logger('skipping first observer callback')
        skipFirst = false
        return
      }
      logger('observer callback' + Math.random())
      viewHeader.scrollIntoView()
    }

    return () => {
      logger('unobserving')
      observer.unobserve(target)
    }
  }, [logger])

  const sections = useMemo(() => {
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
    return sections
  }, [initial, final, step])

  return (
    <div
      className="section-scroll"
      style={{
        width: '100%',
        // height: '100%',
        // overflowY: 'auto',
        touchAction: action === 'create' ? 'none' : undefined,
      }}
    >
      {header}
      <div
        className="section-outer"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={e => {
          console.log('😼 pointer cancel')
          onPointerUp(e)
        }}
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
          }}
        >
          {children}
          {sections}
        </Box>
        <div
          className="ending-box"
          style={{
            backgroundColor: 'hsl(300deg 7% 8.5%)',
            height: endMargin,
            width: '100%',
          }}
        />
      </div>
    </div>
  )
}
