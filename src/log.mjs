import { debounce } from './debounce'

const maxBufferSize = 30
const logBuffer = []
const logImmediate = console.log.bind(console)

const logDelayed = (...stuff) => {
  logBuffer.push(stuff)
  while(logBuffer.length > maxBufferSize) {
    logBuffer.shift()
  }

  debounce('log dump', () => {
    while(logBuffer.length) {
      logImmediate(...logBuffer.shift())
    }
  }, 500)
}

const log = import.meta.env.DEV ? console.log.bind(console) : () => {}

export default logDelayed
 