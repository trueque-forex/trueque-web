import { useState } from 'react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [token, setToken] = useState('')

  const handleLogin = async () => {
    try {
      const res = await fetch('https://trueque-api-test.vercel.app/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await res.json()
      if (res.ok) {
        setMessage(`✅ Welcome back, ${data.user.email}`)
        setToken(data.token)
      } else {
        setMessage(`❌ ${data.error}`)
        setToken('')
      }
    } catch (err) {
      setMessage('❌ Network error')
      setToken('')
    }
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Login</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />
      <br />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />
      <br />
      <button onClick={handleLogin}>Log In</button>

      {message && (
        <div style={{ color: message.startsWith('✅') ? 'green' : 'red', marginTop: '1rem' }}>
          <p>{message}</p>
          {token && (
            <pre style={{ background: '#f4f4f4', padding: '1rem' }}>
              <strong>Audit Preview:</strong><br />
              Token: {token}<br />
              Decoded: {atob(token)}
              Timestamp: {new Date().toISOString()}
            </pre>
          )}
        </div>
      )}
    </div>
  )
}
