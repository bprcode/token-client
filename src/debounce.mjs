const timeouts = new Map()
const callbacks = new Map()

export function debounce(key, fn, delay = 1000) {
  return (...stuff) => {
    clearTimeout(timeouts.get(key))

    const tid = setTimeout(() => {
      callbacks.get(key)()
      callbacks.delete(key)
      timeouts.delete(key)
    }, delay)

    timeouts.set(key, tid)
    callbacks.set(key, fn.bind(this, ...stuff))
  }
}

export function leadingDebounce(key, fn, delay = 1000) {
  return (...stuff) => {
    if (!timeouts.has(key)) {
      // Block instant activation for a while
      const lockout = setTimeout(() => {
        // Unlock this key
        timeouts.delete(key)
      }, delay)

      timeouts.set(key, lockout)
      // Immediately invoke callback
      return fn.apply(this, stuff)
    }

    // If a timeout is running, debounce it:
    clearTimeout(timeouts.get(key))
    const tid = setTimeout(() => {
      callbacks.get(key)()
      callbacks.delete(key)
      timeouts.delete(key)
    }, delay)

    timeouts.set(key, tid)
    callbacks.set(key, fn.bind(this, ...stuff))
  }
}

export function bounceEarly(key) {
  if (timeouts.has(key)) {
    console.log('⏲️ early-resolving', key)
    clearTimeout(timeouts.get(key))
    callbacks.get(key)?.()
    callbacks.delete(key)
    timeouts.delete(key)
  }
}

const schedule = new Map()

export function backoff(key, callback) {
  const resetTime = 10 * 1000
  const now = Date.now()

  const resolve = () => {
    if (schedule.get(key)?.shouldReset) {
      schedule.delete(key)
    }

    callback()
  }

  debounce(
    `backoff reset (${key})`,
    () => {
      const now = Date.now()
      const latest = schedule.get(key)
      if (latest.shouldReset) {
        return
      }
      if (now < latest.time) {
        schedule.set(key, { ...latest, shouldReset: true })
      }
      if (now >= latest?.time) {
        schedule.delete(key)
      }
    },
    resetTime
  )()

  if (!schedule.has(key)) {
    schedule.set(key, { time: now, step: 0 })

    return resolve()
  }

  const scheduled = schedule.get(key)
  const wait = 500 * 2 ** scheduled.step

  if (now - scheduled.time > wait) {

    schedule.set(key, {
      time: now,
      step: scheduled.step + 1,
    })
    return resolve()
  }

  if (now < scheduled.time) {
    return
  }

  const nextAllowed = scheduled.time + wait

  setTimeout(() => {
    resolve()
  }, nextAllowed - now)

  schedule.set(key, {
    time: nextAllowed,
    step: scheduled.step + 1,
  })
}