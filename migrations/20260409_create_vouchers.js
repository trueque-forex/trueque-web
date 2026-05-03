/**
 * Migration: 20260409_create_vouchers
 *
 * Creates the vouchers table for Phase 1 — Closed-Loop Voucher system.
 * Includes full audit trail, delivery tracking, and redemption anchor (GPS).
 */

exports.up = async function (knex) {
    await knex.schema.createTableIfNotExists('vouchers', (table) => {
        // Identity
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

        // Sender
        table.uuid('user_id').notNullable().comment('Symmetri user who purchased the voucher');

        // Retailer
        table.string('retailer_id', 50).notNullable();
        table.string('retailer_name', 100).notNullable();

        // Voucher
        table.string('voucher_code', 100).notNullable().unique();
        table.enu('status', ['ACTIVE', 'REDEEMED', 'EXPIRED', 'CANCELLED'])
            .notNullable()
            .defaultTo('ACTIVE');

        // Financials (4-decimal precision per Symmetri engineering standard)
        table.decimal('amount_usd', 18, 4).notNullable();
        table.decimal('amount_local', 18, 4).notNullable();
        table.string('local_currency', 3).notNullable();
        table.decimal('exchange_rate', 18, 6).notNullable();
        table.decimal('processor_fee', 18, 4).notNullable().defaultTo(0);
        table.decimal('total_charged', 18, 4).notNullable();
        table.decimal('symmetri_fee', 18, 4).notNullable().defaultTo(0);

        // Rate source
        table.string('rate_source', 100);
        table.boolean('rate_fallback').defaultTo(false);

        // Payment
        table.enu('payment_method', ['ach', 'card']).notNullable();

        // Beneficiary delivery
        table.string('beneficiary_name', 200);
        table.string('beneficiary_phone', 30);
        table.enu('delivery_method', ['whatsapp', 'sms']).defaultTo('whatsapp');
        table.enu('delivery_status', ['PENDING', 'SENT', 'FAILED']).defaultTo('PENDING');
        table.timestamp('delivered_at', { useTz: true });

        // Redemption tracking
        table.timestamp('redeemed_at', { useTz: true });
        table.string('redemption_store_id', 100)
            .comment('Retailer POS / store identifier at redemption');

        /**
         * historical_redemption_anchor — per GEMINI.md §3.1
         * Passive location sorter. JSON: { lat: number, lng: number, city?: string }
         * Captured from POS webhook or seeded from store directory. No browser GPS.
         */
        table.jsonb('historical_redemption_anchor');

        // Timestamps
        table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
        table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
        table.timestamp('expires_at', { useTz: true })
            .defaultTo(knex.raw("NOW() + INTERVAL '30 days'"));
    });

    // Index for sender dashboard queries
    await knex.schema.raw(
        'CREATE INDEX IF NOT EXISTS idx_vouchers_user_id ON vouchers (user_id)'
    );
    // Index for redemption map queries
    await knex.schema.raw(
        `CREATE INDEX IF NOT EXISTS idx_vouchers_status_retailer
         ON vouchers (status, retailer_id)
         WHERE status = 'REDEEMED'`
    );
};

exports.down = async function (knex) {
    await knex.schema.dropTableIfExists('vouchers');
};
