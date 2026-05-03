exports.up = function (knex) {
    return knex.schema.alterTable('users', function (table) {
        table.string('phone_bidx');
        table.index('phone_bidx');
    });
};

exports.down = function (knex) {
    return knex.schema.alterTable('users', function (table) {
        table.dropIndex('phone_bidx');
        table.dropColumn('phone_bidx');
    });
};
