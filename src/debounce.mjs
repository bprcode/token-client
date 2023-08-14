export default function debounce(key, f, delay = 1000) {
  if (!debounce.map) {
    debounce.map = new Map()
  }

  return (...stuff) => {
    clearTimeout(debounce.map.get(key))
    const tid = setTimeout(() => {
      f.apply(this, stuff)
      debounce.map.delete(key)
    }, delay)

    debounce.map.set(key, tid)
  }
}
