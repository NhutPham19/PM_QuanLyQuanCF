import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../core/utils/money_format.dart';
import '../../core/utils/vn_date.dart';
import '../../data/models/daily_summary_model.dart';
import '../../data/repositories/summary_repository.dart';

class DailySummaryScreen extends StatelessWidget {
  const DailySummaryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final todayUtc = DateTime.now().toUtc();
    final todayString = VnDateUtils.formatDateString(todayUtc);
    final summaryRepo = SummaryRepository();

    return Scaffold(
      backgroundColor: AppColors.bgLight,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 1,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, color: AppColors.textMain, size: 28),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'SỔ TIỀN HÔM NAY',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w900,
            color: AppColors.textMain,
          ),
        ),
      ),
      body: SafeArea(
        child: StreamBuilder<DailySummaryModel>(
          stream: summaryRepo.getDailySummaryStream(todayString),
          builder: (context, snapshot) {
            final summary = snapshot.data ??
                DailySummaryModel(
                  dateString: todayString,
                  totalRevenue: 0,
                  totalExpense: 0,
                  totalOrders: 0,
                  monthString: '',
                );

            return Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // HỘP NGÀY
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppColors.borderColor, width: 1.5),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          '📅 Ngày:',
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textMuted),
                        ),
                        Text(
                          todayString,
                          style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: AppColors.textMain),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 18),

                  // BẢNG TỔNG KẾT 3 DÒNG KHỔNG LỒ
                  Container(
                    padding: const EdgeInsets.all(22),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(color: AppColors.borderColor, width: 2),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.06),
                          blurRadius: 12,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Column(
                      children: [
                        // 1. TIỀN BÁN ĐƯỢC
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              '[+] TIỀN BÁN ĐƯỢC:',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w800,
                                color: AppColors.primaryGreen,
                              ),
                            ),
                            Text(
                              '+ ${MoneyFormat.formatVND(summary.totalRevenue)}',
                              style: const TextStyle(
                                fontSize: 24,
                                fontWeight: FontWeight.w900,
                                color: AppColors.primaryGreen,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Align(
                          alignment: Alignment.centerLeft,
                          child: Text(
                            '(${summary.totalOrders} đơn hàng đã bán)',
                            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textMuted),
                          ),
                        ),
                        const Divider(height: 32, thickness: 1.5, color: AppColors.borderColor),

                        // 2. TIỀN ĐÃ CHI
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              '[-] TIỀN ĐÃ CHI:',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w800,
                                color: AppColors.takeawayOrange,
                              ),
                            ),
                            Text(
                              '- ${MoneyFormat.formatVND(summary.totalExpense)}',
                              style: const TextStyle(
                                fontSize: 24,
                                fontWeight: FontWeight.w900,
                                color: AppColors.takeawayOrange,
                              ),
                            ),
                          ],
                        ),
                        const Divider(height: 36, thickness: 2.5, color: AppColors.textMain),

                        // 3. CÒN LẠI (BÁN - CHI)
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Expanded(
                              child: Text(
                                '(=) CÒN LẠI\n(BÁN − CHI):',
                                style: TextStyle(
                                  fontSize: 20,
                                  fontWeight: FontWeight.w900,
                                  color: AppColors.textMain,
                                  height: 1.2,
                                ),
                              ),
                            ),
                            Text(
                              MoneyFormat.formatVND(summary.netCash),
                              style: TextStyle(
                                fontSize: 32,
                                fontWeight: FontWeight.w900,
                                color: summary.netCash >= 0 ? AppColors.dineInBlue : AppColors.dangerRed,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),

                  const Spacer(),

                  // HƯỚNG DẪN DƯỚI ĐÁY
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: const Text(
                      '💡 Lưu ý: Số tiền "Còn lại" tính từ Tiền Bán trừ Tiền Chi trong ngày hôm nay, chưa bao gồm tiền thối vốn đầu ngày.',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 14, color: AppColors.textMuted, height: 1.4),
                    ),
                  ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }
}
