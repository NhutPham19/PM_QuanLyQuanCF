import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../core/utils/vn_date.dart';
import '../../data/models/expense_model.dart';
import '../../data/models/order_model.dart';
import '../../data/repositories/expense_repository.dart';
import '../../data/repositories/order_repository.dart';

class ExportCsvScreen extends StatefulWidget {
  const ExportCsvScreen({super.key});

  @override
  State<ExportCsvScreen> createState() => _ExportCsvScreenState();
}

class _ExportCsvScreenState extends State<ExportCsvScreen> {
  final _orderRepo = OrderRepository();
  final _expenseRepo = ExpenseRepository();
  late String _selectedMonth;

  @override
  void initState() {
    super.initState();
    _selectedMonth = VnDateUtils.formatMonthString(DateTime.now().toUtc());
  }

  String _generateOrdersCsv(List<OrderModel> orders) {
    final buffer = StringBuffer();
    buffer.writeln('Mã Đơn,Ngày Bán,Loại Đơn,Tổng Tiền (VND),Trạng Thái,Chi Tiết Món');
    for (final o in orders) {
      final itemsStr = o.items.map((i) => '${i.quantity}x ${i.name}').join('; ');
      final typeStr = o.orderType == OrderType.dineIn ? 'Tại quán' : 'Mang về';
      final statusStr = o.status == OrderStatus.active ? 'Thành công' : 'Đã hủy';
      buffer.writeln('"${o.id}","${o.dateString}","$typeStr",${o.totalAmount},"$statusStr","$itemsStr"');
    }
    return buffer.toString();
  }

  String _generateExpensesCsv(List<ExpenseModel> expenses) {
    final buffer = StringBuffer();
    buffer.writeln('Mã Phiếu Chi,Ngày Chi,Loại Chi,Khoản Mục,Số Tiền (VND),Ghi Chú');
    for (final e in expenses) {
      final typeStr = e.expenseType == ExpenseType.restock ? 'Nhập hàng' : 'Đồ dùng quán';
      buffer.writeln('"${e.id}","${e.dateString}","$typeStr","${e.categoryName}",${e.amount},"${e.note ?? ''}"');
    }
    return buffer.toString();
  }

  void _copyToClipboard(String content, String title) {
    Clipboard.setData(ClipboardData(text: content));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('✔ Đã sao chép nội dung $title vào bộ nhớ tạm!')),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Xuất Dữ Liệu CSV'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'XUẤT BÁO CÁO THÁNG $_selectedMonth',
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            const Text(
              'Sao chép hoặc tải dữ liệu dạng file CSV để mở bằng Excel / Google Sheets và lưu trữ ngoại tuyến.',
              style: TextStyle(color: Colors.black54),
            ),
            const SizedBox(height: 20),

            // NÚT XUẤT ĐƠN HÀNG
            StreamBuilder<List<OrderModel>>(
              stream: _orderRepo.getOrdersByMonthStream(_selectedMonth),
              builder: (context, snapshot) {
                final orders = snapshot.data ?? [];
                return Card(
                  child: ListTile(
                    leading: const Icon(Icons.receipt_long, color: Colors.green, size: 36),
                    title: const Text('Danh Sách Đơn Hàng', style: TextStyle(fontWeight: FontWeight.bold)),
                    subtitle: Text('${orders.length} đơn hàng trong tháng'),
                    trailing: ElevatedButton.icon(
                      onPressed: orders.isEmpty
                          ? null
                          : () {
                              final csv = _generateOrdersCsv(orders);
                              _copyToClipboard(csv, 'Đơn Hàng');
                            },
                      icon: const Icon(Icons.copy, size: 16),
                      label: const Text('Copy CSV'),
                    ),
                  ),
                );
              },
            ),
            const SizedBox(height: 12),

            // NÚT XUẤT PHIẾU CHI
            StreamBuilder<List<ExpenseModel>>(
              stream: _expenseRepo.getExpensesByMonthStream(_selectedMonth),
              builder: (context, snapshot) {
                final expenses = snapshot.data ?? [];
                return Card(
                  child: ListTile(
                    leading: const Icon(Icons.shopping_cart, color: Colors.orange, size: 36),
                    title: const Text('Danh Sách Phiếu Chi', style: TextStyle(fontWeight: FontWeight.bold)),
                    subtitle: Text('${expenses.length} phiếu chi trong tháng'),
                    trailing: ElevatedButton.icon(
                      onPressed: expenses.isEmpty
                          ? null
                          : () {
                              final csv = _generateExpensesCsv(expenses);
                              _copyToClipboard(csv, 'Phiếu Chi');
                            },
                      icon: const Icon(Icons.copy, size: 16),
                      label: const Text('Copy CSV'),
                    ),
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}
