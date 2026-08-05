const http = require('http');

http.get('http://127.0.0.1:8000/api/beneficiaries?owner_id=9613090e-556d-4d15-8304-7ec99c8e8055', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(data));
}).on('error', err => console.log(err.message));
