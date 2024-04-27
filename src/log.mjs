import { debounce } from './debounce'

const maxBufferSize = 50
const logBuffer = []

function dumpLog() {
  while (logBuffer.length) {
    console.log(...logBuffer.shift())
  }
}

function logEntry(stuff) {
  logBuffer.push(stuff)
  while (logBuffer.length > maxBufferSize) {
    logBuffer.shift()
  }
}

function logDelayed(...stuff) {
  logEntry(stuff)
  debounce('log dump', dumpLog, 200)
}

function logInternal(...stuff) {
  logEntry(stuff)
}

const logReference = {
  current: import.meta.env.DEV ? logDelayed : logInternal,
}

function log(...stuff) {
  logReference.current(...stuff)
}

window.enableLogs = function () {
  console.log(
    `%cLogging enabled. Most recent ${logBuffer.length} messages:`,
    'color:#0af'
  )
  dumpLog()
  logReference.current = logDelayed
}

if (logReference.current === logInternal) {
  console.log('🔹%cLogging available. Run enableLogs() to view.', 'color:#0af')
}

export default log
