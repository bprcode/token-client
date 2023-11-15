import { useQuery } from '@tanstack/react-query'
import { goFetch } from '../../go-fetch'
import { useLoadingPane } from '../LoadingPane'
import { ViewContainer } from '../ViewContainer'
import { ViewHeader } from '../ViewHeader'

const catalogQuery = {
  queryKey: ['catalog'],
  queryFn: () => {
    console.log('🦕 catalog queryFn called')
    return goFetch(import.meta.env.VITE_BACKEND + 'calendars', {
      credentials: 'include',
    })
  },
}

// debug -- can probably choose await or not here?
export const loader =
  queryClient =>
  ({ request, params }) => {
    console.log('zoo catalog loader?')

    queryClient.fetchQuery(catalogQuery)
    return false

    // Don't do this. 👇 Makes direct URL navigation hang 10s+.
    // return queryClient.ensureQueryData(catalogQuery)
  }

export function Catalog() {
  const catalog = useQuery(catalogQuery)
  const loadingPane = useLoadingPane(catalog)

  if (loadingPane)
    return (
      <ViewContainer>
        <ViewHeader />
        {loadingPane}
      </ViewContainer>
    )

  return (
    <ViewContainer>
      <ViewHeader />
      I am a catalog
      <br />
      <div>isPending: {catalog.isPending ? 'yeah' : 'nah'}</div>
      <div>catalog query status: {catalog.status}</div>
      <div>catalog error message: {catalog.error?.message}</div>
      <div>catalog error status: {catalog.error?.status}</div>
      <div>records returned: {catalog.data?.length}</div>
      <ul>
        {catalog.data?.length &&
          catalog.data.map((c, i) => (
            <li key={c.calendar_id}>
              {c.calendar_id} {c.summary}
            </li>
          ))}
      </ul>
    </ViewContainer>
  )
}
