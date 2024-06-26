import { Box, useMediaQuery } from '@mui/material'
import { gradualShades } from './blueDigitalTheme'
import { useEffect, useMemo, useRef } from 'react'
import { useNarrowCheck } from './LayoutContext'

const defaultLeftPadding = ['0.5rem', '5rem']
const defaultRightPadding = '0.5rem'

const noop = () => {}
export function SectionedInterval({
  initial,
  final,
  step,
  children,
  outsideHeight,
  insideHeight,
  innerLeftPadding = defaultLeftPadding,
  innerRightPadding = defaultRightPadding,
  labelEvery = 1,
  onClick = noop,
  onPointerDown = noop,
  onPointerUp = noop,
  endMargin = '8rem',
  action,
  header,
}) {
  const isNarrow = useNarrowCheck()

  // the following useEffect is solely to fix a Safari bug where scrolling to
  // the end of the page can cause position: sticky elements to disappear.
  const outerRef = useRef(null)
  useEffect(() => {
    let skipFirst = true
    const target = outerRef.current.querySelector('.ending-box')
    const viewHeader = outerRef.current.querySelector('.view-header')

    const observer = new IntersectionObserver(watchEnd, {
      root: null,
    })

    observer.observe(outerRef.current.querySelector('.ending-box'))
    function watchEnd() {
      if (skipFirst) {
        skipFirst = false
        return
      }
      viewHeader?.scrollIntoView()
    }

    return () => {
      observer.unobserve(target)
    }
  }, [])

  const canFitTimes = useMediaQuery('(min-width: 400px)')
  const canFitDst = useMediaQuery('(min-width: 600px)')
  const timeFormat = canFitTimes ? 'h:mm A' : 'h A'

  const sections = useMemo(() => {
    const sections = []
    let t = initial
    const t1 = initial.add(...step)
    const stepPercentage = (100 * t1.diff(initial)) / final.diff(initial)
    let n = 0
    let j = -1
    let labelStep = -1
    let utcOffset = t.utcOffset()
    while (t.isBefore(final)) {
      const newOffset = t.utcOffset()
      const dstChange = newOffset - utcOffset
      utcOffset = newOffset

      j++
      labelStep++
      if (dstChange) {
        labelStep += dstChange > 0 ? 1 : -1
      }

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
            backgroundColor: dstChange ? '#840' : gradualShades(j),
          }}
        >
          {dstChange ? (
            <Box
              sx={{
                paddingLeft: ['1px', '0.25rem'],
                fontSize: '0.875em',
              }}
            >
              {dstChange < 0
                ? canFitDst
                  ? 'End DST'
                  : '-DST'
                : canFitDst
                ? 'Start DST'
                : '+DST'}
            </Box>
          ) : (
            <Box
              sx={{
                display: labelStep % labelEvery ? 'none' : 'inline',
                paddingLeft: ['1px', '0.25rem'],
                fontSize: '0.875em',
              }}
            >
              {t.format(timeFormat)}
            </Box>
          )}
        </div>
      )

      t = t.add(...step)
      n++
    }
    return sections
  }, [initial, final, step, labelEvery, timeFormat, canFitDst])

  return (
    <div
      ref={outerRef}
      className="section-scroll"
      style={{
        width: '100%',
        // -- DO NOT ENABLE --
        // ruins drag detection on creation for some reason?
        // overflowX: 'hidden',
        overflowY: isNarrow ? undefined : 'auto',
        touchAction: action === 'create' ? 'none' : 'manipulation',
        cursor: action === 'create' ? 'cell' : undefined,
      }}
    >
      {header}
      <div
        className="section-outer"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={e => {
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
            paddingLeft: innerLeftPadding,
            paddingRight: innerRightPadding,
          }}
        >
          {children}
          {sections}
        </Box>
        <div
          className="ending-box"
          style={{
            backgroundColor: 'hsla(300deg, 7%, 8.5%, 0.25)',
            height: endMargin,
            width: '100%',
          }}
        />
      </div>
    </div>
  )
}
