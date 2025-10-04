class Offer {
  final int id;
  final String uuid;
  final String country;
  final String currencyFrom;
  final String currencyTo;
  final double amount;
  final double marketRate;
  final String status;
  final int? matchedOfferId;

  Offer({
    required this.id,
    required this.uuid,
    required this.country,
    required this.currencyFrom,
    required this.currencyTo,
    required this.amount,
    required this.marketRate,
    required this.status,
    this.matchedOfferId,
  });

  factory Offer.fromJson(Map<String, dynamic> json) {
    return Offer(
      id: json['id'],
      uuid: json['uuid'],
      country: json['country'],
      currencyFrom: json['currency_from'],
      currencyTo: json['currency_to'],
      amount: json['amount'].toDouble(),
      marketRate: json['market_rate'].toDouble(),
      status: json['status'],
      matchedOfferId: json['matched_offer_id'],
    );
  }
}