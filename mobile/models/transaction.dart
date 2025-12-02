class Transaction {
  final String id;
  final String userId;
  final String? counterpartyId;
  final String currencyFrom;
  final String currencyTo;
  final double amount;
  final double amountReceived;
  final double exchangeRate;
  final double marketRate;
  final double fee;
  final double feePercentage;
  final String status; // 'pending', 'processing', 'completed', 'failed', 'disputed', 'cancelled'
  final String? paymentMethod;
  final String? paymentReference;
  final DateTime createdAt;
  final DateTime? completedAt;
  final String? errorMessage;
  final Map<String, dynamic>? metadata;

  Transaction({
    required this.id,
    required this.userId,
    this.counterpartyId,
    required this.currencyFrom,
    required this.currencyTo,
    required this.amount,
    required this.amountReceived,
    required this.exchangeRate,
    required this.marketRate,
    required this.fee,
    required this.feePercentage,
    required this.status,
    this.paymentMethod,
    this.paymentReference,
    required this.createdAt,
    this.completedAt,
    this.errorMessage,
    this.metadata,
  });

  factory Transaction.fromJson(Map<String, dynamic> json) {
    return Transaction(
      id: json['id'].toString(),
      userId: json['user_id']?.toString() ?? json['userId']?.toString() ?? '',
      counterpartyId: json['counterparty_id']?.toString() ?? json['counterpartyId']?.toString(),
      currencyFrom: json['currency_from'] ?? json['currencyFrom'] ?? '',
      currencyTo: json['currency_to'] ?? json['currencyTo'] ?? '',
      amount: (json['amount'] ?? 0).toDouble(),
      amountReceived: (json['amount_received'] ?? json['amountReceived'] ?? 0).toDouble(),
      exchangeRate: (json['exchange_rate'] ?? json['exchangeRate'] ?? 0).toDouble(),
      marketRate: (json['market_rate'] ?? json['marketRate'] ?? 0).toDouble(),
      fee: (json['fee'] ?? 0).toDouble(),
      feePercentage: (json['fee_percentage'] ?? json['feePercentage'] ?? 0).toDouble(),
      status: json['status'] ?? 'pending',
      paymentMethod: json['payment_method'] ?? json['paymentMethod'],
      paymentReference: json['payment_reference'] ?? json['paymentReference'],
      createdAt: json['created_at'] != null 
          ? DateTime.parse(json['created_at']) 
          : DateTime.now(),
      completedAt: json['completed_at'] != null 
          ? DateTime.parse(json['completed_at']) 
          : null,
      errorMessage: json['error_message'] ?? json['errorMessage'],
      metadata: json['metadata'] as Map<String, dynamic>?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'counterparty_id': counterpartyId,
      'currency_from': currencyFrom,
      'currency_to': currencyTo,
      'amount': amount,
      'amount_received': amountReceived,
      'exchange_rate': exchangeRate,
      'market_rate': marketRate,
      'fee': fee,
      'fee_percentage': feePercentage,
      'status': status,
      'payment_method': paymentMethod,
      'payment_reference': paymentReference,
      'created_at': createdAt.toIso8601String(),
      'completed_at': completedAt?.toIso8601String(),
      'error_message': errorMessage,
      'metadata': metadata,
    };
  }

  bool get isPending => status == 'pending';
  bool get isProcessing => status == 'processing';
  bool get isCompleted => status == 'completed';
  bool get isFailed => status == 'failed';
  bool get isDisputed => status == 'disputed';
  bool get isCancelled => status == 'cancelled';

  double get effectiveRate => amountReceived / amount;
  double get rateDifference => ((effectiveRate - marketRate) / marketRate * 100);
  
  String get statusDisplay {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'processing':
        return 'Processing';
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      case 'disputed':
        return 'Disputed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  }

  Transaction copyWith({
    String? id,
    String? userId,
    String? counterpartyId,
    String? currencyFrom,
    String? currencyTo,
    double? amount,
    double? amountReceived,
    double? exchangeRate,
    double? marketRate,
    double? fee,
    double? feePercentage,
    String? status,
    String? paymentMethod,
    String? paymentReference,
    DateTime? createdAt,
    DateTime? completedAt,
    String? errorMessage,
    Map<String, dynamic>? metadata,
  }) {
    return Transaction(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      counterpartyId: counterpartyId ?? this.counterpartyId,
      currencyFrom: currencyFrom ?? this.currencyFrom,
      currencyTo: currencyTo ?? this.currencyTo,
      amount: amount ?? this.amount,
      amountReceived: amountReceived ?? this.amountReceived,
      exchangeRate: exchangeRate ?? this.exchangeRate,
      marketRate: marketRate ?? this.marketRate,
      fee: fee ?? this.fee,
      feePercentage: feePercentage ?? this.feePercentage,
      status: status ?? this.status,
      paymentMethod: paymentMethod ?? this.paymentMethod,
      paymentReference: paymentReference ?? this.paymentReference,
      createdAt: createdAt ?? this.createdAt,
      completedAt: completedAt ?? this.completedAt,
      errorMessage: errorMessage ?? this.errorMessage,
      metadata: metadata ?? this.metadata,
    );
  }
}
