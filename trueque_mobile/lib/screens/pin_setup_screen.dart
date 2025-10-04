import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class PinSetupScreen extends StatefulWidget {
  @override
  _PinSetupScreenState createState() => _PinSetupScreenState();
}

class _PinSetupScreenState extends State<PinSetupScreen> {
  final _pinController = TextEditingController();
  final _confirmController = TextEditingController();
  final _secureStorage = FlutterSecureStorage();

  Future<void> savePin() async {
    final pin = _pinController.text.trim();
    final confirm = _confirmController.text.trim();

    if (pin.length != 4 || pin != confirm) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("❌ PINs must match and be 4 digits")),
      );
      return;
    }

    await _secureStorage.write(key: 'user_pin', value: pin);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text("✅ PIN saved securely")),
    );
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text("Set Your PIN")),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            TextField(
              controller: _pinController,
              keyboardType: TextInputType.number,
              obscureText: true,
              decoration: InputDecoration(labelText: "Enter 4-digit PIN"),
            ),
            TextField(
              controller: _confirmController,
              keyboardType: TextInputType.number,
              obscureText: true,
              decoration: InputDecoration(labelText: "Confirm PIN"),
            ),
            SizedBox(height: 24),
            ElevatedButton(
              onPressed: savePin,
              child: Text("Save PIN"),
            ),
          ],
        ),
      ),
    );
  }
}