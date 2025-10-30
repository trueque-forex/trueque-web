import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../services/user_service.dart';

class AuditScreen extends StatefulWidget {
  @override
  _AuditScreenState createState() => _AuditScreenState();
}

class _AuditScreenState extends State<AuditScreen> {
  List<dynamic> _logs = [];

  @override
  void initState() {
    super.initState();
    fetchAuditLogs();
  }

  Future<void> fetchAuditLogs() async {
    final userId = await UserService.getUserId();
    if (userId == null) return;

    final response = await http.get(
      Uri.parse('http://127.0.0.1:8000/audit?user_id=$userId'),
    );

    if (response.statusCode == 200) {
      setState(() {
        _logs = jsonDecode(response.body);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final dateFormat = DateFormat.yMMMd().add_jm();

    return Scaffold(
      appBar: AppBar(title: Text("Audit Log")),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: _logs.isEmpty
            ? Center(child: Text("No audit records found"))
            : ListView.builder(
                itemCount: _logs.length,
                itemBuilder: (context, index) {
                  final log = _logs[index];
                  final icon = _getIconForAction(log["action"]);
                  final color = log["status"] == "success" ? Colors.green : Colors.red;

                  return Card(
                    margin: EdgeInsets.symmetric(vertical: 6),
                    child: ListTile(
                      leading: Icon(icon, color: color),
                      title: Text("${log["action"].toUpperCase()}"),
                      subtitle: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text("Time: ${dateFormat.format(DateTime.parse(log["timestamp"]))}"),
                          if (log["details"]?["tx_id"] != null)
                            Text("Tx ID: ${log["details"]["tx_id"]}"),
                          if (log["details"]?["method"] != null)
                            Text("Method: ${log["details"]["method"]}"),
                          if (log["details"]?["note"] != null)
                            Text("Note: ${log["details"]["note"]}"),
                        ],
                      ),
                      trailing: Chip(label: Text(log["status"]), backgroundColor: color.withOpacity(0.2)),
                    ),
                  );
                },
              ),
      ),
    );
  }

  IconData _getIconForAction(String action) {
    switch (action) {
      case "onboard":
        return Icons.person_add;
      case "setup_pin":
        return Icons.lock;
      case "settle":
        return Icons.swap_horiz;
      case "dispute":
        return Icons.report;
      default:
        return Icons.info;
    }
  }
}