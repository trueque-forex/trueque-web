import 'package:flutter/material.dart';
import '../services/dispute_service.dart';

class DisputeScreen extends StatefulWidget {
  final int offerId;
  final DisputeService disputeService;

  const DisputeScreen({
    Key? key,
    required this.offerId,
    required this.disputeService,
  }) : super(key: key);

  @override
  State<DisputeScreen> createState() => _DisputeScreenState();
}

class _DisputeScreenState extends State<DisputeScreen> {
  final TextEditingController _pinController = TextEditingController();
  String? _errorMessage;
  bool _isSubmitting = false;

  Future<void> _submitDispute() async {
    final pin = _pinController.text.trim();
    if (pin.isEmpty) {
      setState(() => _errorMessage = 'Please enter your PIN');
      return;
    }

    setState(() {
      _isSubmitting = true;
      _errorMessage = null;
    });

    try {
      final result = await widget.disputeService.flagDispute(
        offerId: widget.offerId,
        pin: pin,
      );
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(result['message'] ?? 'Dispute flagged')),
      );
      Navigator.pop(context);
    } catch (e) {
      setState(() => _errorMessage = e.toString());
    } finally {
      setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Flag Dispute')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            const Text('Enter your PIN to confirm dispute:'),
            TextField(
              controller: _pinController,
              obscureText: true,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'PIN'),
            ),
            if (_errorMessage != null)
              Padding(
                padding: const EdgeInsets.only(top: 8.0),
                child: Text(_errorMessage!, style: const TextStyle(color: Colors.red)),
              ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: _isSubmitting ? null : _submitDispute,
              child: _isSubmitting
                  ? const CircularProgressIndicator()
                  : const Text('Submit Dispute'),
            ),
          ],
        ),
      ),
    );
  }
}