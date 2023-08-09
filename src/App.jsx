import { useState } from 'react'
import './App.css'
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query'
const queryClient = new QueryClient()

async function acquireToken() {
  const response = await fetch('http://localhost:3000/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'shredman1212@slice.dice',
      password: 'oozy123',
    }),
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
  })
  return response.json()
}

function Wrapp() {
  return (
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  )
}

function parseToken(token) {
  return JSON.parse(atob(token.split('.')[1]))
}

function App() {
  const [count, setCount] = useState(0)
  const [reply, setReply] = useState('')
  const buttonStyle = { marginRight: '0.5rem', marginBottom: '0.5rem' }

  const tokenQuery = useQuery({
    queryKey: ['queriedToken'],
    queryFn: acquireToken,
    staleTime: 6 * 1000,
    placeholderData: '',
    enabled: false,
  })

  console.log('tokenQuery.data = ', tokenQuery.data)

  return (
    <>
      <h1>Test Client</h1>
      <h2>Query status: {tokenQuery.status}</h2>
      {tokenQuery.data.token && (
        <h3>User: {parseToken(tokenQuery.data.token).name}</h3>
      )}
      <div
        style={{
          backgroundColor: '#ddd',
          color: '#422',
          overflowWrap: 'anywhere',
        }}
      >
        Query data: {tokenQuery.data.token}
      </div>
      <div className="card">
        <button onClick={() => setCount(count => count + 1)}>
          count is {count}
        </button>
      </div>
      <pre
        onClick={e => navigator.clipboard.writeText(e.target.textContent)}
        style={{
          padding: '0.75rem',
          border: '1px solid gray',
          maxWidth: '400px',
          overflow: 'scroll',
        }}
      >
        {/* {token} */}
      </pre>
      <button style={buttonStyle} onClick={() => ringServer(setReply)}>
        👋 Ring Server
      </button>
      <button style={buttonStyle} onClick={tokenQuery.refetch}>
        🍕 Enquire Token
      </button>
      {/* <button style={buttonStyle} onClick={() => tryLogin(setToken)}>
        Acquire Token
      </button> */}
      {/* <button style={buttonStyle} onClick={() => pokeServer(setReply, token)}>
        🎯 Post to server
      </button> */}
      <form action="http://localhost:3000/mock" method="post">
        <input type="text" defaultValue={'Some Text Here'}></input>
        <button>Post</button>
      </form>
      <pre>{reply}</pre>
    </>
  )
}

async function tryLogin(onResult) {
  try {
    const response = await fetch('http://localhost:3000/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'shredman1212@slice.dice',
        password: 'oozy123',
      }),
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    })

    response.json().then(json => onResult(json.token))
  } catch (e) {
    onResult('💀 Unable to acquire token.')
  }
}

async function ringServer(onResult) {
  try {
    console.log('I am a placeholder')
    const response = await fetch('http://localhost:3000/ping')
    onResult(await response.text())

    console.log(response)
  } catch (e) {
    console.log('🙁 Network request failed:', e.message)
    onResult('❌ Network request failed.')
  }
}

async function pokeServer(onResult, token) {
  try {
    const response = await fetch('http://localhost:3000/mock', {
      method: 'POST',
      headers: {
        authorization: 'Bearer ' + token,
      },
    })
    onResult(await response.text())
  } catch (e) {
    onResult("🛑 Couldn't post to server.")
  }
}

export default Wrapp
