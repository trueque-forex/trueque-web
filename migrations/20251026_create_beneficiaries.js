// File: migrations/20251026_create_beneficiaries.js
exports.up = async function (knex) {
  const exists = await knex.schema.hasTable('beneficiaries');
  if (!exists) {
    return knex.schema.createTable('beneficiaries', function (t) {
      t.increments('id').primary();
      t
        .integer('user_id')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
        .index();
      t.string('name').notNullable().index();
      t.string('account_type').notNullable().defaultTo('bank');
      t.string('account_identifier').notNullable();
      t.string('email').nullable().index();
      t.string('phone_number').nullable().index();
      t
        .timestamp('created_at', { useTz: true })
        .notNullable()
        .defaultTo(knex.fn.now());
      t
        .timestamp('updated_at', { useTz: true })
        .nullable();
    });
  }
};

exports.down = async function (knex) {
  const exists = await knex.schema.hasTable('beneficiaries');
  if (exists) {
    return knex.schema.dropTable('beneficiaries');
  }
};