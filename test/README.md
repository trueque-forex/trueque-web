# Trueque Mobile App - Testing Guide

## Overview

This directory contains the test suite for the Trueque mobile Flutter application. Tests are organized into three categories: unit tests, widget tests, and integration tests.

## Test Structure

```
test/
├── unit/                    # Unit tests for models and services
│   ├── api_service_test.dart
│   ├── user_model_test.dart
│   └── transaction_model_test.dart
├── widget/                  # Widget tests for UI components
│   ├── payment_status_screen_test.dart
│   └── trueque_button_test.dart
└── integration/             # End-to-end integration tests
    └── transaction_flow_test.dart
```

## Running Tests

### Run All Tests
```bash
flutter test
```

### Run Unit Tests Only
```bash
flutter test test/unit/
```

### Run Widget Tests Only
```bash
flutter test test/widget/
```

### Run Integration Tests
```bash
flutter test integration_test/transaction_flow_test.dart
```

### Run Tests with Coverage
```bash
flutter test --coverage
genhtml coverage/lcov.info -o coverage/html
```

## Test Categories

### Unit Tests

Unit tests verify the behavior of individual classes and functions in isolation.

**api_service_test.dart**
- Authentication (login, signup, logout)
- User profile management
- Transaction operations
- Error handling

**user_model_test.dart**
- JSON parsing and serialization
- Display name logic
- KYC status helpers
- copyWith functionality

**transaction_model_test.dart**
- JSON parsing
- Rate calculations (effective rate, rate difference)
- Status helpers
- Display formatting

### Widget Tests

Widget tests verify UI components render correctly and respond to user interactions.

**payment_status_screen_test.dart**
- Status display (processing, completed, failed)
- Animation behavior
- Action button visibility
- Navigation prevention during processing

**trueque_button_test.dart**
- Text and icon display
- Loading state
- Tap handling
- Disabled state
- Outlined variant

### Integration Tests

Integration tests verify complete user flows work end-to-end.

**transaction_flow_test.dart**
- Complete transaction flow: offer → match → confirm → status
- QR payment flow
- Error handling scenarios

## Important Notes

### API Service Tests

The current `api_service_test.dart` contains test structure but requires dependency injection to run properly. To make these tests executable:

1. Modify `ApiService` to accept an `http.Client` parameter
2. Use `MockClient` from `package:http/testing.dart` in tests
3. Update all API methods to use the injected client

Example:
```dart
class ApiService {
  final http.Client client;
  
  ApiService({http.Client? client}) 
    : client = client ?? http.Client();
    
  Future<Map<String, dynamic>> login(...) async {
    final response = await client.post(...);
    // ...
  }
}
```

### Integration Tests

Integration tests require:
- Running backend server (`npm run dev` from `trueque_web/`)
- Proper test data in the database
- Camera permissions for QR tests (on real devices)

### Mocking

For tests that require mocking:
- Use `package:mockito` or `package:mocktail` for creating mocks
- Mock HTTP responses with `package:http/testing.dart`
- Mock platform-specific features (camera, biometrics) as needed

## Test Coverage Goals

- **Unit Tests:** 80%+ coverage for models and services
- **Widget Tests:** 70%+ coverage for custom widgets and screens
- **Integration Tests:** Cover all critical user flows

## Continuous Integration

To run tests in CI/CD:

```yaml
# Example GitHub Actions workflow
- name: Run tests
  run: flutter test --coverage
  
- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/lcov.info
```

## Writing New Tests

### Unit Test Template

```dart
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('MyClass Tests', () {
    test('should do something', () {
      // Arrange
      final instance = MyClass();
      
      // Act
      final result = instance.doSomething();
      
      // Assert
      expect(result, equals(expectedValue));
    });
  });
}
```

### Widget Test Template

```dart
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('MyWidget should display text', (WidgetTester tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: MyWidget(),
        ),
      ),
    );

    expect(find.text('Expected Text'), findsOneWidget);
  });
}
```

## Troubleshooting

### Tests Failing Due to Missing Dependencies

Run `flutter pub get` to ensure all test dependencies are installed.

### Integration Tests Timing Out

Increase timeout duration:
```dart
testWidgets('my test', (tester) async {
  // ...
}, timeout: Timeout(Duration(minutes: 5)));
```

### Widget Tests Failing on CI

Ensure you're using `pumpAndSettle()` to wait for animations:
```dart
await tester.pumpAndSettle();
```

## Resources

- [Flutter Testing Documentation](https://docs.flutter.dev/testing)
- [Effective Dart: Testing](https://dart.dev/guides/language/effective-dart/testing)
- [Widget Testing Guide](https://docs.flutter.dev/cookbook/testing/widget/introduction)
