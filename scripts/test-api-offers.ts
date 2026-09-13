import fetch from 'node-fetch';

async function main() {
  console.log('Testing /api/offers...');
  
  // Try to login to get a session cookie
  const loginRes = await fetch('http://localhost:3000/api/auth/signin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'vamos@symmetri.com', password: 'Vamos2026!' })
  });
  
  if (!loginRes.ok) {
    console.error('Login failed:', await loginRes.text());
    return;
  }
  
  const cookies = loginRes.headers.raw()['set-cookie'];
  console.log('Got cookies:', cookies ? 'Yes' : 'No');
  
  const cookieStr = cookies?.join('; ');
  
  console.log('Fetching /api/offers...');
  const t1 = Date.now();
  
  try {
    const res = await fetch('http://localhost:3000/api/offers?currencyFrom=USD&currencyTo=MXN', {
      headers: { Cookie: cookieStr || '' }
    });
    
    console.log('Offers status:', res.status, 'Time:', Date.now() - t1, 'ms');
    const text = await res.text();
    console.log('Offers response:', text);
  } catch (err: any) {
    console.error('Fetch offers failed:', err.message);
  }
}

main();
