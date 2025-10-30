import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';

import 'screens/onboarding_screen.dart';
import 'screens/currency_screen.dart';
import 'screens/pin_setup_screen.dart';
import 'screens/summary_screen.dart';
import 'screens/audit_screen.dart';
import 'screens/dispute_screen.dart';
import 'screens/compliance_dashboard.dart';

import 'services/user_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final isRegistered = await UserService.isRegistered();
  runApp(TruequeApp(initialRoute: isRegistered ? '/summary' : '/onboarding'));
}

class TruequeApp extends StatelessWidget {
  final String initialRoute;

  const TruequeApp({required this.initialRoute});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Trueque',
      debugShowCheckedModeBanner: false,
      localizationsDelegates: const [
        AppLocalizations.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      supportedLocales: const [
        Locale('en'),
        Locale('es'),
        Locale('pt', 'BR'),
      ],
      locale: const Locale('en'),
      initialRoute: initialRoute,
      routes: {
        '/onboarding': (context) => OnboardingScreen(),
        '/setup-pin': (context) => PinSetupScreen(),
        '/currency': (context) => CurrencyScreen(),
        '/summary': (context) => SummaryScreen(),
        '/audit': (context) => AuditScreen(),
        '/dispute': (context) => DisputeScreen(),
        '/compliance': (context) => FutureBuilder<bool>(
          future: UserService.isAdmin(),
          builder: (context, snapshot) {
            if (!snapshot.hasData) {
              return Scaffold(body: Center(child: CircularProgressIndicator()));
            }
            if (snapshot.data == true) {
              return ComplianceDashboard();
            } else {
              return Scaffold(
                appBar: AppBar(title: Text("Access Denied")),
                body: Center(child: Text("🚫 You do not have permission to view this screen.")),
              );
            }
          },
        ),
      },
    );
  }
}