require('dotenv').config();
const { Pool } = require('pg');
const p = new Pool({ connectionString: process.env.DATABASE_URL });
p.connect().then(c=>{ console.log('connected'); c.release(); p.end(); }).catch(e=>{ console.error('connect failed', e.message); process.exit(1); });