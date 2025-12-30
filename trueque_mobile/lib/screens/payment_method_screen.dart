import 'package:flutter/material.dart';
import '../models/offer.dart';
import '../models/user.dart';
import 'confirm_transaction_screen.dart'; // Import existing confirmation screen

class PaymentMethodScreen extends StatefulWidget {
  final Offer offer;
  final Map<String, dynamic> selectedMatch;
  final Map<String, dynamic> beneficiary;

  const PaymentMethodScreen({
    Key? key,
    required this.offer,
    required this.selectedMatch,
    required this.beneficiary,
  }) : super(key: key);

  @override
  State<PaymentMethodScreen> createState() => _PaymentMethodScreenState();
}

class _PaymentMethodScreenState extends State<PaymentMethodScreen> {
  // Mock payment methods
  final List<Map<String, dynamic>> _methods = [
    {
      'id': 'pm_1',
      'name': 'Chase Checking',
      'details': '**** 9999',
      'type': 'Bank Transfer',
    },
    {
      'id': 'pm_2',
      'name': 'Visa Debit',
      'details': '**** 4444',
      'type': 'Debit Card',
    },
  ];

  String? _selectedMethodId;

  void _proceed() {
    if (_selectedMethodId == null) return;

    final selectedMethod = _methods.firstWhere((m) => m['id'] == _selectedMethodId);

    // Construct Counterparty User object from match data
    // existing ConfirmTransactionScreen expects a User object
    final matchCp = widget.selectedMatch['counterparty'];
    final counterparty = User(
      id: 'mock_cp_id',
      truequeId: 'TRQ-MOCK-001',
      email: '',
      country: 'MX', // infer from somewhere if possible
      kycStatus: 'verified',
      createdAt: DateTime.now(),
      firstName: matchCp['name'],
    );

    // Navigate to Existing ConfirmTransactionScreen
    // passing the gathered data
    Navigator.pushNamed(
      context,
      '/confirm-transaction',
      arguments: {
        'offer': widget.offer,
        'counterparty': counterparty,
        'exchangeRate': widget.selectedMatch['rate'],
        'fee': 1.5,
        'feePercentage': 1.5,
        'beneficiary': widget.beneficiary, // Pass these if ConfirmScreen supports them
        'paymentMethod': selectedMethod,   // or just context
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Select Payment Method')),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              itemCount: _methods.length,
              itemBuilder: (context, index) {
                final method = _methods[index];
                return RadioListTile<String>(
                  title: Text(method['name']),
                  subtitle: Text('${method['type']} • ${method['details']}'),
                  value: method['id'],
                  groupValue: _selectedMethodId,
                  onChanged: (value) {
                    setState(() {
                      _selectedMethodId = value;
                    });
                  },
                );
              },
            ),
          ),

          Container(
            padding: const EdgeInsets.all(16.0),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.black12,
                  blurRadius: 4,
                  offset: Offset(0, -2),
                ),
              ],
            ),
            child: SafeArea(
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _selectedMethodId != null ? _proceed : null,
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: const Text('Review Transaction'),
                ),
              ),
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Add Payment Method - Coming Soon')));
        },
        child: const Icon(Icons.add),
      ),
    );
  }
}
