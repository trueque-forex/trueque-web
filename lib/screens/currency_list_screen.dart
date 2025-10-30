import 'package:flutter/material.dart';
import 'package:trueque_mobile/widgets/currency_list.dart';

class CurrencyListScreen extends StatelessWidget {
  final List<Map<String, dynamic>> currencies = [
    {'code': 'USD', 'name': 'US Dollar', 'rate': 1.0},
    {'code': 'EUR', 'name': 'Euro', 'rate': 0.93},
    {'code': 'MXN', 'name': 'Mexican Peso', 'rate': 17.2},
    {'code': 'COP', 'name': 'Colombian Peso', 'rate': 3900.0},
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Select Currency')),
      body: CurrencyList(currencies: currencies),
    );
  }
}