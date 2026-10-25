import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_strings.dart';
import '../../core/utils/money_format.dart';
import '../../core/utils/order_calculator.dart';
import '../../data/models/order_model.dart';
import '../../data/repositories/order_repository.dart';
import '../../services/audio_service.dart';

class OrderReviewScreen extends StatefulWidget {
  final bool isDineIn;
  final List<OrderItemModel> items;

  const OrderReviewScreen({
    super.key,
    required this.isDineIn,
    required this.items,
  });

  @override
  State<OrderReviewScreen> createState() => _OrderReviewScreenState();
}

class _OrderReviewScreenState extends State<OrderReviewScreen> {
  final _orderRepo = OrderRepository();
  late List<OrderItemModel> _currentItems;
  bool _isSubmitting = false;
  bool _isSuccess = false;

  @override
  void initState() {
    super.initState();
    _currentItems = List.from(widget.items);
  }

  int get _totalAmount {
    return _currentItems.fold(0, (sum, item) => sum + item.subtotal);
  }

  void _incrementItem(int index) {
    if (_isSubmitting) return;
    setState(() {
      final old = _currentItems[index];
      final newQty = old.quantity + 1;
      final newSubtotal = OrderCalculator.calculateSubtotal(old.price, newQty);
      _currentItems[index] = OrderItemModel(
        productId: old.productId,
        name: old.name,
        icon: old.icon,
        price: old.price,
        quantity: newQty,
        subtotal: newSubtotal,
        trackStock: old.trackStock,
      );
    });
  }

  void _decrementItem(int index) {
    if (_isSubmitting) return;
    setState(() {
      final old = _currentItems[index];
      if (old.quantity > 1) {
        final newQty = old.quantity - 1;
        final newSubtotal = OrderCalculator.calculateSubtotal(old.price, newQty);
        _currentItems[index] = OrderItemModel(
          productId: old.productId,
          name: old.name,
          icon: old.icon,
          price: old.price,
          quantity: newQty,
          subtotal: newSubtotal,
          trackStock: old.trackStock,
        );
      } else {
        _currentItems.removeAt(index);
      }
    });

    if (_currentItems.isEmpty) {
      Navigator.pop(context, false);
    }
  }

  void _removeItem(int index) {
    if (_isSubmitting) return;
    setState(() {
      _currentItems.removeAt(index);
    });
    if (_currentItems.isEmpty) {
      Navigator.pop(context, false);
    }
  }

  Future<void> _handleCompleteOrder() async {
    if (_isSubmitting || _currentItems.isEmpty) return;

    setState(() {
      _isSubmitting = true; // Khóa nút ngay lập tức để chống bấm đúp
    });

    try {
      // 1. Gửi đơn hàng Offline-Safe không await
      await _orderRepo.submitOrder(
        orderType: widget.isDineIn ? OrderType.dineIn : OrderType.takeAway,
        items: _currentItems,
        totalAmount: _totalAmount,
        createdBy: 'POS_DEVICE',
      );

      // 2. Phát tiếng "Ting" thành công và rung
      await AudioService().playSuccess();

      // 3. Hiển thị tích xanh thành công
      if (mounted) {
        setState(() {
          _isSuccess = true;
        });
      }

      // 4. Chờ 1.5 giây để ba mẹ nhìn rõ tích xanh rồi tự quay về
      await Future.delayed(const Duration(milliseconds: 1500));

      if (mounted) {
        Navigator.pop(context, true); // Thành công, reset giỏ hàng
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _isSubmitting = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Có lỗi xảy ra, vui lòng thử lại!'),
            backgroundColor: AppColors.dangerRed,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isSuccess) {
      return Scaffold(
        backgroundColor: Colors.white,
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 120,
                height: 120,
                decoration: const BoxDecoration(
                  color: AppColors.primaryGreen,
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.check, color: Colors.white, size: 80),
              ),
              const SizedBox(height: 24),
              const Text(
                'ĐÃ LƯU ĐƠN THÀNH CÔNG!',
                style: TextStyle(
                  fontSize: 26,
                  fontWeight: FontWeight.w900,
                  color: AppColors.primaryGreen,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                MoneyFormat.formatVND(_totalAmount),
                style: const TextStyle(
                  fontSize: 32,
                  fontWeight: FontWeight.w900,
                  color: AppColors.textMain,
                ),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.bgLight,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 1,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, color: AppColors.textMain, size: 28),
          onPressed: _isSubmitting ? null : () => Navigator.pop(context, false),
        ),
        title: Text(
          widget.isDineIn ? 'XEM LẠI ĐƠN (TẠI QUÁN)' : 'XEM LẠI ĐƠN (MANG VỀ)',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w900,
            color: widget.isDineIn ? AppColors.dineInBlue : AppColors.takeawayOrange,
          ),
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            // DANH SÁCH MÓN ĐÃ CHỌN
            Expanded(
              child: ListView.separated(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 20),
                itemCount: _currentItems.length,
                separatorBuilder: (_, __) => const SizedBox(height: 12),
                itemBuilder: (context, index) {
                  final item = _currentItems[index];

                  return Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                    decoration: BoxDecoration(
                      color: AppColors.cardBg,
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: AppColors.borderColor, width: 1.5),
                    ),
                    child: Row(
                      children: [
                        // Icon món
                        Container(
                          width: 48,
                          height: 48,
                          decoration: BoxDecoration(
                            color: AppColors.bgLight,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Center(
                            child: Text(item.icon, style: const TextStyle(fontSize: 28)),
                          ),
                        ),
                        const SizedBox(width: 12),

                        // Tên món và giá lẻ
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                item.name.toUpperCase(),
                                style: const TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w900,
                                  color: AppColors.textMain,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                '${MoneyFormat.formatVND(item.price)} x ${item.quantity}',
                                style: const TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.textMuted,
                                ),
                              ),
                              Text(
                                '= ${MoneyFormat.formatVND(item.subtotal)}',
                                style: const TextStyle(
                                  fontSize: 17,
                                  fontWeight: FontWeight.w900,
                                  color: AppColors.primaryGreen,
                                ),
                              ),
                            ],
                          ),
                        ),

                        // NÚT TRỪ TO
                        SizedBox(
                          width: 56,
                          height: 56,
                          child: ElevatedButton(
                            onPressed: _isSubmitting ? null : () => _decrementItem(index),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFFFEE2E2),
                              foregroundColor: AppColors.dangerRed,
                              padding: EdgeInsets.zero,
                              elevation: 0,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(14),
                                side: const BorderSide(color: Color(0xFFFCA5A5), width: 1.5),
                              ),
                            ),
                            child: const Text(
                              '−',
                              style: TextStyle(fontSize: 32, fontWeight: FontWeight.w900),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),

                        // SỐ LƯỢNG
                        Container(
                          constraints: const BoxConstraints(minWidth: 32),
                          child: Text(
                            '${item.quantity}',
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                              fontSize: 24,
                              fontWeight: FontWeight.w900,
                              color: AppColors.textMain,
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),

                        // NÚT CỘNG TO
                        SizedBox(
                          width: 56,
                          height: 56,
                          child: ElevatedButton(
                            onPressed: _isSubmitting ? null : () => _incrementItem(index),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFFDCFCE7),
                              foregroundColor: AppColors.primaryGreen,
                              padding: EdgeInsets.zero,
                              elevation: 0,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(14),
                                side: const BorderSide(color: Color(0xFF86EFAC), width: 1.5),
                              ),
                            ),
                            child: const Text(
                              '+',
                              style: TextStyle(fontSize: 28, fontWeight: FontWeight.w900),
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),

            // PHẦN ĐÁY: DÒNG TỔNG TIỀN KHỔNG LỒ & NÚT HOÀN TẤT
            Container(
              padding: const EdgeInsets.fromLTRB(18, 16, 18, 20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.08),
                    blurRadius: 10,
                    offset: const Offset(0, -4),
                  ),
                ],
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'TỔNG CỘNG:',
                        style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.w900,
                          color: AppColors.textMain,
                        ),
                      ),
                      Text(
                        MoneyFormat.formatVND(_totalAmount),
                        style: const TextStyle(
                          fontSize: 32,
                          fontWeight: FontWeight.w900,
                          color: AppColors.primaryGreen,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  SizedBox(
                    height: 64,
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _isSubmitting ? null : _handleCompleteOrder,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primaryGreen,
                        disabledBackgroundColor: Colors.grey.shade400,
                        foregroundColor: Colors.white,
                        elevation: 4,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(18),
                        ),
                      ),
                      child: _isSubmitting
                          ? const Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                SizedBox(
                                  width: 28,
                                  height: 28,
                                  child: CircularProgressIndicator(color: Colors.white, strokeWidth: 3),
                                ),
                                SizedBox(width: 14),
                                Text(
                                  'ĐANG LƯU ĐƠN...',
                                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900),
                                ),
                              ],
                            )
                          : const Text(
                              '✔  ${AppStrings.btnCompleteOrder}',
                              style: TextStyle(
                                fontSize: 22,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 0.5,
                              ),
                            ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
