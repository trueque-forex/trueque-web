// File: knexfile.js
require('dotenv').config(); // loads .env variables into process.env

module.exports = {
  development: {
    client: 'pg',
    connection: process.env.DATABASE_URL,
    migrations: {
      directory: './migrations'
    }
  }
};