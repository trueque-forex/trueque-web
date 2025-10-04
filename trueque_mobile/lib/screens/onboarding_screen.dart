import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';

import 'currency_screen.dart';
import 'pin_setup_screen.dart';
import 'summary_screen.dart';
import '../services/user_service.dart';

class OnboardingScreen extends StatefulWidget {
  @override
  _OnboardingScreenState createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  int _currentStep = 0;
  String _uuid = '';
  String _currency = '';
  String _pin = '';

  final _uuidController = TextEditingController();
  final _pinController = TextEditingController();

  void _nextStep() {
    if (_currentStep < 4) {
      setState(() => _currentStep++);
    } else {
      _completeOnboarding();
    }
  }

  void _prevStep() {
    if (_currentStep > 0) {
      setState(() => _currentStep--);
    }
  }

  Future<void> _completeOnboarding() async {
    await UserService.setUserId(_uuid);
    Navigator.pushReplacementNamed(context, '/summary');
  }

  @override
  Widget build(BuildContext context) {
    final loc = AppLocalizations.of(context)!;

    return Scaffold(
      appBar: AppBar(title: Text(loc.onboardingTitle)),
      body: Stepper(
        currentStep: _currentStep,
        onStepContinue: _nextStep,
        onStepCancel: _prevStep,
        steps: [
          Step(
            title: Text(loc.stepIdentity),
            content: TextField(
              controller: _uuidController,
              decoration: InputDecoration(labelText: loc.enterUuid),
              onChanged: (val) => _uuid = val,
            ),
            isActive: _currentStep >= 0,
          ),
          Step(
            title: Text(loc.stepCurrency),
            content: DropdownButtonFormField<String>(
              value: _currency.isNotEmpty ? _currency : null,
              items: ['USD', 'EUR', 'BRL'].map((c) => DropdownMenuItem(
                value: c,
                child: Text(c),
              )).toList(),
              onChanged: (val) => setState(() => _currency = val ?? ''),
              decoration: InputDecoration(labelText: loc.selectCurrency),
            ),
            isActive: _currentStep >= 1,
          ),
          Step(
            title: Text(loc.stepPin),
            content: TextField(
              controller: _pinController,
              decoration: InputDecoration(labelText: loc.createPin),
              obscureText: true,
              onChanged: (val) => _pin = val,
            ),
            isActive: _currentStep >= 2,
          ),
          Step(
            title: Text(loc.stepReview),
            content: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text("${loc.uuidLabel}: $_uuid"),
                Text("${loc.currencyLabel}: $_currency"),
                Text("${loc.pinLabel}: ${_pin.isNotEmpty ? '••••' : ''}"),
              ],
            ),
            isActive: _currentStep >= 3,
          ),
        ],
      ),
    );
  }
}