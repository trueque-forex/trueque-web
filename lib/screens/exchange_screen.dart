import 'package:flutter/material.dart';
import 'package:trueque_mobile/l10n/app_localizations.dart';
import 'package:trueque_mobile/services/exchange_rate_service.dart';
import 'package:trueque_mobile/services/settlement_service.dart';

class ExchangeScreen extends StatefulWidget {
  @override
  _ExchangeScreenState createState() => _ExchangeScreenState();
}

class _ExchangeScreenState extends State<ExchangeScreen> {
  final TextEditingController _amountController = TextEditingController();
  ExchangeRateResponse? exchangeData;
  double? netAmount;
  final double fee = 0.015;

  @override
  void initState() {
    super.initState();
    _loadRate();
  }

  void _loadRate() async {
    final currency = ModalRoute.of(context)!.settings.arguments as Map<String, dynamic>;
    final data = await ExchangeRateService.fetchRate(currency['code'], 'ARS');
    if (data != null) {
      setState(() {
        exchangeData = data;
        _calculateNetAmount(_amountController.text);
      });
    }
  }

  void _calculateNetAmount(String value) {
    final input = double.tryParse(value);
    if (input != null && exchangeData != null) {
      final converted = input * exchangeData!.rate;
      setState(() {
        netAmount = converted * (1 - fee);
      });
    }
  }

  Future<bool> _showPinDialog(BuildContext context) async {
    final TextEditingController pinController = TextEditingController();
    return await showDialog<bool>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: Text('Enter PIN to confirm'),
          content: TextField(
            controller:pinController,
            keyboardType: TextInputType.number,
            obscureText: true,
            maxLength: 4,
            decoration: InputDecoration(hintText: '••••'),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () {
                final enteredPin = pinController.text;
                if (enteredPin == '1234') {
                  Navigator.pop(context, true);
                } else {
                  Navigator.pop(context, false);
                }
              },
              child: Text('Confirm'),
            ),
          ],
        );
      },
    ) ?? false;
  }

  @override
  Widget build(BuildContext context) {
    final currency = ModalRoute.of(context)!.settings.arguments as Map<String, dynamic>;

    return Scaffold(
      appBar: AppBar(
        title: Text(AppLocalizations.of(context)!.exchangeTitle),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            TextField(
              controller: _amountController,
              keyboardType: TextInputType.number,
              decoration: InputDecoration(
                labelText: AppLocalizations.of(context)!.enterAmountLabel,
              ),
              onChanged: _calculateNetAmount,
            ),
            SizedBox(height: 16),
            if (exchangeData != null)
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('${AppLocalizations.of(context)!.exchangeRateLabel}: 1 ${currency['code']} = ${exchangeData!.rate.toStringAsFixed(4)} ARS'),
                  Text('${AppLocalizations.of(context)!.feeLabel}: ${(fee * 100).toStringAsFixed(1)}%'),
                  if (netAmount != null)
                    Text('${AppLocalizations.of(context)!.receiveAmountLabel}: ${netAmount!.toStringAsFixed(2)} ARS'),
                  SizedBox(height: 8),
                  Text('Rate as of ${exchangeData!.timestamp}'),
                  TextButton.icon(
                    onPressed: _loadRate,
                    icon: Icon(Icons.refresh),
                    label: Text('Refresh rate'),
                  ),
                ],
              )
            else
              Center(child: CircularProgressIndicator()),
            Spacer(),
            ElevatedButton(
              onPressed: netAmount != null ? () async {
                final confirmed = await _showPinDialog(context);
                if (confirmed) {
                  final success = await SettlementService.sendSettlement(
                    from: currency['code'],
                    to: 'ARS',
                    amount: double.parse(_amountController.text),
                    rate: exchangeData!.rate,
                    timestamp: exchangeData!.timestamp,
                    userId: 'abc123', // Replace with actual user ID logic
                  );

                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(success
                          ? 'Exchange confirmed and sent to backend'
                          : 'Settlement failed'),
                    ),
                  );
                } else {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('PIN incorrect')),
                  );
                }
              } : null,
              child: Text(AppLocalizations.of(context)!.confirmExchangeButton),
            ),
          ],
        ),
      ),
    );
  }
}