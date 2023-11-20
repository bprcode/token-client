const timeouts = new Map()
const callbacks = new Map()

export default function debounce(key, f, delay = 1000) {

  return (...stuff) => {
    clearTimeout(timeouts.get(key))
    const tid = setTimeout(() => {
      callbacks.get(key).apply(this, stuff)
      timeouts.delete(key)
      callbacks.delete(key)
    }, delay)

    timeouts.set(key, tid)
    callbacks.set(key, f)
  }
}

export function leadingDebounce(key, f, delay = 1000) {
  return (...stuff) => {
    // If no debounce in progress...
    if (!timeouts.has(key)) {
      // Block instant activation for a while
      const lockout = setTimeout(() => {
        // Unlock this key
        timeouts.delete(key)
      }, delay)

      timeouts.set(key, lockout)
      // Trigger instant activation
      f.apply(this, stuff)
    } else {
      // Otherwise, set a new timer
      clearTimeout(timeouts.get(key))
      const tid = setTimeout(() => {
        callbacks.get(key).apply(this, stuff)
        timeouts.delete(key)
        callbacks.delete(key)
      }, delay)

      timeouts.set(key, tid)
      callbacks.set(key, f)
    }
  }
}

export function cancelDebounce(key) {
  if(callbacks.has(key)) {
    callbacks.set(key, () => {})
  }
}
