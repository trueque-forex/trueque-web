import 'package:flutter/material.dart';
import '../api_service.dart';

class AddBeneficiaryScreen extends StatefulWidget {
  final String? fixedCountryCode;

  const AddBeneficiaryScreen({Key? key, this.fixedCountryCode}) : super(key: key);

  @override
  _AddBeneficiaryScreenState createState() => _AddBeneficiaryScreenState();
}

class _AddBeneficiaryScreenState extends State<AddBeneficiaryScreen> {
  final _formKey = GlobalKey<FormState>();
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _bankNameController = TextEditingController();
  final _accountNumberController = TextEditingController();
  String _accountType = 'Checking';
  late String _country;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _country = widget.fixedCountryCode ?? 'US';
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      final beneficiary = await ApiService.addBeneficiary(
        firstName: _firstNameController.text,
        lastName: _lastNameController.text,
        bankName: _bankNameController.text,
        accountNumber: _accountNumberController.text,
        accountType: _accountType,
        country: _country,
      );

      if (mounted) {
        Navigator.pop(context, beneficiary); // Return the new beneficiary
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${e.toString()}')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Add Bank Account')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Account Holder', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _firstNameController,
                      decoration: InputDecoration(
                        labelText: 'First Name',
                        border: OutlineInputBorder(),
                      ),
                      validator: (val) => val == null || val.isEmpty ? 'Required' : null,
                    ),
                  ),
                  SizedBox(width: 10),
                  Expanded(
                    child: TextFormField(
                      controller: _lastNameController,
                      decoration: InputDecoration(
                        labelText: 'Last Name',
                        border: OutlineInputBorder(),
                      ),
                      validator: (val) => val == null || val.isEmpty ? 'Required' : null,
                    ),
                  ),
                ],
              ),
              SizedBox(height: 20),
              Text('Bank Details', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              SizedBox(height: 10),
              DropdownButtonFormField<String>(
                value: _country,
                decoration: InputDecoration(
                  labelText: 'Country',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.public),
                ),
                items: [
                  DropdownMenuItem(value: 'US', child: Text('🇺🇸 United States')),
                  DropdownMenuItem(value: 'CO', child: Text('🇨🇴 Colombia')),
                  DropdownMenuItem(value: 'MX', child: Text('🇲🇽 Mexico')),
                  DropdownMenuItem(value: 'BR', child: Text('🇧🇷 Brazil')),
                  DropdownMenuItem(value: 'AR', child: Text('🇦🇷 Argentina')),
                  DropdownMenuItem(value: 'BO', child: Text('🇧🇴 Bolivia')),
                  DropdownMenuItem(value: 'SV', child: Text('🇸🇻 El Salvador')),
                  DropdownMenuItem(value: 'GT', child: Text('🇬🇹 Guatemala')),
                  DropdownMenuItem(value: 'PT', child: Text('🇵🇹 Portugal')),
                  DropdownMenuItem(value: 'VE', child: Text('🇻🇪 Venezuela')),
                ],
                onChanged: widget.fixedCountryCode != null 
                    ? null 
                    : (val) => setState(() => _country = val!),
              ),
              SizedBox(height: 16),
              TextFormField(
                controller: _bankNameController,
                decoration: InputDecoration(
                  labelText: 'Bank Name',
                  hintText: 'e.g. Chase, Wells Fargo',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.account_balance),
                ),
                validator: (val) => val == null || val.isEmpty ? 'Required' : null,
              ),
              SizedBox(height: 16),
              TextFormField(
                controller: _accountNumberController,
                keyboardType: TextInputType.number,
                 decoration: InputDecoration(
                  labelText: 'Account Number',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.numbers),
                ),
                validator: (val) => val == null || val.isEmpty ? 'Required' : null,
              ),
              SizedBox(height: 16),
              DropdownButtonFormField<String>(
                value: _accountType,
                decoration: InputDecoration(
                  labelText: 'Account Type',
                  border: OutlineInputBorder(),
                ),
                items: ['Checking', 'Savings'].map((t) => DropdownMenuItem(value: t, child: Text(t))).toList(),
                onChanged: (val) => setState(() => _accountType = val!),
              ),
              SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _submit,
                  style: ElevatedButton.styleFrom(
                    padding: EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: _isLoading
                      ? CircularProgressIndicator(color: Colors.white)
                      : Text('Add Bank Account'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
