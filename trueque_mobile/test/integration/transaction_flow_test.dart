import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:trueque_mobile/main.dart' as app;
import 'package:trueque_mobile/api_service.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'dart:math';
import 'dart:io';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  Future<String> authenticateUser() async {
    final email = 'test_mobile_${Random().nextInt(10000)}@example.com';
    final password = 'password123';
    
    // Signup
    final signupRes = await http.post(
      Uri.parse('http://localhost:3000/api/mobile/signup'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'email': email,
        'password': password,
        'firstName': 'Test',
        'lastName': 'User',
        'country': 'US',
      }),
    );
    
    if (signupRes.statusCode != 201) {
      final msg = 'Signup failed: ${signupRes.statusCode} ${signupRes.body}';
      // Try to log to console and file
      print(msg);
      try { File('error.log').writeAsStringSync(msg); } catch (_) {}
      throw Exception(msg);
    }

    // Signin
    final signinRes = await http.post(
      Uri.parse('http://localhost:3000/api/mobile/signin'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'email': email,
        'password': password,
      }),
    );

    if (signinRes.statusCode == 200) {
      final body = jsonDecode(signinRes.body);
      return body['token'];
    } else {
      final msg = 'Signin failed: ${signinRes.statusCode} ${signinRes.body}';
      print(msg);
      try { File('error.log').writeAsStringSync(msg); } catch (_) {}
      throw Exception(msg);
    }
  }

  group('Transaction Flow Integration Test', () {
    testWidgets('complete transaction flow from offer to completion', (WidgetTester tester) async {
      // Setup Auth
      final token = await authenticateUser();
      ApiService.setAuthToken(token);

      // Start the app
      app.main();
      await tester.pumpAndSettle();

      // Step 1: Navigate to offer screen (should be initial route)
      expect(find.text('Create Offer'), findsOneWidget);

      // Step 2: Fill in offer details
      // Select Currency From
      await tester.tap(find.byKey(Key('currency_from')));
      await tester.pumpAndSettle();
      // Use hitTestable to find the item that is not covered by the modal barrier
      await tester.tap(find.text('USD').hitTestable());
      await tester.pumpAndSettle();

      // Select Currency To
      await tester.tap(find.byKey(Key('currency_to')));
      await tester.pumpAndSettle();
      await tester.tap(find.text('COP').hitTestable());
      await tester.pumpAndSettle();

      await tester.enterText(find.byKey(Key('amount')), '100');
      await tester.pumpAndSettle();

      // Step 3: Submit offer
      await tester.tap(find.byKey(Key('submit_offer')));
      await tester.pumpAndSettle();

      // Step 4: Verify Success (SnackBar)
      // Since we don't have a matching offer in the backend, we expect the "posted" message
      expect(find.text('Offer posted. Waiting for match.'), findsOneWidget); 
    });

    // Placeholder for other tests
  });
}
