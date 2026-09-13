import knex from 'knex';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

async function main() {
  const db = knex({ client: 'pg', connection: process.env.DATABASE_URL });
  try {
    const offers = await db('offers').select('*');
    console.log('All offers:', JSON.stringify(offers, null, 2));
    
    // Check if there is an offer that matches our requirements
    const match = await db('offers')
      .where('status', 'OPEN')
      .where('currency_wanted', 'USD')
      .where('currency_offered', 'MXN');
    console.log('Matches for USD -> MXN:', match);
  } catch(e) {
    console.error(e);
  } finally {
    await db.destroy();
  }
}
main();
