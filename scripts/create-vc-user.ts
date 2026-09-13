import knex from 'knex';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load .env.local manually
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' }); // Fallback

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('DATABASE_URL environment variable is missing.');
  }

  const db = knex({
    client: 'pg',
    connection: dbUrl,
  });

  const email = 'vamos@symmetri.com';
  const rawPassword = 'Vamos2026!';
  
  try {
    console.log(`Checking if user ${email} already exists...`);
    const existing = await db('users').where({ email }).first();
    
    if (existing) {
      console.log(`User ${email} already exists. Deleting...`);
      await db('beneficiaries').where({ user_id: existing.id }).del().catch(() => {});
      await db('beneficiaries').where({ owner_id: existing.id }).del().catch(() => {});
      await db('users').where({ id: existing.id }).del();
    }

    console.log('Hashing password...');
    const password_hash = await bcrypt.hash(rawPassword, 10);
    
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomSeq = Math.floor(1000 + Math.random() * 8999);
    const symmetriId = `S${dateStr}US${randomSeq}`;

    console.log(`Inserting VC user into database with Symmetri ID: ${symmetriId}...`);
    
    const [insertedUser] = await db('users').insert({
      email,
      password_hash,
      first_name: 'Symmetri',
      last_name: 'Investor',
      country: 'US',
      city: 'New York',
      state: 'NY',
      kyc_status: 'VERIFIED',
      mfa_enabled: false,
      symmetri_id: symmetriId,
      created_at: now
    }).returning(['id', 'email']);

    console.log('✅ VC User successfully created!');
    console.log('User ID:', insertedUser.id || insertedUser);
    
  } catch (error) {
    console.error('❌ Error creating user:', error);
  } finally {
    await db.destroy();
  }
}

main();
