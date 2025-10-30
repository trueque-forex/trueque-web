import 'package:flutter/material.dart';
import '../models/offer.dart';
import '../services/offer_service.dart';

class HistoryScreen extends StatefulWidget {
  final String uuid;

  HistoryScreen({required this.uuid});

  @override
  _HistoryScreenState createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  List<Offer> offers = [];
  final offerService = OfferService();

  @override
  void initState() {
    super.initState();
    fetchHistory();
  }

  void fetchHistory() async {
    final result = await offerService.getHistory(widget.uuid);
    setState(() => offers = result);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Offer History')),
      body: ListView.builder(
        itemCount: offers.length,
        itemBuilder: (context, index) {
          final offer = offers[index];
          return ListTile(
            title: Text('${offer.currencyFrom} → ${offer.currencyTo}'),
            subtitle: Text('Amount: ${offer.amount}, Status: ${offer.status}'),
            trailing: Text('Rate: ${offer.marketRate.toStringAsFixed(2)}'),
          );
        },
      ),
    );
  }
}