import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../core/utils/money_format.dart';
import '../../core/utils/vn_date.dart';
import '../../data/models/order_model.dart';
import '../../data/repositories/order_repository.dart';

class OrdersHistoryScreen extends StatefulWidget {
  const OrdersHistoryScreen({super.key});

  @override
  State<OrdersHistoryScreen> createState() => _OrdersHistoryScreenState();
}

class _OrdersHistoryScreenState extends State<OrdersHistoryScreen> {
  final _orderRepo = OrderRepository();
  late String _selectedDate;

  @override
  void initState() {
    super.initState();
    _selectedDate = VnDateUtils.formatDateString(DateTime.now().toUtc());
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime(2024),
      lastDate: DateTime(2030),
    );
    if (picked != null) {
      setState(() {
        _selectedDate = VnDateUtils.formatDateString(picked.toUtc());
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Lịch Sử Đơn Hàng'),
        actions: [
          IconButton(
            icon: const Icon(Icons.calendar_month),
            onPressed: _pickDate,
          ),
        ],
      ),
      body: Column(
        children: [
          // THANH CHỌN NGÀY
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            color: const Color(0xFFF1F5F9),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Đang xem ngày: $_selectedDate',
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                ),
                TextButton(
                  onPressed: _pickDate,
                  child: const Text('ĐỔI NGÀY'),
                ),
              ],
            ),
          ),

          // DANH SÁCH ĐƠN HÀNG
          Expanded(
            child: StreamBuilder<List<OrderModel>>(
              stream: _orderRepo.getOrdersByDateStream(_selectedDate),
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting && !snapshot.hasData) {
                  return const Center(child: CircularProgressIndicator());
                }

                final orders = snapshot.data ?? [];
                if (orders.isEmpty) {
                  return const Center(
                    child: Text('Không có đơn hàng nào trong ngày này.'),
                  );
                }

                return ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: orders.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 12),
                  itemBuilder: (context, index) {
                    final order = orders[index];
                    final isVoided = order.status == OrderStatus.voided;

                    return Card(
                      color: isVoided ? const Color(0xFFF8FAFC) : Colors.white,
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Row(
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: order.orderType == OrderType.dineIn
                                            ? AppColors.dineInBlue.withOpacity(0.12)
                                            : AppColors.takeawayOrange.withOpacity(0.12),
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: Text(
                                        order.orderType == OrderType.dineIn ? '🏠 Tại quán' : '🛵 Mang về',
                                        style: TextStyle(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 13,
                                          color: order.orderType == OrderType.dineIn
                                              ? AppColors.dineInBlue
                                              : AppColors.takeawayOrange,
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    if (isVoided)
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFFFEE2E2),
                                          borderRadius: BorderRadius.circular(8),
                                        ),
                                        child: const Text(
                                          '❌ ĐÃ HỦY',
                                          style: TextStyle(
                                            color: AppColors.dangerRed,
                                            fontWeight: FontWeight.bold,
                                            fontSize: 13,
                                          ),
                                        ),
                                      ),
                                  ],
                                ),
                                Text(
                                  MoneyFormat.formatVND(order.totalAmount),
                                  style: TextStyle(
                                    fontSize: 20,
                                    fontWeight: FontWeight.w900,
                                    decoration: isVoided ? TextDecoration.lineThrough : null,
                                    color: isVoided ? Colors.grey : AppColors.primaryGreen,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 10),

                            // Danh sách chi tiết món
                            ...order.items.map((i) => Padding(
                                  padding: const EdgeInsets.symmetric(vertical: 2),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text('${i.quantity}x ${i.name}', style: const TextStyle(fontSize: 15)),
                                      Text(MoneyFormat.formatVND(i.subtotal), style: const TextStyle(fontSize: 14, color: Colors.black87)),
                                    ],
                                  ),
                                )),
                            const Divider(height: 18),

                            // Nút Thao tác: Hủy hoặc Khôi phục
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  'Mã: ${order.id.substring(0, order.id.length > 8 ? 8 : order.id.length)}',
                                  style: const TextStyle(fontSize: 12, color: Colors.grey),
                                ),
                                if (!isVoided)
                                  TextButton.icon(
                                    onPressed: () => _confirmVoid(order),
                                    icon: const Icon(Icons.cancel, color: AppColors.dangerRed, size: 18),
                                    label: const Text('Hủy đơn', style: TextStyle(color: AppColors.dangerRed)),
                                  )
                                else
                                  TextButton.icon(
                                    onPressed: () => _orderRepo.restoreOrder(order: order),
                                    icon: const Icon(Icons.restore, color: AppColors.dineInBlue, size: 18),
                                    label: const Text('Khôi phục đơn', style: TextStyle(color: AppColors.dineInBlue)),
                                  ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  void _confirmVoid(OrderModel order) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Xác nhận hủy đơn hàng?'),
        content: const Text('Hệ thống sẽ hoàn lại số lượng tồn kho và giảm doanh thu tương ứng.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('HỦY')),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              _orderRepo.voidOrder(order: order, voidedBy: 'ADMIN');
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.dangerRed, foregroundColor: Colors.white),
            child: const Text('XÁC NHẬN HỦY'),
          ),
        ],
      ),
    );
  }
}
