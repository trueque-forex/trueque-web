import 'package:flutter_test/flutter_test.dart';
import 'package:trueque_mobile/models/transaction.dart';

void main() {
  group('Transaction Model Tests', () {
    test('fromJson should correctly parse transaction data', () {
      final json = {
        'id': 'tx_123',
        'user_id': '1',
        'counterparty_id': '2',
        'currency_from': 'USD',
        'currency_to': 'COP',
        'amount': 100.0,
        'amount_received': 425000.0,
        'exchange_rate': 4250.0,
        'market_rate': 4200.0,
        'fee': 1.5,
        'fee_percentage': 1.5,
        'status': 'completed',
        'created_at': '2025-01-01T00:00:00Z',
      };

      final transaction = Transaction.fromJson(json);

      expect(transaction.id, equals('tx_123'));
      expect(transaction.userId, equals('1'));
      expect(transaction.currencyFrom, equals('USD'));
      expect(transaction.currencyTo, equals('COP'));
      expect(transaction.amount, equals(100.0));
      expect(transaction.amountReceived, equals(425000.0));
      expect(transaction.status, equals('completed'));
    });

    test('effectiveRate should calculate correctly', () {
      final transaction = Transaction(
        id: 'tx_123',
        userId: '1',
        currencyFrom: 'USD',
        currencyTo: 'COP',
        amount: 100.0,
        amountReceived: 425000.0,
        exchangeRate: 4250.0,
        marketRate: 4200.0,
        fee: 1.5,
        feePercentage: 1.5,
        status: 'completed',
        createdAt: DateTime.now(),
      );

      expect(transaction.effectiveRate, equals(4250.0));
    });

    test('rateDifference should calculate percentage difference', () {
      final transaction = Transaction(
        id: 'tx_123',
        userId: '1',
        currencyFrom: 'USD',
        currencyTo: 'COP',
        amount: 100.0,
        amountReceived: 425000.0,
        exchangeRate: 4250.0,
        marketRate: 4200.0,
        fee: 1.5,
        feePercentage: 1.5,
        status: 'completed',
        createdAt: DateTime.now(),
      );

      // (4250 - 4200) / 4200 * 100 = 1.19%
      expect(transaction.rateDifference, closeTo(1.19, 0.01));
    });

    test('status helpers should return correct values', () {
      final pending = Transaction(
        id: 'tx_1',
        userId: '1',
        currencyFrom: 'USD',
        currencyTo: 'COP',
        amount: 100.0,
        amountReceived: 425000.0,
        exchangeRate: 4250.0,
        marketRate: 4200.0,
        fee: 1.5,
        feePercentage: 1.5,
        status: 'pending',
        createdAt: DateTime.now(),
      );

      expect(pending.isPending, isTrue);
      expect(pending.isCompleted, isFalse);
      expect(pending.isFailed, isFalse);

      final completed = pending.copyWith(status: 'completed');
      expect(completed.isCompleted, isTrue);
      expect(completed.isPending, isFalse);
    });

    test('statusDisplay should return formatted status', () {
      final transaction = Transaction(
        id: 'tx_123',
        userId: '1',
        currencyFrom: 'USD',
        currencyTo: 'COP',
        amount: 100.0,
        amountReceived: 425000.0,
        exchangeRate: 4250.0,
        marketRate: 4200.0,
        fee: 1.5,
        feePercentage: 1.5,
        status: 'processing',
        createdAt: DateTime.now(),
      );

      expect(transaction.statusDisplay, equals('Processing'));
    });
  });
}
