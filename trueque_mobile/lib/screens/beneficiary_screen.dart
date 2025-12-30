import 'package:flutter/material.dart';
import '../models/offer.dart';
import '../models/beneficiary.dart';
import '../api_service.dart';
import 'payment_method_screen.dart';
import 'add_beneficiary_screen.dart';

class BeneficiaryScreen extends StatefulWidget {
  final Offer offer;
  final Map<String, dynamic> selectedMatch;

  const BeneficiaryScreen({
    Key? key,
    required this.offer,
    required this.selectedMatch,
  }) : super(key: key);

  @override
  State<BeneficiaryScreen> createState() => _BeneficiaryScreenState();
}

class _BeneficiaryScreenState extends State<BeneficiaryScreen> {
  List<Map<String, dynamic>> _beneficiaries = [];
  bool _isLoading = true;
  String? _selectedBeneficiaryId;

  @override
  void initState() {
    super.initState();
    _fetchBeneficiaries();
  }

  Future<void> _fetchBeneficiaries() async {
    try {
      final beneficiaries = await ApiService.getBeneficiaries();
      setState(() {
        _beneficiaries = beneficiaries.map((b) => {
          'id': b.id,
          'name': b.name,
          'details': b.details,
          'type': b.method == 'bank_account' ? 'Bank Account' : b.method,
        }).toList();
        _isLoading = false;
      });
    } catch (e) {
      // Fallback to mock if API fails or empty
      setState(() {
         // Keep empty or show error
         _isLoading = false;
      });
      // Optionally show snackbar
    }
  }

  void _proceed() {
    if (_selectedBeneficiaryId == null) return;

    final selectedBeneficiary = _beneficiaries.firstWhere((b) => b['id'] == _selectedBeneficiaryId);

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => PaymentMethodScreen(
          offer: widget.offer,
          selectedMatch: widget.selectedMatch,
          beneficiary: selectedBeneficiary,
        ),
      ),
    );
  }

  Future<void> _navigateToAddBeneficiary() async {
    // Determine locked country based on destination currency
    String? fixedCountry;
    final currencyTo = widget.offer.currencyTo;

    if (currencyTo == 'USD') fixedCountry = 'US'; // Ambiguous (could be SV) but defaulting to US
    else if (currencyTo == 'COP') fixedCountry = 'CO';
    else if (currencyTo == 'MXN') fixedCountry = 'MX';
    else if (currencyTo == 'BRL') fixedCountry = 'BR';
    else if (currencyTo == 'ARS') fixedCountry = 'AR';
    else if (currencyTo == 'BOB') fixedCountry = 'BO';
    else if (currencyTo == 'GTQ') fixedCountry = 'GT';
    else if (currencyTo == 'EUR') fixedCountry = 'PT'; // Using Portugal as primary EUR destination per user context
    else if (currencyTo == 'VES') fixedCountry = 'VE';

    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => AddBeneficiaryScreen(fixedCountryCode: fixedCountry),
      ),
    );

    if (result != null && result is Beneficiary) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Beneficiary Added: ${result.name}'), backgroundColor: Colors.green),
        );
      }
      
      setState(() {
        _selectedBeneficiaryId = result.id;
        // Add to local list immediately to support auto-advance
        _beneficiaries.insert(0, {
          'id': result.id,
          'name': result.name,
          'details': result.details,
          'type': result.method == 'bank_account' ? 'Bank Account' : result.method,
        });
      });
      
      // Auto-advance removed per user preference ("I like the beneficiary list")
      // _proceed();

      // Refresh list to ensure sync
      _fetchBeneficiaries();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Select Beneficiary')),
      body: Column(
        children: [
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _beneficiaries.isEmpty
                    ? const Center(child: Text('No beneficiaries found. Add one!'))
                    : ListView.builder(
                        itemCount: _beneficiaries.length,
                        itemBuilder: (context, index) {
                          final ben = _beneficiaries[index];
                          return RadioListTile<String>(
                            title: Text(ben['name']),
                            subtitle: Text('${ben['type']} • ${ben['details']}'),
                            value: ben['id'],
                            groupValue: _selectedBeneficiaryId,
                            onChanged: (value) {
                              setState(() {
                                _selectedBeneficiaryId = value;
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
                  onPressed: _selectedBeneficiaryId != null ? _proceed : null,
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    backgroundColor: _selectedBeneficiaryId != null ? Theme.of(context).primaryColor : Colors.grey,
                  ),
                  child: Text(
                    'Continue to Payment',
                    style: TextStyle(
                      fontSize: 16, 
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _navigateToAddBeneficiary,
        child: const Icon(Icons.add),
        tooltip: 'Add Beneficiary',
      ),
    );
  }
}
