import 'package:flutter/material.dart';

class CurrencyList extends StatelessWidget {
  final List<Map<String, dynamic>> currencies;

  CurrencyList({required this.currencies});

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      itemCount: currencies.length,
      itemBuilder: (context, index) {
        final currency = currencies[index];
        return ListTile(
          title: Text(currency['name']),
          subtitle: Text(currency['code']),
          trailing: Text('Rate: ${currency['rate']}'),
          onTap: () {
            Navigator.pushNamed(
              context,
              '/exchange',
              arguments: currency,
            );
          },
        );
      },
    );
  }
}