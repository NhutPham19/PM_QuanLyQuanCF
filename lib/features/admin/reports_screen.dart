import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../core/utils/money_format.dart';
import '../../core/utils/vn_date.dart';
import '../../data/models/daily_summary_model.dart';
import '../../data/repositories/summary_repository.dart';

class ReportsScreen extends StatefulWidget {
  const ReportsScreen({super.key});

  @override
  State<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends State<ReportsScreen> {
  final _summaryRepo = SummaryRepository();
  late String _selectedMonth;

  @override
  void initState() {
    super.initState();
    _selectedMonth = VnDateUtils.formatMonthString(DateTime.now().toUtc());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Báo Cáo Doanh Thu & Lợi Nhuận'),
      ),
      body: Column(
        children: [
          // BỘ CHỌN THÁNG
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            color: const Color(0xFFF1F5F9),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Tháng báo cáo: $_selectedMonth',
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                ),
                Text(
                  '(Theo giờ VN UTC+7)',
                  style: TextStyle(fontSize: 13, color: Colors.grey.shade600),
                ),
              ],
            ),
          ),

          // NỘI DUNG BÁO CÁO
          Expanded(
            child: StreamBuilder<List<DailySummaryModel>>(
              stream: _summaryRepo.getMonthlySummariesStream(_selectedMonth),
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting && !snapshot.hasData) {
                  return const Center(child: CircularProgressIndicator());
                }

                final summaries = snapshot.data ?? [];

                // Tổng hợp cả tháng
                int totalMonthRevenue = 0;
                int totalMonthExpense = 0;
                int totalMonthOrders = 0;

                for (final s in summaries) {
                  totalMonthRevenue += s.totalRevenue;
                  totalMonthExpense += s.totalExpense;
                  totalMonthOrders += s.totalOrders;
                }

                final totalMonthNet = totalMonthRevenue - totalMonthExpense;

                return ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    // THẺ TỔNG HỢP CẢ THÁNG
                    Card(
                      elevation: 3,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      child: Padding(
                        padding: const EdgeInsets.all(18),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Text(
                              'TỔNG KẾT THÁNG $_selectedMonth',
                              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                            ),
                            const Divider(height: 20),
                            _buildMetricRow('Tổng Doanh Thu (+):', MoneyFormat.formatVND(totalMonthRevenue), AppColors.primaryGreen),
                            const SizedBox(height: 8),
                            _buildMetricRow('Tổng Chi Phí (-):', MoneyFormat.formatVND(totalMonthExpense), AppColors.takeawayOrange),
                            const SizedBox(height: 8),
                            _buildMetricRow('Tổng Số Đơn Bán:', '$totalMonthOrders đơn', AppColors.textMain),
                            const Divider(height: 20),
                            _buildMetricRow(
                              'DÒNG TIỀN CÒN LẠI:',
                              MoneyFormat.formatVND(totalMonthNet),
                              totalMonthNet >= 0 ? AppColors.dineInBlue : AppColors.dangerRed,
                              isBig: true,
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),

                    // CHI TIẾT TỪNG NGÀY
                    const Text(
                      'CHI TIẾT THEO NGÀY',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF334155)),
                    ),
                    const SizedBox(height: 10),

                    if (summaries.isEmpty)
                      const Padding(
                        padding: EdgeInsets.symmetric(vertical: 24),
                        child: Center(child: Text('Chưa có dữ liệu nào trong tháng này.')),
                      )
                    else
                      ...summaries.map((s) => Card(
                            margin: const EdgeInsets.only(bottom: 8),
                            child: ListTile(
                              title: Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    s.dateString,
                                    style: const TextStyle(fontWeight: FontWeight.bold),
                                  ),
                                  Text(
                                    MoneyFormat.formatVND(s.netCash),
                                    style: TextStyle(
                                      fontWeight: FontWeight.w900,
                                      color: s.netCash >= 0 ? AppColors.dineInBlue : AppColors.dangerRed,
                                    ),
                                  ),
                                ],
                              ),
                              subtitle: Text(
                                'Thu: +${MoneyFormat.formatVND(s.totalRevenue)} • Chi: -${MoneyFormat.formatVND(s.totalExpense)} (${s.totalOrders} đơn)',
                              ),
                              trailing: IconButton(
                                icon: const Icon(Icons.sync, color: Colors.blueAccent),
                                tooltip: 'Tính lại ngày này',
                                onPressed: () async {
                                  await _summaryRepo.recalculateDay(s.dateString);
                                  if (context.mounted) {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(content: Text('✔ Đã tính lại ngày ${s.dateString}!')),
                                    );
                                  }
                                },
                              ),
                            ),
                          )),
                  ],
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMetricRow(String title, String value, Color color, {bool isBig = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          title,
          style: TextStyle(
            fontSize: isBig ? 18 : 15,
            fontWeight: isBig ? FontWeight.w900 : FontWeight.w600,
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: isBig ? 24 : 17,
            fontWeight: FontWeight.w900,
            color: color,
          ),
        ),
      ],
    );
  }
}
