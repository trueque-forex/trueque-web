class Beneficiary {
  final String id;
  final String userId;
  final String truequeId;
  final String? nickname;
  final String? firstName;
  final String? lastName;
  final String country;
  final String? phoneNumber;
  final String? email;
  final bool isFavorite;
  final DateTime createdAt;
  final DateTime? lastUsedAt;
  final int transactionCount;

  Beneficiary({
    required this.id,
    required this.userId,
    required this.truequeId,
    this.nickname,
    this.firstName,
    this.lastName,
    required this.country,
    this.phoneNumber,
    this.email,
    this.isFavorite = false,
    required this.createdAt,
    this.lastUsedAt,
    this.transactionCount = 0,
  });

  factory Beneficiary.fromJson(Map<String, dynamic> json) {
    return Beneficiary(
      id: json['id'].toString(),
      userId: json['user_id']?.toString() ?? json['userId']?.toString() ?? '',
      truequeId: json['trueque_id'] ?? json['truequeId'] ?? '',
      nickname: json['nickname'],
      firstName: json['first_name'] ?? json['firstName'],
      lastName: json['last_name'] ?? json['lastName'],
      country: json['country'] ?? '',
      phoneNumber: json['phone_number'] ?? json['phoneNumber'],
      email: json['email'],
      isFavorite: json['is_favorite'] ?? json['isFavorite'] ?? false,
      createdAt: json['created_at'] != null 
          ? DateTime.parse(json['created_at']) 
          : DateTime.now(),
      lastUsedAt: json['last_used_at'] != null 
          ? DateTime.parse(json['last_used_at']) 
          : null,
      transactionCount: json['transaction_count'] ?? json['transactionCount'] ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'trueque_id': truequeId,
      'nickname': nickname,
      'first_name': firstName,
      'last_name': lastName,
      'country': country,
      'phone_number': phoneNumber,
      'email': email,
      'is_favorite': isFavorite,
      'created_at': createdAt.toIso8601String(),
      'last_used_at': lastUsedAt?.toIso8601String(),
      'transaction_count': transactionCount,
    };
  }

  String get displayName {
    if (nickname != null && nickname!.isNotEmpty) return nickname!;
    if (firstName != null && lastName != null) return '$firstName $lastName';
    if (firstName != null) return firstName!;
    return truequeId;
  }

  Beneficiary copyWith({
    String? id,
    String? userId,
    String? truequeId,
    String? nickname,
    String? firstName,
    String? lastName,
    String? country,
    String? phoneNumber,
    String? email,
    bool? isFavorite,
    DateTime? createdAt,
    DateTime? lastUsedAt,
    int? transactionCount,
  }) {
    return Beneficiary(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      truequeId: truequeId ?? this.truequeId,
      nickname: nickname ?? this.nickname,
      firstName: firstName ?? this.firstName,
      lastName: lastName ?? this.lastName,
      country: country ?? this.country,
      phoneNumber: phoneNumber ?? this.phoneNumber,
      email: email ?? this.email,
      isFavorite: isFavorite ?? this.isFavorite,
      createdAt: createdAt ?? this.createdAt,
      lastUsedAt: lastUsedAt ?? this.lastUsedAt,
      transactionCount: transactionCount ?? this.transactionCount,
    );
  }
}
