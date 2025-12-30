import 'package:flutter/material.dart';
import '../models/offer.dart';
import '../models/user.dart';
import 'beneficiary_screen.dart';

class MatchSelectionScreen extends StatefulWidget {
  final Offer offer;

  const MatchSelectionScreen({Key? key, required this.offer}) : super(key: key);

  @override
  State<MatchSelectionScreen> createState() => _MatchSelectionScreenState();
}

class _MatchSelectionScreenState extends State<MatchSelectionScreen> {
  // Mock list of matches
  final List<Map<String, dynamic>> _matches = [
    {
      'id': 'match_1',
      'rate': 4000.0,
      'amount': 100.0,
      'counterparty': {
        'name': 'Carlos Méndez',
        'rating': 4.8,
        'trades': 156,
      },
      'speed': 'Instant',
    },
    {
      'id': 'match_2',
      'rate': 3995.0,
      'amount': 100.0,
      'counterparty': {
        'name': 'Ana García',
        'rating': 4.9,
        'trades': 89,
      },
      'speed': '15 min',
    },
    {
      'id': 'match_3',
      'rate': 3990.0,
      'amount': 100.0,
      'counterparty': {
        'name': 'Roberto Silva',
        'rating': 4.5,
        'trades': 42,
      },
      'speed': '1 hour',
    },
  ];

  void _selectMatch(Map<String, dynamic> match) {
    // Navigate to Beneficiary Screen
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => BeneficiaryScreen(
          offer: widget.offer,
          selectedMatch: match,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Select a Match')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Text(
              'Best matches for ${widget.offer.amount} ${widget.offer.currencyFrom}',
              style: Theme.of(context).textTheme.titleMedium,
            ),
          ),
          Expanded(
            child: ListView.builder(
              itemCount: _matches.length,
              itemBuilder: (context, index) {
                final match = _matches[index];
                final cp = match['counterparty'];
                return Card(
                  margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  child: ListTile(
                    leading: CircleAvatar(child: Text(cp['name'][0])),
                    title: Text(cp['name']),
                    subtitle: Text('Rate: ${match['rate']} • Speed: ${match['speed']}'),
                    trailing: ElevatedButton(
                      onPressed: () => _selectMatch(match),
                      child: const Text('Select'),
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
