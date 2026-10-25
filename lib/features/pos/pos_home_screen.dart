import 'package:flutter/material.dart';
import 'package:wakelock_plus/wakelock_plus.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_strings.dart';
import '../../core/utils/money_format.dart';
import '../../core/utils/vn_date.dart';
import '../../data/models/order_model.dart';
import '../../data/repositories/order_repository.dart';
import 'widgets/sync_indicator.dart';
import 'sales_screen.dart';
import 'expense_screen.dart';
import 'daily_summary_screen.dart';

class PosHomeScreen extends StatefulWidget {
  const PosHomeScreen({super.key});

  @override
  State<PosHomeScreen> createState() => _PosHomeScreenState();
}

class _PosHomeScreenState extends State<PosHomeScreen> {
  final _orderRepo = OrderRepository();

  @override
  void initState() {
    super.initState();
    // Bật wakelock giữ sáng màn hình điện thoại khi ba mẹ đang bán hàng
    try {
      WakelockPlus.enable();
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final todayString = VnDateUtils.formatDateString(DateTime.now().toUtc());

    return Scaffold(
      backgroundColor: AppColors.bgLight,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 1,
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              AppStrings.appTitle,
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w900,
                color: AppColors.textMain,
              ),
            ),
            Text(
              AppStrings.posSubtitle,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: AppColors.textMuted,
              ),
            ),
          ],
        ),
        actions: const [
          Padding(
            padding: EdgeInsets.only(right: 16),
            child: Center(child: SyncIndicator()),
          ),
        ],
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // 1. NÚT BÁN HÀNG (MÀU XANH LÁ)
              Expanded(
                flex: 3,
                child: _buildBigNavButton(
                  title: '☕ ${AppStrings.btnSales}',
                  subtitle: AppStrings.btnSalesSub,
                  color: AppColors.primaryGreen,
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const SalesScreen()),
                    );
                  },
                ),
              ),
              const SizedBox(height: 14),

              // 2. NÚT CHI TIỀN / MUA HÀNG (MÀU CAM ĐẬM)
              Expanded(
                flex: 2,
                child: _buildBigNavButton(
                  title: '📦 ${AppStrings.btnExpense}',
                  subtitle: AppStrings.btnExpenseSub,
                  color: AppColors.takeawayOrange,
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const ExpenseScreen()),
                    );
                  },
                ),
              ),
              const SizedBox(height: 14),

              // 3. NÚT SỔ TIỀN HÔM NAY (MÀU XANH DƯƠNG)
              Expanded(
                flex: 2,
                child: _buildBigNavButton(
                  title: '💵 ${AppStrings.btnDailySummary}',
                  subtitle: AppStrings.btnDailySummarySub,
                  color: AppColors.dineInBlue,
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const DailySummaryScreen()),
                    );
                  },
                ),
              ),
              const SizedBox(height: 12),

              // 4. NÚT HỦY ĐƠN VỪA BÁN (Chỉ hiện khi có đơn tạo trong 10 phút gần nhất)
              StreamBuilder<OrderModel?>(
                stream: _orderRepo.getLastOrderStream(dateString: todayString),
                builder: (context, snapshot) {
                  final lastOrder = snapshot.data;
                  if (lastOrder == null) return const SizedBox.shrink();

                  final isRecent = VnDateUtils.isWithinMinutes(
                    lastOrder.createdAt,
                    durationMinutes: 10,
                  );

                  if (!isRecent) return const SizedBox.shrink();

                  return SizedBox(
                    height: 58,
                    child: OutlinedButton.icon(
                      onPressed: () => _showVoidConfirmDialog(lastOrder),
                      style: OutlinedButton.styleFrom(
                        backgroundColor: Colors.white,
                        foregroundColor: AppColors.dangerRed,
                        side: const BorderSide(color: AppColors.dangerRed, width: 2.2),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                      ),
                      icon: const Icon(Icons.undo, size: 26, color: AppColors.dangerRed),
                      label: Text(
                        '↩ ${AppStrings.btnUndoOrder} (${MoneyFormat.formatVND(lastOrder.totalAmount)})',
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w900,
                          color: AppColors.dangerRed,
                        ),
                      ),
                    ),
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBigNavButton({
    required String title,
    required String subtitle,
    required Color color,
    required VoidCallback onTap,
  }) {
    return ElevatedButton(
      onPressed: onTap,
      style: ElevatedButton.styleFrom(
        backgroundColor: color,
        foregroundColor: Colors.white,
        elevation: 4,
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            title,
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 26,
              fontWeight: FontWeight.w900,
              letterSpacing: 0.5,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            subtitle,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: Colors.white.withOpacity(0.9),
            ),
          ),
        ],
      ),
    );
  }

  void _showVoidConfirmDialog(OrderModel order) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Row(
          children: [
            Icon(Icons.warning_amber_rounded, color: AppColors.dangerRed, size: 32),
            SizedBox(width: 8),
            Text('HỦY ĐƠN VỪA BÁN?', style: TextStyle(fontWeight: FontWeight.w900)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Số tiền: ${MoneyFormat.formatVND(order.totalAmount)}',
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.dangerRed),
            ),
            const SizedBox(height: 6),
            Text(
              'Gồm ${order.items.length} món: ' +
                  order.items.map((i) => '${i.quantity}x ${i.name}').join(', '),
              style: const TextStyle(fontSize: 16),
            ),
            const SizedBox(height: 12),
            const Text(
              'Hệ thống sẽ hoàn lại số lượng tồn kho và trừ khỏi doanh thu hôm nay.',
              style: TextStyle(fontSize: 14, color: AppColors.textMuted),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('GIỮ LẠI ĐƠN', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              _orderRepo.voidOrder(order: order, voidedBy: 'POS');
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('✔ Đã hủy đơn hàng thành công!', style: TextStyle(fontSize: 16)),
                  backgroundColor: AppColors.dangerRed,
                ),
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.dangerRed,
              foregroundColor: Colors.white,
            ),
            child: const Text('XÁC NHẬN HỦY', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }
}
