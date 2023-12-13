import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { bounceEarly, leadingDebounce, hasDebounce } from './debounce.mjs'

const noop = () => {}
export function Autosaver({
  mutate,
  data,
  isFetching,
  isError,
  log = noop,
  getTouchList,
  debounceKey,
}) {
  const countRef = useRef(1)
  const queryClient = useQueryClient()

  useEffect(() => {
    leadingDebounce(
      debounceKey,
      () => {
        const list = getTouchList(queryClient)
        countRef.current++

        if (list.length > 0) {
          log(`♻️ Autosaving... (check # ${countRef.current})`)
          mutate(list)
        } else {
          log(`✅ Autosaver clean. (check # ${countRef.current})`)
        }
      },
      4000
    )()
  }, [data, queryClient, mutate, log, getTouchList, debounceKey])

  useEffect(() => {
    if (!isFetching && !isError) {
      log(`👁️ fetch success. ${Math.floor(Math.random() * 1000000000)}`)
      if (hasDebounce(debounceKey)) {
        log(`Autosaver already ran or running.`)
        return
      }

      leadingDebounce(
        debounceKey,
        () => {
          const list = getTouchList(queryClient)

          if (list.length > 0) {
            log(`♻️👁️ Fetch sentinel syncing...`)
            mutate(list)
          } else {
            log(`✅👁️ Fetch sentinel clean.`)
          }
        },
        4000
      )()
    }
  }, [queryClient, mutate, isFetching, isError, log, getTouchList, debounceKey])

  useEffect(() => {
    return () => {
      log('🫧 Unmounting autosave effect')
      bounceEarly(debounceKey)
    }
  }, [log, debounceKey])
}
