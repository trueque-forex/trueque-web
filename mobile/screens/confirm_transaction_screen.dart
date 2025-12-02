import 'package:flutter/material.dart';
import '../models/offer.dart';
import '../models/user.dart';
import '../services/pin_service.dart';
import '../services/settlement_service.dart';

class ConfirmTransactionScreen extends StatefulWidget {
  final Offer offer;
  final User? counterparty;
  final double exchangeRate;
  final double fee;
  final double feePercentage;

  const ConfirmTransactionScreen({
    Key? key,
    required this.offer,
    this.counterparty,
    required this.exchangeRate,
    required this.fee,
    this.feePercentage = 1.5,
  }) : super(key: key);

  @override
  State<ConfirmTransactionScreen> createState() => _ConfirmTransactionScreenState();
}

class _ConfirmTransactionScreenState extends State<ConfirmTransactionScreen> {
  bool _isProcessing = false;
  final TextEditingController _pinController = TextEditingController();

  @override
  void dispose() {
    _pinController.dispose();
    super.dispose();
  }

  double get _totalAmount => widget.offer.amount;
  double get _amountReceived => _totalAmount * widget.exchangeRate;
  double get _effectiveRate => _amountReceived / _totalAmount;
  double get _marketRate => widget.offer.marketRate;
  double get _rateDifference => ((_effectiveRate - _marketRate) / _marketRate * 100);

  Future<void> _confirmTransaction() async {
    if (_pinController.text.isEmpty) {
      _showError('Please enter your PIN');
      return;
    }

    setState(() => _isProcessing = true);

    try {
      // Verify PIN
      final pinValid = await PinService.verifyPin(_pinController.text);
      if (!pinValid) {
        _showError('Invalid PIN');
        setState(() => _isProcessing = false);
        return;
      }

      // Submit settlement
      final success = await SettlementService.sendSettlement(
        txId: widget.offer.uuid,
        from: widget.offer.currencyFrom,
        to: widget.offer.currencyTo,
        amount: widget.offer.amount,
        rate: widget.exchangeRate,
        timestamp: DateTime.now().toIso8601String(),
        userId: widget.offer.userId,
        status: 'processing',
        confirmedByUserId: int.parse(widget.offer.userId),
      );

      if (success) {
        // Navigate to payment status screen
        if (mounted) {
          Navigator.pushReplacementNamed(
            context,
            '/payment-status',
            arguments: {
              'transactionId': widget.offer.uuid,
              'amount': _totalAmount,
              'amountReceived': _amountReceived,
              'currencyFrom': widget.offer.currencyFrom,
              'currencyTo': widget.offer.currencyTo,
              'status': 'processing',
            },
          );
        }
      } else {
        _showError('Transaction failed. Please try again.');
        setState(() => _isProcessing = false);
      }
    } catch (e) {
      _showError('Error: ${e.toString()}');
      setState(() => _isProcessing = false);
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Confirm Transaction'),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Transaction Summary Card
            Card(
              elevation: 2,
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
                    _buildSummaryRow('You Send', '${_totalAmount.toStringAsFixed(2)} ${widget.offer.currencyFrom}'),
                    const SizedBox(height: 8),
                    _buildSummaryRow('They Receive', '${_amountReceived.toStringAsFixed(2)} ${widget.offer.currencyTo}'),
                    const Divider(height: 24),
                    _buildSummaryRow('Exchange Rate', '1 ${widget.offer.currencyFrom} = ${widget.exchangeRate.toStringAsFixed(4)} ${widget.offer.currencyTo}'),
                    const SizedBox(height: 8),
                    _buildSummaryRow('Market Rate', '1 ${widget.offer.currencyFrom} = ${_marketRate.toStringAsFixed(4)} ${widget.offer.currencyTo}'),
                    const SizedBox(height: 8),
                    _buildSummaryRow(
                      'Rate Difference',
                      '${_rateDifference.toStringAsFixed(2)}%',
                      valueColor: _rateDifference >= 0 ? Colors.green : Colors.red,
                    ),
                    const Divider(height: 24),
                    _buildSummaryRow('Fee (${widget.feePercentage}%)', '${widget.fee.toStringAsFixed(2)} ${widget.offer.currencyFrom}'),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Counterparty Info Card
            if (widget.counterparty != null)
              Card(
                elevation: 2,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Counterparty',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          CircleAvatar(
                            backgroundColor: Theme.of(context).primaryColor.withOpacity(0.1),
                            child: Text(
                              widget.counterparty!.displayName[0].toUpperCase(),
                              style: TextStyle(
                                color: Theme.of(context).primaryColor,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  widget.counterparty!.displayName,
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w600,
                                    fontSize: 16,
                                  ),
                                ),
                                Text(
                                  widget.counterparty!.truequeId,
                                  style: TextStyle(
                                    color: Colors.grey[600],
                                    fontSize: 14,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          if (widget.counterparty!.isKycVerified)
                            const Icon(
                              Icons.verified,
                              color: Colors.blue,
                              size: 20,
                            ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            const SizedBox(height: 24),

            // PIN Input
            TextField(
              controller: _pinController,
              keyboardType: TextInputType.number,
              obscureText: true,
              maxLength: 4,
              decoration: InputDecoration(
                labelText: 'Enter PIN to Confirm',
                hintText: '••••',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                prefixIcon: const Icon(Icons.lock),
              ),
              enabled: !_isProcessing,
            ),
            const SizedBox(height: 24),

            // Confirm Button
            ElevatedButton(
              onPressed: _isProcessing ? null : _confirmTransaction,
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              child: _isProcessing
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                      ),
                    )
                  : const Text(
                      'Confirm Transaction',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
            ),
            const SizedBox(height: 12),

            // Cancel Button
            OutlinedButton(
              onPressed: _isProcessing ? null : () => Navigator.pop(context),
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              child: const Text(
                'Cancel',
                style: TextStyle(fontSize: 16),
              ),
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
