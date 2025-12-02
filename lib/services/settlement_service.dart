import 'dart:convert';
import 'package:http/http.dart' as http;

class SettlementService {
  static Future<bool> sendSettlement({
    required String txId,
    required String from,
    required String to,
    required double amount,
    required double rate,
    required String timestamp,
    required String userId,
    required String status,
    required int confirmedByUserId,
  }) async {
    final response = await http.post(
      Uri.parse('http://localhost:8000/settle'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'tx_id': txId,
        'from_currency': from,
        'to_currency': to,
        'amount': amount,
        'rate': rate,
        'timestamp': timestamp,
        'user_id': userId,
        'status': status,
        'confirmed_by_user_id': confirmedByUserId,
      }),
    );

    return response.statusCode == 200;
  }

  static Future<String> getTransactionStatus(String transactionId) async {
    try {
      final response = await http.get(
        Uri.parse('http://localhost:8000/transaction/$transactionId/status'),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['status'] ?? 'pending';
      }
      return 'pending';
    } catch (e) {
      return 'pending';
    }
  }
}