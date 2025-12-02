class PaymentMethod {
  final String id;
  final String userId;
  final String type; // 'bank_account', 'mobile_money', 'cash_pickup', 'crypto_wallet'
  final String provider; // 'nequi', 'daviplata', 'bancolombia', etc.
  final String accountNumber;
  final String? accountHolderName;
  final String currency;
  final String country;
  final bool isDefault;
  final bool isVerified;
  final DateTime createdAt;
  final DateTime? lastUsedAt;
  final Map<String, dynamic>? metadata;

  PaymentMethod({
    required this.id,
    required this.userId,
    required this.type,
    required this.provider,
    required this.accountNumber,
    this.accountHolderName,
    required this.currency,
    required this.country,
    this.isDefault = false,
    this.isVerified = false,
    required this.createdAt,
    this.lastUsedAt,
    this.metadata,
  });

  factory PaymentMethod.fromJson(Map<String, dynamic> json) {
    return PaymentMethod(
      id: json['id'].toString(),
      userId: json['user_id']?.toString() ?? json['userId']?.toString() ?? '',
      type: json['type'] ?? '',
      provider: json['provider'] ?? '',
      accountNumber: json['account_number'] ?? json['accountNumber'] ?? '',
      accountHolderName: json['account_holder_name'] ?? json['accountHolderName'],
      currency: json['currency'] ?? '',
      country: json['country'] ?? '',
      isDefault: json['is_default'] ?? json['isDefault'] ?? false,
      isVerified: json['is_verified'] ?? json['isVerified'] ?? false,
      createdAt: json['created_at'] != null 
          ? DateTime.parse(json['created_at']) 
          : DateTime.now(),
      lastUsedAt: json['last_used_at'] != null 
          ? DateTime.parse(json['last_used_at']) 
          : null,
      metadata: json['metadata'] as Map<String, dynamic>?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'type': type,
      'provider': provider,
      'account_number': accountNumber,
      'account_holder_name': accountHolderName,
      'currency': currency,
      'country': country,
      'is_default': isDefault,
      'is_verified': isVerified,
      'created_at': createdAt.toIso8601String(),
      'last_used_at': lastUsedAt?.toIso8601String(),
      'metadata': metadata,
    };
  }

  String get displayName {
    final maskedAccount = accountNumber.length > 4 
        ? '****${accountNumber.substring(accountNumber.length - 4)}'
        : accountNumber;
    return '$provider - $maskedAccount';
  }

  String get typeDisplay {
    switch (type) {
      case 'bank_account':
        return 'Bank Account';
      case 'mobile_money':
        return 'Mobile Money';
      case 'cash_pickup':
        return 'Cash Pickup';
      case 'crypto_wallet':
        return 'Crypto Wallet';
      default:
        return type;
    }
  }

  PaymentMethod copyWith({
    String? id,
    String? userId,
    String? type,
    String? provider,
    String? accountNumber,
    String? accountHolderName,
    String? currency,
    String? country,
    bool? isDefault,
    bool? isVerified,
    DateTime? createdAt,
    DateTime? lastUsedAt,
    Map<String, dynamic>? metadata,
  }) {
    return PaymentMethod(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      type: type ?? this.type,
      provider: provider ?? this.provider,
      accountNumber: accountNumber ?? this.accountNumber,
      accountHolderName: accountHolderName ?? this.accountHolderName,
      currency: currency ?? this.currency,
      country: country ?? this.country,
      isDefault: isDefault ?? this.isDefault,
      isVerified: isVerified ?? this.isVerified,
      createdAt: createdAt ?? this.createdAt,
      lastUsedAt: lastUsedAt ?? this.lastUsedAt,
      metadata: metadata ?? this.metadata,
    );
  }
}
