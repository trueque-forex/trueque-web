import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:uuid/uuid.dart';
import 'package:intl/intl.dart';
import 'dart:convert';
import '../services/user_service.dart';
import '../services/pin_service.dart';

class CurrencyScreen extends StatefulWidget {
  @override
  _CurrencyScreenState createState() => _CurrencyScreenState();
}

class _CurrencyScreenState extends State<CurrencyScreen> {
  final _amountController = TextEditingController();
  final _rateController = TextEditingController();
  final _uuid = Uuid();
  List<dynamic> _transactions = [];

  @override
  void initState() {
    super.initState();
    fetchHistory();
  }

  Future<void> submitTransaction() async {
    final userId = await UserService.getUserId();
    if (userId == null) {
      Navigator.pushReplacementNamed(context, '/onboarding');
      return;
    }

    if (PinService.isLockedOut()) {
      await PinService.tryBiometricUnlock();
      if (PinService.isLockedOut()) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("🔒 Locked out. Use biometrics to unlock.")),
        );
        return;
      }
    }

    final pin = await PinService.promptForPin(context);
    if (pin == null) return;

    final isValid = await PinService.validatePin(pin);
    if (!isValid) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("❌ Invalid PIN")),
      );
      return;
    }

    final txId = _uuid.v4();
    final amount = double.tryParse(_amountController.text) ?? 0;
    final rate = double.tryParse(_rateController.text) ?? 1;

    final response = await http.post(
      Uri.parse('http://127.0.0.1:8000/settle'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        "tx_id": txId,
        "user_id": userId,
        "from_currency": "USD",
        "to_currency": "MXN",
        "amount": amount,
        "rate": rate,
        "timestamp": DateTime.now().toIso8601String(),
        "status": "confirmed"
      }),
    );

    if (response.statusCode == 200) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("✅ Transaction submitted")),
      );
      _amountController.clear();
      _rateController.clear();
      fetchHistory();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("❌ Submission failed")),
      );
    }
  }

  Future<void> fetchHistory() async {
    final userId = await UserService.getUserId();
    if (userId == null) return;

    final response = await http.get(
      Uri.parse('http://127.0.0.1:8000/history?user_id=$userId'),
    );

    if (response.statusCode == 200) {
      setState(() {
        _transactions = jsonDecode(response.body);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final currencyFormat = NumberFormat.currency(symbol: "USD");
    final dateFormat = DateFormat.yMMMd();

    return Scaffold(
      appBar: AppBar(title: Text("Currency Exchange")),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            TextField(
              controller: _amountController,
              keyboardType: TextInputType.number,
              decoration: InputDecoration(labelText: "Amount (USD)"),
            ),
            TextField(
              controller: _rateController,
              keyboardType: TextInputType.number,
              decoration: InputDecoration(labelText: "Exchange Rate"),
            ),
            SizedBox(height: 12),
            ElevatedButton(
              onPressed: submitTransaction,
              child: Text("Submit Transaction"),
            ),
            Divider(height: 32),
            Expanded(
              child: _transactions.isEmpty
                  ? Center(child: Text("No transactions yet"))
                  : ListView.builder(
                      itemCount: _transactions.length,
                      itemBuilder: (context, index) {
                        final tx = _transactions[index];
                        return Card(
                          margin: EdgeInsets.symmetric(vertical: 6),
                          child: ListTile(
                            leading: Icon(Icons.swap_horiz),
                            title: Text("${tx["from_currency"]} → ${tx["to_currency"]}"),
                            subtitle: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text("${currencyFormat.format(tx["amount"])} @ ${tx["rate"]}"),
                                Text(dateFormat.format(DateTime.parse(tx["timestamp"]))),
                              ],
                            ),
                            trailing: Text(tx["status"], style: TextStyle(fontWeight: FontWeight.bold)),
                          ),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }
}