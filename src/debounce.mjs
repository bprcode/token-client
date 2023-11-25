const timeouts = new Map()
const callbacks = new Map()

export default function debounce(key, fn, delay = 1000) {
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
    clearTimeout(timeouts.get(key))
    callbacks.get(key)?.()
    callbacks.delete(key)
    timeouts.delete(key)
  }
}
