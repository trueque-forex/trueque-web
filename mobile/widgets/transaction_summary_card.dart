import 'package:flutter/material.dart';

class TransactionSummaryCard extends StatelessWidget {
  final String currencyFrom;
  final String currencyTo;
  final double amountSent;
  final double amountReceived;
  final double exchangeRate;
  final double marketRate;
  final double fee;
  final double feePercentage;
  final EdgeInsetsGeometry? margin;

  const TransactionSummaryCard({
    Key? key,
    required this.currencyFrom,
    required this.currencyTo,
    required this.amountSent,
    required this.amountReceived,
    required this.exchangeRate,
    required this.marketRate,
    required this.fee,
    required this.feePercentage,
    this.margin,
  }) : super(key: key);

  double get _effectiveRate => amountReceived / amountSent;
  double get _rateDifference => ((_effectiveRate - marketRate) / marketRate * 100);

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 2,
      margin: margin ?? EdgeInsets.zero,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Transaction Summary',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 16),
            _buildSummaryRow(
              'You Send',
              '${amountSent.toStringAsFixed(2)} $currencyFrom',
            ),
            const SizedBox(height: 8),
            _buildSummaryRow(
              'They Receive',
              '${amountReceived.toStringAsFixed(2)} $currencyTo',
            ),
            const Divider(height: 24),
            _buildSummaryRow(
              'Exchange Rate',
              '1 $currencyFrom = ${exchangeRate.toStringAsFixed(4)} $currencyTo',
            ),
            const SizedBox(height: 8),
            _buildSummaryRow(
              'Market Rate',
              '1 $currencyFrom = ${marketRate.toStringAsFixed(4)} $currencyTo',
            ),
            const SizedBox(height: 8),
            _buildSummaryRow(
              'Rate Difference',
              '${_rateDifference.toStringAsFixed(2)}%',
              valueColor: _rateDifference >= 0 ? Colors.green : Colors.red,
            ),
            const Divider(height: 24),
            _buildSummaryRow(
              'Fee ($feePercentage%)',
              '${fee.toStringAsFixed(2)} $currencyFrom',
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSummaryRow(String label, String value, {Color? valueColor}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            color: Colors.grey[700],
            fontSize: 14,
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontWeight: FontWeight.w600,
            fontSize: 14,
            color: valueColor,
          ),
        ),
      ],
    );
  }
}
