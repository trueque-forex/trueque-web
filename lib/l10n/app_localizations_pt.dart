// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Portuguese (`pt`).
class AppLocalizationsPt extends AppLocalizations {
  AppLocalizationsPt([String locale = 'pt']) : super(locale);

  @override
  String get loginTitle => 'Trueque Login';

  @override
  String get emailLabel => 'Email or Phone';

  @override
  String get passwordLabel => 'Password';

  @override
  String get loginButton => 'Login';

  @override
  String get biometricButton => 'Login with Biometrics';

  @override
  String get kycError => 'KYC not verified';

  @override
  String get loginError => 'Login failed';

  @override
  String get biometricError => 'Biometric authentication failed';

  @override
  String get currencyTitle => 'Select a currency';

  @override
  String get exchangeTitle => 'Currency Exchange';

  @override
  String get exchangeRateLabel => 'Exchange rate';

  @override
  String get feeLabel => 'Service fee';

  @override
  String get receiveAmountLabel => 'You’ll receive';

  @override
  String get confirmExchangeButton => 'Confirm Exchange';

  @override
  String get enterAmountLabel => 'Enter amount to exchange';
}

/// The translations for Portuguese, as used in Brazil (`pt_BR`).
class AppLocalizationsPtBr extends AppLocalizationsPt {
  AppLocalizationsPtBr() : super('pt_BR');
}
