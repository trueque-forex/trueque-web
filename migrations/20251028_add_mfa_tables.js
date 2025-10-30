// migrations/20251028_add_mfa_tables.js
exports.up = async function (knex) {
  await knex.transaction(async (trx) => {
    // 1. Add columns to users
    const hasMfaEnabled = await trx.schema.hasColumn('users', 'mfa_enabled');
    if (!hasMfaEnabled) {
      await trx.schema.alterTable('users', (t) => {
        t.boolean('mfa_enabled').notNullable().defaultTo(false);
        t.text('mfa_method').nullable();
        t.text('mfa_primary_phone').nullable();
      });
    }

    // 2. mfa_totp table
    const existsTotp = await trx.schema.hasTable('mfa_totp');
    if (!existsTotp) {
      await trx.schema.createTable('mfa_totp', (t) => {
        t.uuid('user_id').primary().references('id').inTable('users').onDelete('CASCADE');
        t.binary('secret_encrypted').notNullable();
        t.timestamp('created_at').notNullable().defaultTo(trx.fn.now());
        t.timestamp('last_used_at').nullable();
      });
    }

    // 3. mfa_recovery_codes
    const existsCodes = await trx.schema.hasTable('mfa_recovery_codes');
    if (!existsCodes) {
      await trx.schema.createTable('mfa_recovery_codes', (t) => {
        t.bigIncrements('id').primary();
        t.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
        t.text('code_hash').notNullable();
        t.boolean('used').notNullable().defaultTo(false);
        t.timestamp('created_at').notNullable().defaultTo(trx.fn.now());
      });
      await trx.schema.raw('CREATE INDEX IF NOT EXISTS mfa_recovery_codes_user_id_idx ON mfa_recovery_codes(user_id)');
    }

    // 4. mfa_attempts audit table
    const existsAttempts = await trx.schema.hasTable('mfa_attempts');
    if (!existsAttempts) {
      await trx.schema.createTable('mfa_attempts', (t) => {
        t.bigIncrements('id').primary();
        t.uuid('user_id').nullable().references('id').inTable('users').onDelete('SET NULL');
        t.text('event_type').notNullable();
        t.boolean('success').notNullable();
        t.specificType('ip', 'inet').nullable();
        t.text('user_agent').nullable();
        t.jsonb('extra').nullable();
        t.timestamp('created_at').notNullable().defaultTo(trx.fn.now());
      });
      await trx.schema.raw('CREATE INDEX IF NOT EXISTS mfa_attempts_user_time_idx ON mfa_attempts(user_id, created_at DESC)');
    }
  });
};

exports.down = async function (knex) {
  await knex.transaction(async (trx) => {
    const existsAttempts = await trx.schema.hasTable('mfa_attempts');
    if (existsAttempts) await trx.schema.dropTable('mfa_attempts');

    const existsCodes = await trx.schema.hasTable('mfa_recovery_codes');
    if (existsCodes) await trx.schema.dropTable('mfa_recovery_codes');

    const existsTotp = await trx.schema.hasTable('mfa_totp');
    if (existsTotp) await trx.schema.dropTable('mfa_totp');

    const hasMfaEnabled = await trx.schema.hasColumn('users', 'mfa_enabled');
    if (hasMfaEnabled) {
      await trx.schema.alterTable('users', (t) => {
        t.dropColumn('mfa_enabled');
        t.dropColumn('mfa_method');
        t.dropColumn('mfa_primary_phone');
      });
    }
  });
};