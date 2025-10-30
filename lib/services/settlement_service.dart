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
}