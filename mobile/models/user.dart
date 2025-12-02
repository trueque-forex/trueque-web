class User {
  final String id;
  final String truequeId;
  final String email;
  final String? phoneNumber;
  final String country;
  final String? firstName;
  final String? lastName;
  final String kycStatus; // 'pending', 'verified', 'rejected', 'not_started'
  final DateTime createdAt;
  final DateTime? updatedAt;
  final bool isAdmin;

  User({
    required this.id,
    required this.truequeId,
    required this.email,
    this.phoneNumber,
    required this.country,
    this.firstName,
    this.lastName,
    required this.kycStatus,
    required this.createdAt,
    this.updatedAt,
    this.isAdmin = false,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'].toString(),
      truequeId: json['trueque_id'] ?? json['truequeId'] ?? '',
      email: json['email'] ?? '',
      phoneNumber: json['phone_number'] ?? json['phoneNumber'],
      country: json['country'] ?? '',
      firstName: json['first_name'] ?? json['firstName'],
      lastName: json['last_name'] ?? json['lastName'],
      kycStatus: json['kyc_status'] ?? json['kycStatus'] ?? 'not_started',
      createdAt: json['created_at'] != null 
          ? DateTime.parse(json['created_at']) 
          : DateTime.now(),
      updatedAt: json['updated_at'] != null 
          ? DateTime.parse(json['updated_at']) 
          : null,
      isAdmin: json['is_admin'] ?? json['isAdmin'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'trueque_id': truequeId,
      'email': email,
      'phone_number': phoneNumber,
      'country': country,
      'first_name': firstName,
      'last_name': lastName,
      'kyc_status': kycStatus,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt?.toIso8601String(),
      'is_admin': isAdmin,
    };
  }

  String get displayName {
    if (firstName != null && lastName != null) {
      return '$firstName $lastName';
    }
    if (firstName != null) return firstName!;
    return truequeId;
  }

  bool get isKycVerified => kycStatus == 'verified';
  bool get isKycPending => kycStatus == 'pending';
  bool get isKycRejected => kycStatus == 'rejected';

  User copyWith({
    String? id,
    String? truequeId,
    String? email,
    String? phoneNumber,
    String? country,
    String? firstName,
    String? lastName,
    String? kycStatus,
    DateTime? createdAt,
    DateTime? updatedAt,
    bool? isAdmin,
  }) {
    return User(
      id: id ?? this.id,
      truequeId: truequeId ?? this.truequeId,
      email: email ?? this.email,
      phoneNumber: phoneNumber ?? this.phoneNumber,
      country: country ?? this.country,
      firstName: firstName ?? this.firstName,
      lastName: lastName ?? this.lastName,
      kycStatus: kycStatus ?? this.kycStatus,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      isAdmin: isAdmin ?? this.isAdmin,
    );
  }
}
