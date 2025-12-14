import 'package:flutter/material.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/offer.dart';
import '../models/user.dart';
import '../services/settlement_service.dart';
import '../services/dispute_service.dart';

class MatchScreen extends StatefulWidget {
  final Offer offer;
  final String baseUrl;
  final String currentUserId;

  const MatchScreen({
    Key? key,
    required this.offer,
    required this.baseUrl,
    required this.currentUserId,
  }) : super(key: key);

  @override
  State<MatchScreen> createState() => _MatchScreenState();
}

class _MatchScreenState extends State<MatchScreen> {
  Map<String, dynamic>? matchResult;
  bool isLoading = false;
  String? errorMessage;

  @override
  void initState() {
    super.initState();
    triggerMatch();
  }

  Future<void> triggerMatch() async {
    setState(() {
      isLoading = true;
      errorMessage = null;
    });

    try {
      final response = await http.post(
        Uri.parse('${widget.baseUrl}/api/match'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'uuid': widget.offer.uuid,
          'counterparty_uuid': widget.offer.counterpartyId,
        }),
      );

      if (response.statusCode == 200) {
        setState(() {
          matchResult = jsonDecode(response.body);
          isLoading = false;
        });
      } else {
        throw Exception('Match failed: ${response.statusCode}');
      }
    } catch (e) {
      setState(() {
        errorMessage = e.toString();
        isLoading = false;
      });
    }
  }

  Future<void> _proceedToConfirmation() async {
    if (matchResult == null) return;

    final counterpartyData = matchResult!['counterparty'];
    final User? counterparty = counterpartyData != null
        ? User(
            id: 'mock_cp_id',
            truequeId: counterpartyData['trueque_id'] ?? 'unknown',
            email: '',
            country: counterpartyData['country'] ?? 'unknown',
            kycStatus: (counterpartyData['kyc_verified'] ?? false) ? 'verified' : 'unverified',
            createdAt: DateTime.now(),
            firstName: counterpartyData['name'] ?? 'Unknown',
          )
        : null;

    Navigator.pushNamed(
      context,
      '/confirm-transaction',
      arguments: {
        'offer': widget.offer,
        'counterparty': counterparty,
        'exchangeRate': (matchResult!['market_rate_used'] as num).toDouble(),
        'fee': 1.5, // Mock fee
        'feePercentage': 1.5, // Mock fee percentage
      },
    );
  }

  Future<void> disputeMatch() async {
    final disputeService = DisputeService(baseUrl: widget.baseUrl);

    try {
      final result = await disputeService.flagDispute(
        offerId: widget.offer.id,
        pin: '1234', // Replace with secure PIN input
      );
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(result['message'] ?? 'Dispute flagged')),
      );
      Navigator.pop(context);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Dispute failed: $e')),
      );
    }
  }

  double matchQuality(double rate, String country) {
    final toleranceMap = {
      "CO": 0.01, "MX": 0.008, "BR": 0.008, "AR": 0.015,
      "VE": 0.02, "US": 0.005, "ES": 0.005,
    };
    final tol = toleranceMap[country] ?? 0.005;
    final diff = (rate - widget.offer.marketRate).abs();
    if (diff < widget.offer.marketRate * tol * 0.4) return 5;
    if (diff < widget.offer.marketRate * tol * 0.7) return 4;
    if (diff < widget.offer.marketRate * tol) return 3;
    return 2;
  }

  @override
  Widget build(BuildContext context) {
    final stars = matchResult != null
        ? matchQuality((matchResult!['market_rate_used'] as num).toDouble(), widget.offer.country)
        : 0;

    return Scaffold(
      appBar: AppBar(title: const Text('Match Found')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: isLoading
            ? const Center(child: CircularProgressIndicator())
            : errorMessage != null
                ? Text('Error: $errorMessage', style: const TextStyle(color: Colors.red))
                : matchResult == null
                    ? const Text('No match result available.')
                    : Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Matched Offer:', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 10),
                          Text('Currency: ${widget.offer.currencyFrom} → ${widget.offer.currencyTo}'),
                          Text('Amount: ${widget.offer.amount.toStringAsFixed(2)}'),
                          Text('Market Rate Used: ${matchResult!['market_rate_used']}'),
                          Text('Rate Source: ${matchResult!['rate_source']}'),
                          Text('Fallback Used: ${matchResult!['rate_fallback']}'),
                          if (matchResult!['rate_reason'] != null)
                            Text('Reason: ${matchResult!['rate_reason']}'),
                          Text('Timestamp: ${matchResult!['timestamp']}'),
                          Row(
                            children: List.generate(stars.toInt(), (index) => const Icon(Icons.star, color: Colors.amber)),
                          ),
                          const SizedBox(height: 20),
                          ElevatedButton(
                            onPressed: _proceedToConfirmation,
                            child: const Text('Confirm Settlement'),
                          ),
                          ElevatedButton(
                            onPressed: disputeMatch,
                            child: const Text('Dispute Match'),
                            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
                          ),
                        ],
                      ),
      ),
    );
  }
}