import 'package:flutter/material.dart';
import '../services/offer_service.dart';
import '../models/offer.dart';

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
      final offer = Offer(
        id: 0,
        uuid: widget.uuid,
        country: widget.country,
        currencyFrom: currencyFrom,
        currencyTo: currencyTo,
        amount: amount,
        marketRate: 0,
        status: 'open',
      );

      final result = await offerService.createOffer(offer);
      if (result.status == 'matched') {
        Navigator.pushNamed(context, '/match', arguments: result);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Offer posted. Waiting for match.')),
        );
      }
    }
  }

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
                value: currencyFrom,
                items: ['COP', 'USD', 'VES', 'EUR'].map((c) => DropdownMenuItem(value: c, child: Text(c))).toList(),
                onChanged: (val) => setState(() => currencyFrom = val!),
                decoration: InputDecoration(labelText: 'Currency From'),
              ),
              DropdownButtonFormField<String>(
                value: currencyTo,
                items: ['USD', 'COP', 'VES', 'EUR'].map((c) => DropdownMenuItem(value: c, child: Text(c))).toList(),
                onChanged: (val) => setState(() => currencyTo = val!),
                decoration: InputDecoration(labelText: 'Currency To'),
              ),
              TextFormField(
                decoration: InputDecoration(labelText: 'Amount'),
                keyboardType: TextInputType.number,
                onChanged: (val) => amount = double.tryParse(val) ?? 0,
              ),
              SizedBox(height: 20),
              ElevatedButton(onPressed: submitOffer, child: Text('Submit Offer')),
            ],
          ),
        ),
      ),
    );
  }
}