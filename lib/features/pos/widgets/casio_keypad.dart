import 'package:flutter/material.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/utils/money_format.dart';

class CasioKeypad extends StatefulWidget {
  final String title;
  final String subtitle;
  final int initialValue;
  final bool isMoney; // true: format VND (ví dụ 180.000 đ), false: format số lượng nguyên (ví dụ: 12)
  final ValueChanged<int> onConfirm;
  final VoidCallback? onCancel;

  const CasioKeypad({
    super.key,
    required this.title,
    this.subtitle = '',
    this.initialValue = 0,
    this.isMoney = true,
    required this.onConfirm,
    this.onCancel,
  });

  /// Hiển thị CASIO keypad dưới dạng BottomSheet toàn màn hình tiện lợi
  static Future<int?> show(
    BuildContext context, {
    required String title,
    String subtitle = '',
    int initialValue = 0,
    bool isMoney = true,
  }) {
    return showModalBottomSheet<int>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => CasioKeypad(
        title: title,
        subtitle: subtitle,
        initialValue: initialValue,
        isMoney: isMoney,
        onConfirm: (val) => Navigator.pop(ctx, val),
        onCancel: () => Navigator.pop(ctx, null),
      ),
    );
  }

  @override
  State<CasioKeypad> createState() => _CasioKeypadState();
}

class _CasioKeypadState extends State<CasioKeypad> {
  late String _currentDigits;

  @override
  void initState() {
    super.initState();
    _currentDigits = widget.initialValue > 0 ? widget.initialValue.toString() : '';
  }

  int get _numericValue {
    if (_currentDigits.isEmpty) return 0;
    return int.tryParse(_currentDigits) ?? 0;
  }

  void _onDigitPressed(String digit) {
    if (_currentDigits.length >= 10) return; // Giới hạn tối đa 10 chữ số
    setState(() {
      if (_currentDigits == '0') {
        _currentDigits = digit;
      } else {
        _currentDigits += digit;
      }
    });
  }

  void _onTripleZeroPressed() {
    if (_currentDigits.isEmpty || _currentDigits == '0') return;
    if (_currentDigits.length >= 8) return;
    setState(() {
      _currentDigits += '000';
    });
  }

  void _onBackspacePressed() {
    if (_currentDigits.isEmpty) return;
    setState(() {
      _currentDigits = _currentDigits.substring(0, _currentDigits.length - 1);
    });
  }

  void _onClearPressed() {
    setState(() {
      _currentDigits = '';
    });
  }

  @override
  Widget build(BuildContext context) {
    final displayText = widget.isMoney
        ? MoneyFormat.formatVND(_numericValue)
        : (_currentDigits.isEmpty ? '0' : _currentDigits);

    final isHugeAmount = widget.isMoney && _numericValue >= 1000000;

    return Container(
      decoration: const BoxDecoration(
        color: AppColors.cardBg,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Handle bar
            Center(
              child: Container(
                width: 48,
                height: 5,
                decoration: BoxDecoration(
                  color: AppColors.borderColor,
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
            ),
            const SizedBox(height: 12),

            // Tiêu đề
            Text(
              widget.title,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w900,
                color: AppColors.textMain,
              ),
            ),
            if (widget.subtitle.isNotEmpty) ...[
              const SizedBox(height: 4),
              Text(
                widget.subtitle,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textMuted,
                ),
              ),
            ],
            const SizedBox(height: 12),

            // Ô hiển thị số to khổng lồ
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              decoration: BoxDecoration(
                color: AppColors.bgLight,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: isHugeAmount ? AppColors.dangerRed : AppColors.dineInBlue,
                  width: 2.5,
                ),
              ),
              child: Column(
                children: [
                  Text(
                    displayText,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 34,
                      fontWeight: FontWeight.w900,
                      color: isHugeAmount ? AppColors.dangerRed : AppColors.dineInBlue,
                      letterSpacing: 1.0,
                    ),
                  ),
                  if (isHugeAmount) ...[
                    const SizedBox(height: 4),
                    const Text(
                      '⚠️ Số tiền lớn (≥ 1.000.000 đ), hãy kiểm tra kỹ số 0!',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w800,
                        color: AppColors.dangerRed,
                      ),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 16),

            // BÀN PHÍM CASIO
            Row(
              children: [
                _buildKey('1'),
                const SizedBox(width: 8),
                _buildKey('2'),
                const SizedBox(width: 8),
                _buildKey('3'),
                const SizedBox(width: 8),
                _buildActionKey(
                  '⌫',
                  color: const Color(0xFFEF4444),
                  onTap: _onBackspacePressed,
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                _buildKey('4'),
                const SizedBox(width: 8),
                _buildKey('5'),
                const SizedBox(width: 8),
                _buildKey('6'),
                const SizedBox(width: 8),
                _buildActionKey(
                  'XÓA HẾT',
                  fontSize: 14,
                  color: const Color(0xFF64748B),
                  onTap: _onClearPressed,
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                _buildKey('7'),
                const SizedBox(width: 8),
                _buildKey('8'),
                const SizedBox(width: 8),
                _buildKey('9'),
                const SizedBox(width: 8),
                _buildActionKey(
                  '000',
                  color: const Color(0xFF0284C7),
                  onTap: _onTripleZeroPressed,
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                _buildKey('0', flex: 2),
                const SizedBox(width: 8),
                Expanded(
                  flex: 2,
                  child: SizedBox(
                    height: 64,
                    child: ElevatedButton(
                      onPressed: () {
                        widget.onConfirm(_numericValue);
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primaryGreen,
                        foregroundColor: Colors.white,
                        elevation: 3,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                      child: const Text(
                        'ĐỒNG Ý ✔',
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildKey(String label, {int flex = 1}) {
    return Expanded(
      flex: flex,
      child: SizedBox(
        height: 64,
        child: OutlinedButton(
          onPressed: () => _onDigitPressed(label),
          style: OutlinedButton.styleFrom(
            backgroundColor: Colors.white,
            side: const BorderSide(color: AppColors.borderColor, width: 1.5),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          ),
          child: Text(
            label,
            style: const TextStyle(
              fontSize: 26,
              fontWeight: FontWeight.w900,
              color: AppColors.textMain,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildActionKey(
    String label, {
    required Color color,
    required VoidCallback onTap,
    double fontSize = 22,
  }) {
    return Expanded(
      child: SizedBox(
        height: 64,
        child: ElevatedButton(
          onPressed: onTap,
          style: ElevatedButton.styleFrom(
            backgroundColor: color.withOpacity(0.12),
            foregroundColor: color,
            elevation: 0,
            side: BorderSide(color: color.withOpacity(0.4), width: 1.5),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: fontSize,
              fontWeight: FontWeight.w900,
              color: color,
            ),
          ),
        ),
      ),
    );
  }
}
