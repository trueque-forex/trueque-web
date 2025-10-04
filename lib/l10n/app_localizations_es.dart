// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Spanish Castilian (`es`).
class AppLocalizationsEs extends AppLocalizations {
  AppLocalizationsEs([String locale = 'es']) : super(locale);

  @override
  String get loginTitle => 'Inicio de sesión Trueque';

  @override
  String get emailLabel => 'Correo o Teléfono';

  @override
  String get passwordLabel => 'Contraseña';

  @override
  String get loginButton => 'Iniciar sesión';

  @override
  String get biometricButton => 'Acceder con biometría';

  @override
  String get kycError => 'KYC no verificado';

  @override
  String get loginError => 'Error de inicio de sesión';

  @override
  String get biometricError => 'Error de autenticación biométrica';

  @override
  String get currencyTitle => 'Selecciona una moneda';

  @override
  String get exchangeTitle => 'Cambio de moneda';

  @override
  String get exchangeRateLabel => 'Tasa de cambio';

  @override
  String get feeLabel => 'Comisión de servicio';

  @override
  String get receiveAmountLabel => 'Recibirás';

  @override
  String get confirmExchangeButton => 'Confirmar cambio';

  @override
  String get enterAmountLabel => 'Ingresa el monto a cambiar';
}
