import 'package:flutter_test/flutter_test.dart';
import 'package:trueque_mobile/models/user.dart';

void main() {
  group('User Model Tests', () {
    test('fromJson should correctly parse user data', () {
      final json = {
        'id': '1',
        'trueque_id': 'TRQ-123456',
        'email': 'test@example.com',
        'country': 'CO',
        'first_name': 'John',
        'last_name': 'Doe',
        'kyc_status': 'verified',
        'created_at': '2025-01-01T00:00:00Z',
        'is_admin': false,
      };

      final user = User.fromJson(json);

      expect(user.id, equals('1'));
      expect(user.truequeId, equals('TRQ-123456'));
      expect(user.email, equals('test@example.com'));
      expect(user.firstName, equals('John'));
      expect(user.lastName, equals('Doe'));
      expect(user.kycStatus, equals('verified'));
      expect(user.isAdmin, equals(false));
    });

    test('toJson should correctly serialize user data', () {
      final user = User(
        id: '1',
        truequeId: 'TRQ-123456',
        email: 'test@example.com',
        country: 'CO',
        kycStatus: 'verified',
        createdAt: DateTime.parse('2025-01-01T00:00:00Z'),
      );

      final json = user.toJson();

      expect(json['id'], equals('1'));
      expect(json['trueque_id'], equals('TRQ-123456'));
      expect(json['email'], equals('test@example.com'));
      expect(json['kyc_status'], equals('verified'));
    });

    test('displayName should return full name when available', () {
      final user = User(
        id: '1',
        truequeId: 'TRQ-123456',
        email: 'test@example.com',
        country: 'CO',
        firstName: 'John',
        lastName: 'Doe',
        kycStatus: 'verified',
        createdAt: DateTime.now(),
      );

      expect(user.displayName, equals('John Doe'));
    });

    test('displayName should return truequeId when name not available', () {
      final user = User(
        id: '1',
        truequeId: 'TRQ-123456',
        email: 'test@example.com',
        country: 'CO',
        kycStatus: 'verified',
        createdAt: DateTime.now(),
      );

      expect(user.displayName, equals('TRQ-123456'));
    });

    test('isKycVerified should return true for verified status', () {
      final user = User(
        id: '1',
        truequeId: 'TRQ-123456',
        email: 'test@example.com',
        country: 'CO',
        kycStatus: 'verified',
        createdAt: DateTime.now(),
      );

      expect(user.isKycVerified, isTrue);
      expect(user.isKycPending, isFalse);
      expect(user.isKycRejected, isFalse);
    });

    test('copyWith should create new instance with updated fields', () {
      final user = User(
        id: '1',
        truequeId: 'TRQ-123456',
        email: 'test@example.com',
        country: 'CO',
        kycStatus: 'pending',
        createdAt: DateTime.now(),
      );

      final updatedUser = user.copyWith(
        kycStatus: 'verified',
        firstName: 'John',
      );

      expect(updatedUser.kycStatus, equals('verified'));
      expect(updatedUser.firstName, equals('John'));
      expect(updatedUser.id, equals(user.id)); // Unchanged fields preserved
      expect(updatedUser.truequeId, equals(user.truequeId));
    });
  });
}
