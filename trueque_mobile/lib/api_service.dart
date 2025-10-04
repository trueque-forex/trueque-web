class ApiService {
  static Future<Map<String, dynamic>> login(String identifier, String password) async {
    // Simulate a successful login
    await Future.delayed(Duration(seconds: 1));
    return {'kyc_status': 'verified'};
  }
}