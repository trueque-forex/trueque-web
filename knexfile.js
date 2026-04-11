// File: knexfile.js
require('dotenv').config(); // loads .env variables into process.env

module.exports = {
  development: {
    client: 'pg',
    connection: {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    },
    migrations: {
      directory: './migrations'
    }
  }
};