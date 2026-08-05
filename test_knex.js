require('dotenv').config();
const { getKnex } = require('./src/lib/db');

(async () => {
  const db = getKnex();
  const user = await db('users').where({ email: 'admin@symmetri.dev' }).first();
  console.log('User row:', user);
  process.exit(0);
})();
