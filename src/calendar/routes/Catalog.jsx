import { useQuery } from "@tanstack/react-query"

const catalogQuery = {

}

// debug -- can probably choose await or not here?
export const loader = queryClient => ({ request, params}) => {
  return 3
}

export function Catalog() {
  const meQuery = useQuery({
    queryKey: ['login']
  })
  const fooQuery = useQuery({
    queryKey: ['foo']
  })

  console.log('meQuery data=',meQuery.data)
  return <div>
    I am a catalog<br/>
    <div>{meQuery.data?.ok ? meQuery.data.name : 'No login'}</div>

  </div>
}