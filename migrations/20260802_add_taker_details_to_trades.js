exports.up = function(knex) {
  return knex.schema.alterTable('trades', function(table) {
    table.uuid('taker_beneficiary_id').nullable();
    table.string('taker_pay_in_method').nullable();
    table.string('taker_pay_out_rail').nullable();
    table.decimal('taker_gross_total', 14, 4).nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('trades', function(table) {
    table.dropColumn('taker_beneficiary_id');
    table.dropColumn('taker_pay_in_method');
    table.dropColumn('taker_pay_out_rail');
    table.dropColumn('taker_gross_total');
  });
};
