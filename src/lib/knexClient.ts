import knex from 'knex';

const knexClient = knex({
  client: 'pg',
  connection: process.env.DATABASE_URL,
  pool: { min: 1, max: 5 },
});

export default knexClient;
