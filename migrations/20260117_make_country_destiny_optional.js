exports.up = function (knex) {
    return knex.schema.alterTable('users', function (table) {
        table.string('country_destiny').nullable().alter();
    });
};

exports.down = function (knex) {
    // Reverting to not nullable if needed, but for safety we usually don't enforce strict back unless necessary.
    // return knex.schema.alterTable('users', function(table) {
    //   table.string('country_destiny').notNullable().alter();
    // });
};
