import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class ComplianceDashboard extends StatefulWidget {
  @override
  _ComplianceDashboardState createState() => _ComplianceDashboardState();
}

class _ComplianceDashboardState extends State<ComplianceDashboard>
    with SingleTickerProviderStateMixin {
  List<dynamic> _kycList = [];
  List<dynamic> _disputes = [];
  List<dynamic> _alerts = [];

  late AnimationController _controller;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: Duration(milliseconds: 600),
    );
    _fadeAnimation = CurvedAnimation(parent: _controller, curve: Curves.easeIn);
    _controller.forward();
    loadComplianceData();
  }

  Future<void> loadComplianceData() async {
    final kycRes = await http.get(Uri.parse('http://127.0.0.1:8000/kyc'));
    final disputeRes = await http.get(Uri.parse('http://127.0.0.1:8000/disputes'));
    final alertRes = await http.get(Uri.parse('http://127.0.0.1:8000/audit?status=failed'));

    if (kycRes.statusCode == 200) {
      setState(() => _kycList = jsonDecode(kycRes.body));
    }
    if (disputeRes.statusCode == 200) {
      setState(() => _disputes = jsonDecode(disputeRes.body));
    }
    if (alertRes.statusCode == 200) {
      setState(() => _alerts = jsonDecode(alertRes.body));
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Widget buildSection(String title, List<Widget> children) {
    return FadeTransition(
      opacity: _fadeAnimation,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: Theme.of(context).textTheme.headline6),
          SizedBox(height: 8),
          ...children,
          SizedBox(height: 24),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text("Compliance Dashboard")),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            buildSection("KYC Status", _kycList.map((user) => Card(
              margin: EdgeInsets.symmetric(vertical: 6),
              elevation: 2,
              child: ListTile(
                leading: Icon(Icons.verified_user),
                title: Text(user["user_id"]),
                subtitle: Text("Status: ${user["kyc_status"]}"),
                trailing: Chip(
                  label: Text(user["kyc_status"]),
                  backgroundColor: user["kyc_status"] == "verified"
                      ? Colors.green.shade100
                      : Colors.orange.shade100,
                ),
              ),
            )).toList()),
            buildSection("Audit Alerts", _alerts.map((alert) => Card(
              margin: EdgeInsets.symmetric(vertical: 6),
              elevation: 2,
              child: ListTile(
                leading: Icon(Icons.warning, color: Colors.red),
                title: Text(alert["action"]),
                subtitle: Text("User: ${alert["user_id"]} • Time: ${alert["timestamp"]}"),
              ),
            )).toList()),
            buildSection("Dispute Queue", _disputes.map((d) => Card(
              margin: EdgeInsets.symmetric(vertical: 6),
              elevation: 2,
              child: ListTile(
                leading: Icon(Icons.report),
                title: Text("Tx ID: ${d["tx_id"]}"),
                subtitle: Text("User: ${d["user_id"]} • Reason: ${d["reason"]}"),
                trailing: Chip(label: Text(d["status"])),
              ),
            )).toList()),
          ],
        ),
      ),
    );
  }
}