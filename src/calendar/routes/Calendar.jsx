import { Card, Slide } from '@mui/material'
import { useLoaderData, useParams } from 'react-router-dom'

export function loader() {
  const names = ['Bob', 'Timmy', 'Burt', 'Allison', 'Raquel', 'Susana', 'Jeffrey', 'Julie', 'Morgan', 'Gorman']
  const data = {name: names[Math.floor(names.length * Math.random())], age: 20 + Math.floor(Math.random() * 60)}

  return new Promise(k => {
    setTimeout(() => k(data), Math.random() * 1500 + 1000)
  })
}

export function Calendar() {
  const params = useParams()
  const loaded = useLoaderData()
  console.log('loaded=', loaded)

  return (
    <Slide
      key={params.id}
      timeout={350}
      in={true}
      direction="left"
      mountOnEnter
      unmountOnExit
    >
      <div>
        <Card variant="outlined" sx={{mx: 3,my: 3}}>
          <div>📅 Calendar {params.id}</div>
        <div>🙋‍♂️ {loaded.name}, age {loaded.age}</div>
        </Card>
      </div>
    </Slide>
  )
}
