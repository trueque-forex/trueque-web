import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:local_auth/local_auth.dart';

class PinService {
  static final _storage = FlutterSecureStorage();
  static final _localAuth = LocalAuthentication();
  static const _pinKey = 'user_pin';
  static int _pinAttempts = 0;
  static bool _lockedOut = false;

  static Future<void> setPin(String pin) async {
    await _storage.write(key: _pinKey, value: pin);
  }

  static Future<String?> getPin() async {
    return await _storage.read(key: _pinKey);
  }

  static Future<bool> isPinSet() async {
    final pin = await getPin();
    return pin != null && pin.isNotEmpty;
  }

  static Future<void> clearPin() async {
    await _storage.delete(key: _pinKey);
  }

  static Future<String?> promptForPin(BuildContext context) async {
    String pin = '';
    return showDialog<String>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: Text("Enter PIN"),
          content: TextField(
            obscureText: true,
            keyboardType: TextInputType.number,
            onChanged: (value) => pin = value,
            decoration: InputDecoration(hintText: "••••"),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context), child: Text("Cancel")),
            ElevatedButton(onPressed: () => Navigator.pop(context, pin), child: Text("Confirm")),
          ],
        );
      },
    );
  }

  static Future<bool> validatePin(String? enteredPin) async {
    if (_lockedOut) return false;
    final storedPin = await getPin();
    if (storedPin == null) return false;

    if (enteredPin == storedPin) {
      _pinAttempts = 0;
      return true;
    } else {
      _pinAttempts++;
      if (_pinAttempts >= 3) _lockedOut = true;
      return false;
    }
  }

  static Future<void> tryBiometricUnlock() async {
    final canCheck = await _localAuth.canCheckBiometrics;
    if (!canCheck) return;

    final didAuth = await _localAuth.authenticate(
      localizedReason: 'Authenticate to unlock PIN entry',
      options: const AuthenticationOptions(biometricOnly: true),
    );

    if (didAuth) {
      _lockedOut = false;
      _pinAttempts = 0;
    }
  }

  static bool isLockedOut() => _lockedOut;
}