import 'package:flutter/material.dart';
import 'screens/offer_screen.dart';
import 'screens/match_screen.dart';
import 'screens/history_screen.dart';
import 'screens/admin_dashboard.dart';
import 'screens/onboarding_screen.dart';
import 'screens/currency_screen.dart';
import 'screens/pin_setup_screen.dart';
import 'screens/confirm_transaction_screen.dart';
import 'screens/payment_status_screen.dart';
import 'screens/qr_payment_screen.dart';
import 'models/offer.dart';

void main() {
  runApp(TruequeApp());
}

class TruequeApp extends StatelessWidget {
  final String userUuid = 'user-123';       // Replace with actual UUID logic
  final String userCountry = 'CO';          // Replace with dynamic country detection

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Trueque',
      theme: ThemeData(primarySwatch: Colors.indigo),
      initialRoute: '/offer',
      routes: {
        '/offer': (context) => OfferScreen(uuid: userUuid, country: userCountry),
        '/match': (context) {
          final offer = ModalRoute.of(context)!.settings.arguments as Offer;
          return MatchScreen(offer: offer);
        },
        '/confirm-transaction': (context) {
          final args = ModalRoute.of(context)!.settings.arguments as Map<String, dynamic>;
          return ConfirmTransactionScreen(
            offer: args['offer'],
            counterparty: args['counterparty'],
            exchangeRate: args['exchangeRate'],
            fee: args['fee'],
            feePercentage: args['feePercentage'] ?? 1.5,
          );
        },
        '/payment-status': (context) => PaymentStatusScreen(),
        '/qr-payment': (context) {
          final args = ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
          return QRPaymentScreen(
            isScanning: args?['isScanning'] ?? true,
            paymentData: args?['paymentData'],
          );
        },
        '/history': (context) => HistoryScreen(uuid: userUuid),
        '/admin': (context) => AdminDashboard(),
        '/onboarding': (context) => OnboardingScreen(),
        '/currency': (context) => CurrencyScreen(),
        '/setup-pin': (context) => PinSetupScreen(),
      },
    );
  }
}