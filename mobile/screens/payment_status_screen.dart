import 'package:flutter/material.dart';
import 'dart:async';
import '../services/settlement_service.dart';

class PaymentStatusScreen extends StatefulWidget {
  const PaymentStatusScreen({Key? key}) : super(key: key);

  @override
  State<PaymentStatusScreen> createState() => _PaymentStatusScreenState();
}

class _PaymentStatusScreenState extends State<PaymentStatusScreen> with SingleTickerProviderStateMixin {
  String _status = 'processing';
  Timer? _statusTimer;
  late AnimationController _animationController;
  late Animation<double> _pulseAnimation;
  
  String? _transactionId;
  double? _amount;
  double? _amountReceived;
  String? _currencyFrom;
  String? _currencyTo;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    )..repeat(reverse: true);
    
    _pulseAnimation = Tween<double>(begin: 0.95, end: 1.05).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeInOut),
    );
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    
    // Get arguments from navigation
    final args = ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
    if (args != null) {
      _transactionId = args['transactionId'] as String?;
      _amount = args['amount'] as double?;
      _amountReceived = args['amountReceived'] as double?;
      _currencyFrom = args['currencyFrom'] as String?;
      _currencyTo = args['currencyTo'] as String?;
      _status = args['status'] as String? ?? 'processing';
      
      // Start polling for status updates if processing
      if (_status == 'processing') {
        _startStatusPolling();
      }
    }
  }

  @override
  void dispose() {
    _statusTimer?.cancel();
    _animationController.dispose();
    super.dispose();
  }

  void _startStatusPolling() {
    _statusTimer = Timer.periodic(const Duration(seconds: 3), (timer) async {
      if (_transactionId != null) {
        try {
          final status = await SettlementService.getTransactionStatus(_transactionId!);
          if (mounted && status != _status) {
            setState(() {
              _status = status;
            });
            
            // Stop polling if transaction is complete or failed
            if (status == 'completed' || status == 'failed') {
              timer.cancel();
              _animationController.stop();
            }
          }
        } catch (e) {
          // Continue polling on error
        }
      }
    });
  }

  void _navigateToHistory() {
    Navigator.pushNamedAndRemoveUntil(
      context,
      '/history',
      (route) => route.isFirst,
    );
  }

  void _navigateToHome() {
    Navigator.pushNamedAndRemoveUntil(
      context,
      '/currency',
      (route) => false,
    );
  }

  void _retryTransaction() {
    Navigator.pop(context);
  }

  Color _getStatusColor() {
    switch (_status) {
      case 'completed':
        return Colors.green;
      case 'failed':
        return Colors.red;
      case 'processing':
      case 'pending':
        return Colors.orange;
      default:
        return Colors.grey;
    }
  }

  IconData _getStatusIcon() {
    switch (_status) {
      case 'completed':
        return Icons.check_circle;
      case 'failed':
        return Icons.error;
      case 'processing':
      case 'pending':
        return Icons.hourglass_empty;
      default:
        return Icons.info;
    }
  }

  String _getStatusTitle() {
    switch (_status) {
      case 'completed':
        return 'Transaction Completed';
      case 'failed':
        return 'Transaction Failed';
      case 'processing':
        return 'Processing Transaction';
      case 'pending':
        return 'Transaction Pending';
      default:
        return 'Transaction Status';
    }
  }

  String _getStatusMessage() {
    switch (_status) {
      case 'completed':
        return 'Your transaction has been completed successfully!';
      case 'failed':
        return 'Unfortunately, your transaction could not be processed. Please try again.';
      case 'processing':
        return 'Your transaction is being processed. This may take a few moments.';
      case 'pending':
        return 'Your transaction is pending confirmation.';
      default:
        return 'Checking transaction status...';
    }
  }

  @override
  Widget build(BuildContext context) {
    final statusColor = _getStatusColor();
    final statusIcon = _getStatusIcon();

    return WillPopScope(
      onWillPop: () async {
        // Prevent back navigation during processing
        return _status != 'processing';
      },
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Payment Status'),
          automaticallyImplyLeading: _status != 'processing',
          elevation: 0,
        ),
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Status Icon
                ScaleTransition(
                  scale: _status == 'processing' ? _pulseAnimation : const AlwaysStoppedAnimation(1.0),
                  child: Container(
                    width: 120,
                    height: 120,
                    decoration: BoxDecoration(
                      color: statusColor.withOpacity(0.1),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      statusIcon,
                      size: 64,
                      color: statusColor,
                    ),
                  ),
                ),
                const SizedBox(height: 32),

                // Status Title
                Text(
                  _getStatusTitle(),
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 16),

                // Status Message
                Text(
                  _getStatusMessage(),
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                        color: Colors.grey[600],
                      ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 32),

                // Transaction Details Card
                if (_amount != null && _currencyFrom != null)
                  Card(
                    elevation: 2,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        children: [
                          _buildDetailRow('Transaction ID', _transactionId ?? 'N/A'),
                          const Divider(height: 24),
                          _buildDetailRow('Amount Sent', '${_amount!.toStringAsFixed(2)} $_currencyFrom'),
                          if (_amountReceived != null && _currencyTo != null) ...[
                            const SizedBox(height: 8),
                            _buildDetailRow('Amount Received', '${_amountReceived!.toStringAsFixed(2)} $_currencyTo'),
                          ],
                          const Divider(height: 24),
                          _buildDetailRow('Status', _status.toUpperCase(), 
                            valueColor: statusColor,
                            valueWeight: FontWeight.bold,
                          ),
                          _buildDetailRow('Time', _formatTime(DateTime.now())),
                        ],
                      ),
                    ),
                  ),
                const SizedBox(height: 32),

                // Loading Indicator for Processing
                if (_status == 'processing')
                  const CircularProgressIndicator(),

                const Spacer(),

                // Action Buttons
                if (_status == 'completed') ...[
                  ElevatedButton(
                    onPressed: _navigateToHistory,
                    style: ElevatedButton.styleFrom(
                      minimumSize: const Size(double.infinity, 50),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    child: const Text('View Transaction History'),
                  ),
                  const SizedBox(height: 12),
                  OutlinedButton(
                    onPressed: _navigateToHome,
                    style: OutlinedButton.styleFrom(
                      minimumSize: const Size(double.infinity, 50),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    child: const Text('Make Another Transaction'),
                  ),
                ],

                if (_status == 'failed') ...[
                  ElevatedButton(
                    onPressed: _retryTransaction,
                    style: ElevatedButton.styleFrom(
                      minimumSize: const Size(double.infinity, 50),
                      backgroundColor: Colors.red,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    child: const Text('Retry Transaction'),
                  ),
                  const SizedBox(height: 12),
                  OutlinedButton(
                    onPressed: _navigateToHome,
                    style: OutlinedButton.styleFrom(
                      minimumSize: const Size(double.infinity, 50),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    child: const Text('Go to Home'),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value, {Color? valueColor, FontWeight? valueWeight}) {
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
        Flexible(
          child: Text(
            value,
            style: TextStyle(
              fontWeight: valueWeight ?? FontWeight.w600,
              fontSize: 14,
              color: valueColor,
            ),
            textAlign: TextAlign.end,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }

  String _formatTime(DateTime time) {
    return '${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}';
  }
}
