import 'package:flutter/material.dart';
import '../../core/utils/money_format.dart';
import '../../core/utils/vn_date.dart';
import '../../data/models/daily_summary_model.dart';
import '../../data/repositories/product_repository.dart';
import '../../data/repositories/summary_repository.dart';
import 'category_manager.dart';
import 'export_csv_screen.dart';
import 'orders_history.dart';
import 'product_manager.dart';
import 'reports_screen.dart';

class AdminDashboard extends StatefulWidget {
  const AdminDashboard({super.key});

  @override
  State<AdminDashboard> createState() => _AdminDashboardState();
}

class _AdminDashboardState extends State<AdminDashboard> {
  final _summaryRepo = SummaryRepository();
  final _productRepo = ProductRepository();

  @override
  void initState() {
    super.initState();
    _productRepo.seedInitialDataIfEmpty();
  }

  @override
  Widget build(BuildContext context) {
    final todayString = VnDateUtils.formatDateString(DateTime.now().toUtc());

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('Quản Trị Viên (Admin)'),
        backgroundColor: const Color(0xFF4338CA),
        foregroundColor: Colors.white,
        elevation: 2,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // THẺ TỔNG QUAN HÔM NAY
              StreamBuilder<DailySummaryModel>(
                stream: _summaryRepo.getDailySummaryStream(todayString),
                builder: (context, snapshot) {
                  final s = snapshot.data ??
                      DailySummaryModel(
                        dateString: todayString,
                        totalRevenue: 0,
                        totalExpense: 0,
                        totalOrders: 0,
                        monthString: '',
                      );

                  return Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF4338CA), Color(0xFF3730A3)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFF4338CA).withOpacity(0.3),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'HÔM NAY TẠI QUÁN',
                              style: TextStyle(
                                color: Colors.white70,
                                fontWeight: FontWeight.bold,
                                fontSize: 13,
                                letterSpacing: 0.5,
                              ),
                            ),
                            Text(
                              todayString,
                              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                        const SizedBox(height: 14),
                        Text(
                          MoneyFormat.formatVND(s.totalRevenue),
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 32,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '${s.totalOrders} đơn hàng đã bán • Chi: -${MoneyFormat.formatVND(s.totalExpense)}',
                          style: const TextStyle(color: Colors.white70, fontSize: 14),
                        ),
                        const SizedBox(height: 12),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.15),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Text(
                            'Còn lại: ${MoneyFormat.formatVND(s.netCash)}',
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 15,
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
              const SizedBox(height: 24),

              // CÁC CHỨC NĂNG QUẢN TRỊ
              const Text(
                'DANH MỤC QUẢN LÝ',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF475569),
                  letterSpacing: 0.5,
                ),
              ),
              const SizedBox(height: 12),

              _buildNavCard(
                icon: Icons.coffee,
                title: 'Món Ăn & Đồ Uống',
                subtitle: 'Quản lý giá tại quán, mang về, tồn kho và ảnh Cloudinary',
                color: const Color(0xFF0284C7),
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const ProductManagerScreen()),
                  );
                },
              ),
              const SizedBox(height: 12),

              _buildNavCard(
                icon: Icons.category,
                title: 'Danh Mục & Loại Chi Phí',
                subtitle: 'Quản lý nhóm đồ uống và các khoản chi đồ dùng quán',
                color: const Color(0xFF0D9488),
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const CategoryManagerScreen()),
                  );
                },
              ),
              const SizedBox(height: 12),

              _buildNavCard(
                icon: Icons.receipt_long,
                title: 'Lịch Sử Đơn Hàng',
                subtitle: 'Xem toàn bộ đơn đã bán, hủy hoặc khôi phục đơn',
                color: const Color(0xFFEA580C),
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const OrdersHistoryScreen()),
                  );
                },
              ),
              const SizedBox(height: 12),

              _buildNavCard(
                icon: Icons.bar_chart,
                title: 'Báo Cáo Doanh Thu & Lợi Nhuận',
                subtitle: 'Báo cáo theo tháng, thống kê và tính lại số liệu',
                color: const Color(0xFF16A34A),
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const ReportsScreen()),
                  );
                },
              ),
              const SizedBox(height: 12),

              _buildNavCard(
                icon: Icons.file_download_outlined,
                title: 'Xuất Dữ Liệu CSV',
                subtitle: 'Sao chép và tải file CSV để mở bằng Excel',
                color: const Color(0xFF64748B),
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const ExportCsvScreen()),
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildNavCard({
    required IconData icon,
    required String title,
    required String subtitle,
    required Color color,
    required VoidCallback onTap,
  }) {
    return Card(
      elevation: 1,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: Color(0xFFE2E8F0)),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                width: 50,
                height: 50,
                decoration: BoxDecoration(
                  color: color.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: color, size: 28),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF1E293B),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      subtitle,
                      style: const TextStyle(
                        fontSize: 13,
                        color: Color(0xFF64748B),
                      ),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right, color: Color(0xFF94A3B8)),
            ],
          ),
        ),
      ),
    );
  }
}
