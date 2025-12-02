const { Client } = require('pg');
const bcrypt = require('bcrypt');

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres@localhost/trueque_dev' });
  await client.connect();
  const plain = 'jt123456';
  const hash = bcrypt.hashSync(plain, 10);
  console.log('Generated hash:', hash);
  console.log('Local verify:', bcrypt.compareSync(plain, hash));
  await client.query('UPDATE users SET password=$1 WHERE email=$2', [hash, 'joao.teste@trueque.dev']);
  console.log('DB updated.');
  await client.end();
})();