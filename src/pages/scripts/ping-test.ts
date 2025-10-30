import fetch from 'node-fetch'

async function main() {
  const res = await fetch('https://trueque-api-test.vercel.app/api/test')
  const data = await res.json()

  if (res.ok && data.status === 'ok') {
    console.log('✅ API test passed:', data.message)
    process.exit(0)
  } else {
    console.error('❌ API test failed:', data)
    process.exit(1)
  }
}

main()
