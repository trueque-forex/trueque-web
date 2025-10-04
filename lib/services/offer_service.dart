import 'package:http/http.dart' as http;
import 'dart:convert';
import '../models/offer.dart';

class OfferService {
  final String baseUrl = 'https://your-api-url.com'; // Replace with actual

  Future<Offer> createOffer(Offer offer) async {
    final response = await http.post(
      Uri.parse('$baseUrl/offers'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'uuid': offer.uuid,
        'country': offer.country,
        'currency_from': offer.currencyFrom,
        'currency_to': offer.currencyTo,
        'amount': offer.amount,
      }),
    );

    if (response.statusCode == 200) {
      return Offer.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Failed to create offer');
    }
  }

  Future<void> settleOffer(String uuid) async {
    final response = await http.post(
      Uri.parse('$baseUrl/settle'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'uuid': uuid}),
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to settle offer');
    }
  }

  Future<void> disputeOffer(String uuid) async {
    final response = await http.post(
      Uri.parse('$baseUrl/dispute'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'uuid': uuid}),
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to dispute offer');
    }
  }
}