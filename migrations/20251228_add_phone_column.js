exports.up = function (knex) {
    return knex.schema.alterTable('users', function (table) {
        table.string('phone');
    });
};

exports.down = function (knex) {
    return knex.schema.alterTable('users', function (table) {
        table.dropColumn('phone');
    });
};
