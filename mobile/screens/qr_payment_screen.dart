import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'dart:convert';
import '../models/offer.dart';
import '../models/user.dart';

class QRPaymentScreen extends StatefulWidget {
  final bool isScanning;
  final Map<String, dynamic>? paymentData;

  const QRPaymentScreen({
    Key? key,
    this.isScanning = true,
    this.paymentData,
  }) : super(key: key);

  @override
  State<QRPaymentScreen> createState() => _QRPaymentScreenState();
}

class _QRPaymentScreenState extends State<QRPaymentScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  MobileScannerController? _scannerController;
  bool _isProcessing = false;
  String? _scannedData;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(
      length: 2,
      vsync: this,
      initialIndex: widget.isScanning ? 0 : 1,
    );
    if (widget.isScanning) {
      _scannerController = MobileScannerController();
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    _scannerController?.dispose();
    super.dispose();
  }

  void _onQRScanned(BarcodeCapture capture) {
    if (_isProcessing) return;

    final List<Barcode> barcodes = capture.barcodes;
    if (barcodes.isEmpty) return;

    final String? code = barcodes.first.rawValue;
    if (code == null || code.isEmpty) return;

    setState(() {
      _isProcessing = true;
      _scannedData = code;
    });

    _processQRCode(code);
  }

  void _processQRCode(String qrData) async {
    try {
      // Parse QR code data
      final data = jsonDecode(qrData) as Map<String, dynamic>;

      // Validate required fields
      if (!data.containsKey('type') || data['type'] != 'trueque_payment') {
        _showError('Invalid QR code format');
        return;
      }

      // Extract payment information
      final paymentInfo = {
        'truequeId': data['trueque_id'],
        'amount': data['amount'],
        'currency': data['currency'],
        'recipientName': data['recipient_name'],
        'timestamp': data['timestamp'],
      };

      // Navigate to confirm transaction screen
      if (mounted) {
        Navigator.pushNamed(
          context,
          '/confirm-transaction',
          arguments: {
            'offer': _createOfferFromQR(paymentInfo),
            'counterparty': _createUserFromQR(paymentInfo),
            'exchangeRate': data['exchange_rate'] ?? 1.0,
            'fee': data['fee'] ?? 0.0,
            'feePercentage': data['fee_percentage'] ?? 1.5,
          },
        );
      }
    } catch (e) {
      _showError('Failed to process QR code: ${e.toString()}');
    } finally {
      setState(() {
        _isProcessing = false;
      });
    }
  }

  Offer _createOfferFromQR(Map<String, dynamic> data) {
    return Offer(
      id: 0,
      uuid: 'qr_${DateTime.now().millisecondsSinceEpoch}',
      userId: 'current_user', // Replace with actual user ID
      country: 'CO',
      currencyFrom: 'USD',
      currencyTo: data['currency'] ?? 'COP',
      amount: (data['amount'] ?? 0).toDouble(),
      marketRate: 0,
      status: 'pending',
    );
  }

  User _createUserFromQR(Map<String, dynamic> data) {
    return User(
      id: '0',
      truequeId: data['truequeId'] ?? 'unknown',
      email: '',
      country: 'CO',
      kycStatus: 'verified',
      createdAt: DateTime.now(),
      firstName: data['recipientName'],
    );
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

  String _generateQRData() {
    final data = widget.paymentData ?? {
      'type': 'trueque_payment',
      'trueque_id': 'TRQ-123456', // Replace with actual user Trueque ID
      'amount': 100.0,
      'currency': 'COP',
      'recipient_name': 'John Doe', // Replace with actual user name
      'timestamp': DateTime.now().toIso8601String(),
      'exchange_rate': 4250.5,
      'fee': 1.5,
      'fee_percentage': 1.5,
    };

    return jsonEncode(data);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('QR Payment'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(icon: Icon(Icons.qr_code_scanner), text: 'Scan'),
            Tab(icon: Icon(Icons.qr_code), text: 'Receive'),
          ],
          onTap: (index) {
            if (index == 0 && _scannerController == null) {
              setState(() {
                _scannerController = MobileScannerController();
              });
            }
          },
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildScanTab(),
          _buildReceiveTab(),
        ],
      ),
    );
  }

  Widget _buildScanTab() {
    if (_scannerController == null) {
      return const Center(
        child: CircularProgressIndicator(),
      );
    }

    return Stack(
      children: [
        MobileScanner(
          controller: _scannerController,
          onDetect: _onQRScanned,
        ),
        // Overlay with scanning frame
        CustomPaint(
          painter: ScannerOverlayPainter(),
          child: Container(),
        ),
        // Instructions
        Positioned(
          top: 50,
          left: 0,
          right: 0,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            margin: const EdgeInsets.symmetric(horizontal: 32),
            decoration: BoxDecoration(
              color: Colors.black.withOpacity(0.7),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Text(
              'Point your camera at a Trueque QR code',
              style: TextStyle(
                color: Colors.white,
                fontSize: 16,
              ),
              textAlign: TextAlign.center,
            ),
          ),
        ),
        // Flash toggle
        Positioned(
          bottom: 100,
          left: 0,
          right: 0,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              IconButton(
                onPressed: () => _scannerController?.toggleTorch(),
                icon: const Icon(Icons.flash_on),
                color: Colors.white,
                iconSize: 32,
                style: IconButton.styleFrom(
                  backgroundColor: Colors.black.withOpacity(0.5),
                ),
              ),
              const SizedBox(width: 16),
              IconButton(
                onPressed: () => _scannerController?.switchCamera(),
                icon: const Icon(Icons.flip_camera_ios),
                color: Colors.white,
                iconSize: 32,
                style: IconButton.styleFrom(
                  backgroundColor: Colors.black.withOpacity(0.5),
                ),
              ),
            ],
          ),
        ),
        // Processing overlay
        if (_isProcessing)
          Container(
            color: Colors.black.withOpacity(0.7),
            child: const Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  CircularProgressIndicator(color: Colors.white),
                  SizedBox(height: 16),
                  Text(
                    'Processing QR code...',
                    style: TextStyle(color: Colors.white, fontSize: 16),
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildReceiveTab() {
    final qrData = _generateQRData();

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          const SizedBox(height: 20),
          const Text(
            'Show this QR code to receive payment',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 32),
          // QR Code
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.1),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: QrImageView(
              data: qrData,
              version: QrVersions.auto,
              size: 280.0,
              backgroundColor: Colors.white,
              errorCorrectionLevel: QrErrorCorrectLevel.H,
            ),
          ),
          const SizedBox(height: 32),
          // Payment details
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
                  const Text(
                    'Payment Details',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 12),
                  _buildDetailRow('Trueque ID', 'TRQ-123456'),
                  const SizedBox(height: 8),
                  _buildDetailRow('Amount', '100.00 COP'),
                  const SizedBox(height: 8),
                  _buildDetailRow('Valid Until', '5 minutes'),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),
          // Share button
          ElevatedButton.icon(
            onPressed: () {
              // TODO: Implement share functionality
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Share functionality coming soon')),
              );
            },
            icon: const Icon(Icons.share),
            label: const Text('Share QR Code'),
            style: ElevatedButton.styleFrom(
              minimumSize: const Size(double.infinity, 50),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            color: Colors.grey[600],
            fontSize: 14,
          ),
        ),
        Text(
          value,
          style: const TextStyle(
            fontWeight: FontWeight.w600,
            fontSize: 14,
          ),
        ),
      ],
    );
  }
}

// Custom painter for scanner overlay
class ScannerOverlayPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.black.withOpacity(0.5)
      ..style = PaintingStyle.fill;

    final scanAreaSize = size.width * 0.7;
    final left = (size.width - scanAreaSize) / 2;
    final top = (size.height - scanAreaSize) / 2;

    // Draw semi-transparent overlay
    canvas.drawPath(
      Path()
        ..addRect(Rect.fromLTWH(0, 0, size.width, size.height))
        ..addRect(Rect.fromLTWH(left, top, scanAreaSize, scanAreaSize))
        ..fillType = PathFillType.evenOdd,
      paint,
    );

    // Draw corner brackets
    final cornerPaint = Paint()
      ..color = Colors.green
      ..style = PaintingStyle.stroke
      ..strokeWidth = 4;

    final cornerLength = 30.0;

    // Top-left
    canvas.drawLine(Offset(left, top), Offset(left + cornerLength, top), cornerPaint);
    canvas.drawLine(Offset(left, top), Offset(left, top + cornerLength), cornerPaint);

    // Top-right
    canvas.drawLine(Offset(left + scanAreaSize, top), Offset(left + scanAreaSize - cornerLength, top), cornerPaint);
    canvas.drawLine(Offset(left + scanAreaSize, top), Offset(left + scanAreaSize, top + cornerLength), cornerPaint);

    // Bottom-left
    canvas.drawLine(Offset(left, top + scanAreaSize), Offset(left + cornerLength, top + scanAreaSize), cornerPaint);
    canvas.drawLine(Offset(left, top + scanAreaSize), Offset(left, top + scanAreaSize - cornerLength), cornerPaint);

    // Bottom-right
    canvas.drawLine(Offset(left + scanAreaSize, top + scanAreaSize), Offset(left + scanAreaSize - cornerLength, top + scanAreaSize), cornerPaint);
    canvas.drawLine(Offset(left + scanAreaSize, top + scanAreaSize), Offset(left + scanAreaSize, top + scanAreaSize - cornerLength), cornerPaint);
  }

  @override
  bool shouldRepaint(CustomPainter oldDelegate) => false;
}
