import 'package:http/http.dart' as http;
import 'dart:convert';

class DisputeService {
  final String baseUrl;

  DisputeService({required this.baseUrl});

  Future<Map<String, dynamic>> flagDispute({
    required int offerId,
    required String pin,
  }) async {
    final url = Uri.parse('$baseUrl/dispute');
    final response = await http.post(
      url,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'offer_id': offerId,
        'pin': pin,
      }),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception(jsonDecode(response.body)['detail'] ?? 'Dispute failed');
    }
  }
}