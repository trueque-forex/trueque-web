import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../services/user_service.dart';

class SummaryScreen extends StatefulWidget {
  @override
  _SummaryScreenState createState() => _SummaryScreenState();
}

class _SummaryScreenState extends State<SummaryScreen> {
  String? _userId;
  List<dynamic> _transactions = [];

  @override
  void initState() {
    super.initState();
    loadUserAndHistory();
  }

  Future<void> loadUserAndHistory() async {
    final userId = await UserService.getUserId();
    if (userId == null) {
      Navigator.pushReplacementNamed(context, '/onboarding');
      return;
    }

    setState(() => _userId = userId);
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
    final dateFormat = DateFormat.yMMMd().add_jm();
    final lastTx = _transactions.isNotEmpty ? _transactions.last : null;

    return Scaffold(
      appBar: AppBar(title: Text("Account Summary")),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: _userId == null
            ? Center(child: CircularProgressIndicator())
            : Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text("Welcome, $_userId", style: Theme.of(context).textTheme.headline6),
                  SizedBox(height: 16),
                  if (lastTx != null) ...[
                    Text("Last Transaction", style: TextStyle(fontWeight: FontWeight.bold)),
                    Card(
                      child: ListTile(
                        leading: Icon(Icons.swap_horiz),
                        title: Text("${lastTx["from_currency"]} → ${lastTx["to_currency"]}"),
                        subtitle: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text("Amount: ${lastTx["amount"]} @ ${lastTx["rate"]}"),
                            Text("Method: ${lastTx["method"] ?? "N/A"}"),
                            Text("Time: ${dateFormat.format(DateTime.parse(lastTx["timestamp"]))}"),
                          ],
                        ),
                        trailing: Chip(
                          label: Text(lastTx["status"]),
                          backgroundColor: lastTx["status"] == "confirmed"
                              ? Colors.green.shade100
                              : Colors.orange.shade100,
                        ),
                      ),
                    ),
                  ] else ...[
                    Text("No transactions yet", style: TextStyle(color: Colors.grey)),
                  ],
                  SizedBox(height: 24),
                  ElevatedButton.icon(
                    icon: Icon(Icons.history),
                    label: Text("View Full History"),
                    onPressed: () => Navigator.pushNamed(context, '/currency'),
                  ),
                  ElevatedButton.icon(
                    icon: Icon(Icons.report),
                    label: Text("Dispute a Transaction"),
                    onPressed: () => Navigator.pushNamed(context, '/dispute'),
                  ),
                  ElevatedButton.icon(
                    icon: Icon(Icons.shield),
                    label: Text("View Audit Log"),
                    onPressed: () => Navigator.pushNamed(context, '/audit'),
                  ),
                ],
              ),
      ),
    );
  }
}