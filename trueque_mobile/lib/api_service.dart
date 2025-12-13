import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/user.dart';
import '../models/transaction.dart';
import '../models/beneficiary.dart';
import '../models/payment_method.dart';

class ApiException implements Exception {
  final String message;
  final int? statusCode;
  
  ApiException(this.message, {this.statusCode});
  
  @override
  String toString() => message;
}

class ApiService {
  static const String baseUrl = 'http://localhost:3000'; // TODO: Use environment config
  static String? _authToken;
  static User? _currentUser;

  // Auth Token Management
  static void setAuthToken(String token) {
    _authToken = token;
  }

  static String? getAuthToken() => _authToken;

  static void clearAuth() {
    _authToken = null;
    _currentUser = null;
  }

  static User? getCurrentUser() => _currentUser;

  // HTTP Helper Methods
  static Map<String, String> _getHeaders({bool includeAuth = true}) {
    final headers = {
      'Content-Type': 'application/json',
    };
    
    if (includeAuth && _authToken != null) {
      headers['Authorization'] = 'Bearer $_authToken';
    }
    return headers;
  }

  // ==================== User Profile ====================

  static Future<User> getUserProfile() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/user/profile'),
        headers: _getHeaders(),
      );

      final data = await _handleResponse(response);
      _currentUser = User.fromJson(data);
      return _currentUser!;
    } catch (e) {
      throw ApiException('Failed to fetch user profile: ${e.toString()}');
    }
  }

  static Future<User> updateUserProfile({
    String? firstName,
    String? lastName,
    String? phoneNumber,
  }) async {
    try {
      final response = await http.put(
        Uri.parse('$baseUrl/api/user/profile'),
        headers: _getHeaders(),
        body: jsonEncode({
          if (firstName != null) 'first_name': firstName,
          if (lastName != null) 'last_name': lastName,
          if (phoneNumber != null) 'phone_number': phoneNumber,
        }),
      );

      final data = await _handleResponse(response);
      _currentUser = User.fromJson(data);
      return _currentUser!;
    } catch (e) {
      throw ApiException('Failed to update profile: ${e.toString()}');
    }
  }

  // ==================== KYC ====================

  static Future<Map<String, dynamic>> submitKyc({
    required String firstName,
    required String lastName,
    required String dateOfBirth,
    required String documentType,
    required String documentNumber,
    required String address,
    required String city,
    required String postalCode,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/kyc/submit'),
        headers: _getHeaders(),
        body: jsonEncode({
          'first_name': firstName,
          'last_name': lastName,
          'date_of_birth': dateOfBirth,
          'document_type': documentType,
          'document_number': documentNumber,
          'address': address,
          'city': city,
          'postal_code': postalCode,
        }),
      );

      return await _handleResponse(response);
    } catch (e) {
      throw ApiException('KYC submission failed: ${e.toString()}');
    }
  }

  static Future<Map<String, dynamic>> getKycStatus() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/kyc/status'),
        headers: _getHeaders(),
      );

      return await _handleResponse(response);
    } catch (e) {
      throw ApiException('Failed to fetch KYC status: ${e.toString()}');
    }
  }

  // ==================== Offers ====================

  static Future<Map<String, dynamic>> createOffer({
    required String currencyFrom,
    required String currencyTo,
    required double amount,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/offers/create'),
        headers: _getHeaders(),
        body: jsonEncode({
          'currency_from': currencyFrom,
          'currency_to': currencyTo,
          'amount': amount,
        }),
      );

      return await _handleResponse(response);
    } catch (e) {
      throw ApiException('Failed to create offer: ${e.toString()}');
    }
  }

  static Future<List<Map<String, dynamic>>> getOffers() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/offers'),
        headers: _getHeaders(),
      );

      final data = await _handleResponse(response);
      return (data['offers'] as List).cast<Map<String, dynamic>>();
    } catch (e) {
      throw ApiException('Failed to fetch offers: ${e.toString()}');
    }
  }

  // ==================== Transactions ====================

  static Future<Transaction> createTransaction({
    required String currencyFrom,
    required String currencyTo,
    required double amount,
    String? beneficiaryId,
    String? paymentMethodId,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/transactions/create'),
        headers: _getHeaders(),
        body: jsonEncode({
          'currency_from': currencyFrom,
          'currency_to': currencyTo,
          'amount': amount,
          if (beneficiaryId != null) 'beneficiary_id': beneficiaryId,
          if (paymentMethodId != null) 'payment_method_id': paymentMethodId,
        }),
      );

      final data = await _handleResponse(response);
      return Transaction.fromJson(data);
    } catch (e) {
      throw ApiException('Failed to create transaction: ${e.toString()}');
    }
  }

  static Future<List<Transaction>> getTransactionHistory() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/transactions/history'),
        headers: _getHeaders(),
      );

      final data = await _handleResponse(response);
      final transactions = (data['transactions'] as List)
          .map((json) => Transaction.fromJson(json))
          .toList();
      return transactions;
    } catch (e) {
      throw ApiException('Failed to fetch transaction history: ${e.toString()}');
    }
  }

  static Future<Transaction> getTransactionById(String id) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/transactions/$id'),
        headers: _getHeaders(),
      );

      final data = await _handleResponse(response);
      return Transaction.fromJson(data);
    } catch (e) {
      throw ApiException('Failed to fetch transaction: ${e.toString()}');
    }
  }

  // ==================== Beneficiaries ====================

  static Future<List<Beneficiary>> getBeneficiaries() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/beneficiaries'),
        headers: _getHeaders(),
      );

      final data = await _handleResponse(response);
      final beneficiaries = (data['beneficiaries'] as List)
          .map((json) => Beneficiary.fromJson(json))
          .toList();
      return beneficiaries;
    } catch (e) {
      throw ApiException('Failed to fetch beneficiaries: ${e.toString()}');
    }
  }

  static Future<Beneficiary> addBeneficiary({
    required String truequeId,
    String? nickname,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/beneficiaries/add'),
        headers: _getHeaders(),
        body: jsonEncode({
          'trueque_id': truequeId,
          if (nickname != null) 'nickname': nickname,
        }),
      );

      final data = await _handleResponse(response);
      return Beneficiary.fromJson(data);
    } catch (e) {
      throw ApiException('Failed to add beneficiary: ${e.toString()}');
    }
  }

  // ==================== Payment Methods ====================

  static Future<List<PaymentMethod>> getPaymentMethods() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/payment-methods'),
        headers: _getHeaders(),
      );

      final data = await _handleResponse(response);
      final methods = (data['payment_methods'] as List)
          .map((json) => PaymentMethod.fromJson(json))
          .toList();
      return methods;
    } catch (e) {
      throw ApiException('Failed to fetch payment methods: ${e.toString()}');
    }
  }

  static Future<PaymentMethod> addPaymentMethod({
    required String type,
    required String provider,
    required String accountNumber,
    required String currency,
    String? accountHolderName,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/payment-methods/add'),
        headers: _getHeaders(),
        body: jsonEncode({
          'type': type,
          'provider': provider,
          'account_number': accountNumber,
          'currency': currency,
          if (accountHolderName != null) 'account_holder_name': accountHolderName,
        }),
      );

      final data = await _handleResponse(response);
      return PaymentMethod.fromJson(data);
    } catch (e) {
      throw ApiException('Failed to add payment method: ${e.toString()}');
    }
  }

  // ==================== Exchange Rates ====================

  static Future<Map<String, dynamic>> getExchangeRate({
    required String from,
    required String to,
  }) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/rates?from=$from&to=$to'),
        headers: _getHeaders(includeAuth: false),
      );

      return await _handleResponse(response);
    } catch (e) {
      throw ApiException('Failed to fetch exchange rate: ${e.toString()}');
    }
  }
  static Future<Map<String, dynamic>> _handleResponse(http.Response response) async {
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return jsonDecode(response.body);
    } else {
      throw ApiException(
        'Request failed with status: ${response.statusCode}',
        statusCode: response.statusCode,
      );
    }
  }
}
