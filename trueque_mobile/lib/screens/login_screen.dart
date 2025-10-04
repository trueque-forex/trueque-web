import 'package:flutter/material.dart';
import 'package:trueque_mobile/l10n/app_localizations.dart';
import 'package:local_auth/local_auth.dart';
import '../api_service.dart';

class LoginScreen extends StatefulWidget {
  @override
  _LoginScreenState createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> with SingleTickerProviderStateMixin {
  final TextEditingController _identifierController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  final LocalAuthentication _localAuth = LocalAuthentication();

  bool _isLoading = false;
  String? _error;
  late AnimationController _errorAnimationController;
  late Animation<double> _errorOpacity;

  @override
  void initState() {
    super.initState();
    _errorAnimationController = AnimationController(
      duration: Duration(milliseconds: 500),
      vsync: this,
    );
    _errorOpacity = Tween<double>(begin: 0, end: 1).animate(_errorAnimationController);
  }

  @override
  void dispose() {
    _identifierController.dispose();
    _passwordController.dispose();
    _errorAnimationController.dispose();
    super.dispose();
  }

  void _showError(String message) {
    setState(() {
      _error = message;
    });
    _errorAnimationController.forward(from: 0);
  }

  Future<void> _login() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final response = await ApiService.login(
        _identifierController.text,
        _passwordController.text,
      );

      if (response['kyc_status'] == 'verified') {
        Navigator.pushNamed(context, '/currency');
      } else {
        _showError('KYC not verified');
      }
    } catch (e) {
      _showError(AppLocalizations.of(context)!.loginError);
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _authenticateBiometrically() async {
    try {
      bool canCheck = await _localAuth.canCheckBiometrics;
      bool authenticated = false;

      if (canCheck) {
        authenticated = await _localAuth.authenticate(
          localizedReason: 'Use fingerprint or face to login',
          options: const AuthenticationOptions(biometricOnly: true),
        );
      }

      if (authenticated) {
        Navigator.pushNamed(context, '/currency');
      } else {
        _showError('Biometric authentication failed');
      }
    } catch (e) {
      _showError('Biometric error');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(AppLocalizations.of(context)!.loginTitle)),
      body: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          children: [
            TextField(
              controller: _identifierController,
              decoration: InputDecoration(labelText: AppLocalizations.of(context)!.emailLabel),
            ),
            TextField(
              controller: _passwordController,
              decoration: InputDecoration(labelText: AppLocalizations.of(context)!.passwordLabel),
              obscureText: true,
            ),
            SizedBox(height: 20),
            FadeTransition(
              opacity: _errorOpacity,
              child: _error != null
                  ? Text(_error!, style: TextStyle(color: Colors.red))
                  : SizedBox.shrink(),
            ),
            SizedBox(height: 20),
            ElevatedButton(
              onPressed: _isLoading ? null : _login,
              child: _isLoading
                  ? CircularProgressIndicator(color: Colors.white)
                  : Text(AppLocalizations.of(context)!.loginButton),
            ),
            SizedBox(height: 10),
            ElevatedButton.icon(
              icon: Icon(Icons.fingerprint),
              label: Text(AppLocalizations.of(context)!.biometricButton),
              onPressed: _authenticateBiometrically,
            ),
          ],
        ),
      ),
    );
  }
}