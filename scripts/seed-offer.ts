import knex from 'knex';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  const db = knex({ client: 'pg', connection: dbUrl });

  let ownerId;
  try {
    const otherUser = await db('users').whereNot({ email: 'vamos@symmetri.com' }).first();
    ownerId = otherUser?.id;

    if (!ownerId) {
      const [insertedUser] = await db('users').insert({
        email: 'dummy_offer_creator@symmetri.com',
        password_hash: 'abc',
        first_name: 'Dummy',
        last_name: 'Creator',
        country: 'US',
        city: 'NY',
        state: 'NY',
        kyc_status: 'VERIFIED',
        mfa_enabled: false,
        symmetri_id: 'S001',
        created_at: new Date()
      }).returning(['id']);
      ownerId = insertedUser.id || insertedUser;
    }

    try {
      await db('offers').insert({
        owner_id: ownerId,
        swap_type: 'SYNTHETIC',
        amount_offered: 20000,
        currency_offered: 'MXN',
        amount_wanted: 1000,
        currency_wanted: 'USD',
        exchange_rate: 20.00,
        fee_total: 0,
        status: 'OPEN',
        is_public: true,
        created_at: new Date()
      });
      console.log('✅ Seeded offer successfully (new schema)!');
    } catch(e: any) {
      console.error('First insert failed:', e.message);
      await db('offers').insert({
        owner_id: ownerId,
        swap_type: 'SYNTHETIC',
        amount: 1000,
        source_currency: 'USD',
        amount_received: 20000,
        target_currency: 'MXN',
        exchange_rate: 20.00,
        fee_total: 0,
        status: 'OPEN',
        is_public: true,
        created_at: new Date()
      });
      console.log('✅ Seeded offer successfully (old schema)!');
    }
  } catch (e: any) {
    console.error('Fatal error:', e.message);
  } finally {
    await db.destroy();
  }
}
main();
