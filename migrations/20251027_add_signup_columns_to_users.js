// File: migrations/20251027_add_signup_columns_to_users.js
exports.up = async function(knex) {
  const columnsToAdd = [];

  const hasFirstName = await knex.schema.hasColumn('users', 'first_name');
  if (!hasFirstName) columnsToAdd.push(['first_name', t => t.text('first_name')]);

  const hasLastName = await knex.schema.hasColumn('users', 'last_name');
  if (!hasLastName) columnsToAdd.push(['last_name', t => t.text('last_name')]);

  const hasDob = await knex.schema.hasColumn('users', 'dob');
  if (!hasDob) columnsToAdd.push(['dob', t => t.date('dob')]);

  const hasCountryOfResidence = await knex.schema.hasColumn('users', 'country_of_residence');
  if (!hasCountryOfResidence) columnsToAdd.push(['country_of_residence', t => t.text('country_of_residence')]);

  const hasCountryDestiny = await knex.schema.hasColumn('users', 'country_destiny');
  if (!hasCountryDestiny) columnsToAdd.push(['country_destiny', t => t.text('country_destiny')]);

  const hasIsTest = await knex.schema.hasColumn('users', 'is_test');
  if (!hasIsTest) columnsToAdd.push(['is_test', t => t.boolean('is_test').defaultTo(false)]);

  const hasTid = await knex.schema.hasColumn('users', 'tid');
  if (!hasTid) columnsToAdd.push(['tid', t => t.text('tid')]);

  if (columnsToAdd.length > 0) {
    await knex.schema.alterTable('users', t => {
      for (const [, addColumn] of columnsToAdd) {
        addColumn(t);
      }
    });
  }
};

exports.down = async function(knex) {
  const columnsToDrop = [];

  const hasFirstName = await knex.schema.hasColumn('users', 'first_name');
  if (hasFirstName) columnsToDrop.push('first_name');

  const hasLastName = await knex.schema.hasColumn('users', 'last_name');
  if (hasLastName) columnsToDrop.push('last_name');

  const hasDob = await knex.schema.hasColumn('users', 'dob');
  if (hasDob) columnsToDrop.push('dob');

  const hasCountryOfResidence = await knex.schema.hasColumn('users', 'country_of_residence');
  if (hasCountryOfResidence) columnsToDrop.push('country_of_residence');

  const hasCountryDestiny = await knex.schema.hasColumn('users', 'country_destiny');
  if (hasCountryDestiny) columnsToDrop.push('country_destiny');

  const hasIsTest = await knex.schema.hasColumn('users', 'is_test');
  if (hasIsTest) columnsToDrop.push('is_test');

  const hasTid = await knex.schema.hasColumn('users', 'tid');
  if (hasTid) columnsToDrop.push('tid');

  if (columnsToDrop.length > 0) {
    await knex.schema.alterTable('users', t => {
      for (const col of columnsToDrop) {
        t.dropColumn(col);
      }
    });
  }
};