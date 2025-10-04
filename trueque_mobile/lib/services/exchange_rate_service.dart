import 'dart:convert';
import 'package:http/http.dart' as http;

class ExchangeRateResponse {
  final double rate;
  final String timestamp;

  ExchangeRateResponse({required this.rate, required this.timestamp});
}

class ExchangeRateService {
  static Future<ExchangeRateResponse?> fetchRate(String from, String to) async {
    final response = await http.get(
      Uri.parse('http://localhost:8000/rates?from=$from&to=$to'),
    );
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return ExchangeRateResponse(
        rate: data['rate'],
        timestamp: data['timestamp'],
      );
    }
    return null;
  }
}