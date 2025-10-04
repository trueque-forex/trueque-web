import 'package:http/http.dart' as http;
import 'dart:convert';

class AuditService {
  static Future<void> logAction({
    required String userId,
    required String action,
    required String status,
    Map<String, dynamic>? details,
  }) async {
    final payload = {
      "log_id": const Uuid().v4(),
      "user_id": userId,
      "action": action,
      "timestamp": DateTime.now().toIso8601String(),
      "status": status,
      "details": details ?? {},
    };

    await http.post(
      Uri.parse('http://127.0.0.1:8000/audit'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(payload),
    );
  }
}