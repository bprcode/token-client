export async function fetchTimeout(resource, options = {}) {
  const defaultTime = 4000
  const controller = new AbortController()
  const id = setTimeout(
    () => controller.abort(),
    options.timeout || defaultTime
  )

  const response = await fetch(resource, {
    signal: controller.signal,
    ...options,
  })

  clearTimeout(id)
  return response
}
