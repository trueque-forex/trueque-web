class Offer {
  final int id;
  final String uuid;
  final String userId;
  final String? counterpartyId;
  final String country;
  final String currencyFrom;
  final String currencyTo;
  final double amount;
  final double marketRate;
  final String status;
  final int? matchedOfferId;
  final DateTime? createdAt;
  final DateTime? expiresAt;

  Offer({
    required this.id,
    required this.uuid,
    required this.userId,
    this.counterpartyId,
    required this.country,
    required this.currencyFrom,
    required this.currencyTo,
    required this.amount,
    required this.marketRate,
    required this.status,
    this.matchedOfferId,
    this.createdAt,
    this.expiresAt,
  });

  factory Offer.fromJson(Map<String, dynamic> json) {
    return Offer(
      id: json['id'],
      uuid: json['uuid'] ?? '',
      userId: json['user_id']?.toString() ?? json['userId']?.toString() ?? '',
      counterpartyId: json['counterparty_id']?.toString() ?? json['counterpartyId']?.toString(),
      country: json['country'] ?? '',
      currencyFrom: json['currency_from'] ?? json['currencyFrom'] ?? '',
      currencyTo: json['currency_to'] ?? json['currencyTo'] ?? '',
      amount: (json['amount'] ?? 0).toDouble(),
      marketRate: (json['market_rate'] ?? json['marketRate'] ?? 0).toDouble(),
      status: json['status'] ?? 'open',
      matchedOfferId: json['matched_offer_id'] ?? json['matchedOfferId'],
      createdAt: json['created_at'] != null ? DateTime.parse(json['created_at']) : null,
      expiresAt: json['expires_at'] != null ? DateTime.parse(json['expires_at']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'uuid': uuid,
      'user_id': userId,
      'counterparty_id': counterpartyId,
      'country': country,
      'currency_from': currencyFrom,
      'currency_to': currencyTo,
      'amount': amount,
      'market_rate': marketRate,
      'status': status,
      'matched_offer_id': matchedOfferId,
      'created_at': createdAt?.toIso8601String(),
      'expires_at': expiresAt?.toIso8601String(),
    };
  }

  bool get isMatched => status == 'matched';
  bool get isOpen => status == 'open';
  bool get isClosed => status == 'closed';

  Offer copyWith({
    int? id,
    String? uuid,
    String? userId,
    String? counterpartyId,
    String? country,
    String? currencyFrom,
    String? currencyTo,
    double? amount,
    double? marketRate,
    String? status,
    int? matchedOfferId,
    DateTime? createdAt,
    DateTime? expiresAt,
  }) {
    return Offer(
      id: id ?? this.id,
      uuid: uuid ?? this.uuid,
      userId: userId ?? this.userId,
      counterpartyId: counterpartyId ?? this.counterpartyId,
      country: country ?? this.country,
      currencyFrom: currencyFrom ?? this.currencyFrom,
      currencyTo: currencyTo ?? this.currencyTo,
      amount: amount ?? this.amount,
      marketRate: marketRate ?? this.marketRate,
      status: status ?? this.status,
      matchedOfferId: matchedOfferId ?? this.matchedOfferId,
      createdAt: createdAt ?? this.createdAt,
      expiresAt: expiresAt ?? this.expiresAt,
    );
  }
}