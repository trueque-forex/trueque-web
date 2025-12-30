import 'package:flutter/material.dart';
import '../services/offer_service.dart';
import '../models/offer.dart';
import 'match_selection_screen.dart';

class OfferScreen extends StatefulWidget {
  final String uuid;
  final String country;

  OfferScreen({required this.uuid, required this.country});

  @override
  _OfferScreenState createState() => _OfferScreenState();
}

class _OfferScreenState extends State<OfferScreen> {
  final _formKey = GlobalKey<FormState>();
  String currencyFrom = 'COP';
  String currencyTo = 'USD';
  double amount = 0;

  final offerService = OfferService();

  void submitOffer() async {
    if (_formKey.currentState!.validate()) {
      try {
        print('DEBUG: Validating form...');
        final offer = Offer(
          id: 0,
          uuid: 'tmp-${DateTime.now().millisecondsSinceEpoch}', // Temporary UUID
          userId: widget.uuid,
          country: widget.country,
          currencyFrom: currencyFrom,
          currencyTo: currencyTo,
          amount: amount,
          marketRate: 0,
          status: 'open',
        );

        print('DEBUG: Sending offer to API... ${offer.amount} ${offer.currencyFrom}->${offer.currencyTo}');
        final result = await offerService.createOffer(offer);
        print('DEBUG: API Response received: ${result.status}');
        
        if (!mounted) {
           print('DEBUG: Context not mounted, skipping navigation');
           return;
        }

        if (result.status == 'matched' || result.status == 'open') {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => MatchSelectionScreen(offer: result),
            ),
          );
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Offer posted. Waiting for match.')),
          );
        }
      } catch (e) {
        print('DEBUG: ERROR caught: $e');
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${e.toString()}')),
        );
      }
    }
  }

  final List<Map<String, String>> _currencies = [
    {'code': 'ARS', 'flag': '🇦🇷', 'country': 'Argentina'},
    {'code': 'BOB', 'flag': '🇧🇴', 'country': 'Bolivia'},
    {'code': 'BRL', 'flag': '🇧🇷', 'country': 'Brazil'},
    {'code': 'COP', 'flag': '🇨🇴', 'country': 'Colombia'},
    {'code': 'USD', 'flag': '🇸🇻', 'country': 'El Salvador'},
    {'code': 'GTQ', 'flag': '🇬🇹', 'country': 'Guatemala'},
    {'code': 'MXN', 'flag': '🇲🇽', 'country': 'Mexico'},
    {'code': 'EUR', 'flag': '🇵🇹', 'country': 'Portugal'}, // Also Spain
    {'code': 'USD', 'flag': '🇺🇸', 'country': 'USA'},
    {'code': 'VES', 'flag': '🇻🇪', 'country': 'Venezuela'},
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Create Offer')),
      body: Padding(
        padding: EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              DropdownButtonFormField<String>(
                key: Key('currency_from'),
                value: currencyFrom != null ? '${currencyFrom}_${_currencies.firstWhere((c) => c['code'] == currencyFrom, orElse: () => _currencies.first)['country']}' : null,
                items: _currencies.map((c) {
                  final uniqueValue = '${c['code']}_${c['country']}';
                  return DropdownMenuItem(
                    value: uniqueValue,
                    child: Text('${c['flag']} ${c['country']} (${c['code']})'),
                  );
                }).toList(),
                onChanged: (val) => setState(() => currencyFrom = val!.split('_')[0]),
                decoration: InputDecoration(labelText: 'Currency From'),
              ),
              SizedBox(height: 16),
              DropdownButtonFormField<String>(
                key: Key('currency_to'),
                value: currencyTo != null ? '${currencyTo}_${_currencies.firstWhere((c) => c['code'] == currencyTo, orElse: () => _currencies.first)['country']}' : null, // Best effort initial value
                items: _currencies.map((c) {
                  final uniqueValue = '${c['code']}_${c['country']}';
                  return DropdownMenuItem(
                    value: uniqueValue,
                    child: Text('${c['flag']} ${c['country']} (${c['code']})'),
                  );
                }).toList(),
                onChanged: (val) => setState(() => currencyTo = val!.split('_')[0]),
                decoration: InputDecoration(labelText: 'Currency To'),
              ),
              SizedBox(height: 16),
              TextFormField(
                key: Key('amount'),
                decoration: InputDecoration(labelText: 'Amount'),
                keyboardType: TextInputType.numberWithOptions(decimal: true),
                onChanged: (val) {
                  // Handle commas as decimal points for locale compatibility
                  final cleanVal = val.replaceAll(',', '.');
                  amount = double.tryParse(cleanVal) ?? 0;
                },
                validator: (val) {
                  if (val == null || val.isEmpty) return 'Required';
                  final cleanVal = val.replaceAll(',', '.');
                  final n = double.tryParse(cleanVal);
                  if (n == null || n <= 0) return 'Enter a valid amount (> 0)';
                  return null;
                },
              ),
              SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  key: Key('submit_offer'),
                  onPressed: submitOffer,
                  style: ElevatedButton.styleFrom(
                    padding: EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: Text('Find Matches'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}