import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class AdminDashboard extends StatefulWidget {
  @override
  _AdminDashboardState createState() => _AdminDashboardState();
}

class _AdminDashboardState extends State<AdminDashboard> {
  int open = 0;
  int matched = 0;
  int settled = 0;
  String latestTime = '';

  @override
  void initState() {
    super.initState();
    fetchStats();
  }

  void fetchStats() async {
    final response = await http.get(Uri.parse('https://your-api-url.com/admin-dashboard'));
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      setState(() {
        open = data['open'];
        matched = data['matched'];
        settled = data['settled'];
        latestTime = data['latest_offer_time'];
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Admin Dashboard')),
      body: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          children: [
            StatTile(label: 'Open Offers', value: open),
            StatTile(label: 'Matched Offers', value: matched),
            StatTile(label: 'Settled Offers', value: settled),
            SizedBox(height: 20),
            Text('Latest Offer: $latestTime', style: TextStyle(fontSize: 16)),
            SizedBox(height: 20),
            ElevatedButton(
              onPressed: fetchStats,
              child: Text('Refresh Stats'),
            ),
          ],
        ),
      ),
    );
  }
}

class StatTile extends StatelessWidget {
  final String label;
  final int value;

  StatTile({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return ListTile(
      title: Text(label),
      trailing: Text(value.toString(), style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
    );
  }
}