import 'dart:async';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../core/utils/vn_date.dart';
import '../models/order_model.dart';

class OrderRepository {
  final FirebaseFirestore _firestore;

  OrderRepository({FirebaseFirestore? firestore})
      : _firestore = firestore ?? FirebaseFirestore.instance;

  /// Tạo và lưu đơn hàng mới - Chuẩn Offline-Safe không dùng await gây treo UI
  Future<String> submitOrder({
    required OrderType orderType,
    required List<OrderItemModel> items,
    required int totalAmount,
    required String createdBy,
  }) async {
    final orderRef = _firestore.collection('orders').doc();
    final orderId = orderRef.id;

    final nowUtc = DateTime.now().toUtc();
    final dateString = VnDateUtils.formatDateString(nowUtc);
    final monthString = VnDateUtils.formatMonthString(nowUtc);

    final batch = _firestore.batch();

    // 1. Tạo document đơn hàng
    final orderData = {
      'orderType': orderType == OrderType.takeAway ? 'TAKE_AWAY' : 'DINE_IN',
      'items': items.map((i) => i.toMap()).toList(),
      'totalAmount': totalAmount,
      'status': 'ACTIVE',
      'voidedAt': null,
      'voidedBy': null,
      'dateString': dateString,
      'monthString': monthString,
      'createdAt': FieldValue.serverTimestamp(),
      'createdBy': createdBy,
    };
    batch.set(orderRef, orderData);

    // 2. Trừ tồn kho từng sản phẩm (chỉ trừ nếu trackStock == true)
    for (final item in items) {
      if (item.trackStock && item.productId.isNotEmpty) {
        final productRef = _firestore.collection('products').doc(item.productId);
        batch.update(productRef, {
          'stockQuantity': FieldValue.increment(-item.quantity),
          'updatedAt': FieldValue.serverTimestamp(),
        });
      }
    }

    // 3. Cập nhật doanh thu tổng kết ngày
    final summaryRef = _firestore.collection('daily_summaries').doc(dateString);
    batch.set(
      summaryRef,
      {
        'totalRevenue': FieldValue.increment(totalAmount),
        'totalOrders': FieldValue.increment(1),
        'dateString': dateString,
        'monthString': monthString,
        'lastUpdated': FieldValue.serverTimestamp(),
      },
      SetOptions(merge: true),
    );

    // 4. Commit ngầm - Không dùng await để UI phản hồi tức thì cả khi mất mạng
    unawaited(
      batch.commit().catchError((error) {
        // Ghi nhận lỗi ngầm nếu có (Firestore cache sẽ tự động retry khi có mạng)
      }),
    );

    return orderId;
  }

  /// Hủy đơn hàng (đảo ngược tồn kho và trừ lại doanh thu tổng kết)
  Future<void> voidOrder({
    required OrderModel order,
    required String voidedBy,
  }) async {
    final batch = _firestore.batch();
    final orderRef = _firestore.collection('orders').doc(order.id);

    // 1. Đánh dấu đơn là VOIDED
    batch.update(orderRef, {
      'status': 'VOIDED',
      'voidedAt': FieldValue.serverTimestamp(),
      'voidedBy': voidedBy,
    });

    // 2. Hoàn lại số lượng tồn kho cho các món có trackStock
    for (final item in order.items) {
      if (item.trackStock && item.productId.isNotEmpty) {
        final productRef = _firestore.collection('products').doc(item.productId);
        batch.update(productRef, {
          'stockQuantity': FieldValue.increment(item.quantity),
          'updatedAt': FieldValue.serverTimestamp(),
        });
      }
    }

    // 3. Giảm trừ doanh thu ngày tương ứng
    final summaryRef = _firestore.collection('daily_summaries').doc(order.dateString);
    batch.set(
      summaryRef,
      {
        'totalRevenue': FieldValue.increment(-order.totalAmount),
        'totalOrders': FieldValue.increment(-1),
        'lastUpdated': FieldValue.serverTimestamp(),
      },
      SetOptions(merge: true),
    );

    unawaited(
      batch.commit().catchError((error) {
        // Log nội bộ
      }),
    );
  }

  /// Khôi phục đơn hàng đã hủy (Dành riêng cho Admin)
  Future<void> restoreOrder({
    required OrderModel order,
  }) async {
    final batch = _firestore.batch();
    final orderRef = _firestore.collection('orders').doc(order.id);

    // 1. Đưa trạng thái về ACTIVE
    batch.update(orderRef, {
      'status': 'ACTIVE',
      'voidedAt': null,
      'voidedBy': null,
    });

    // 2. Trừ lại tồn kho
    for (final item in order.items) {
      if (item.trackStock && item.productId.isNotEmpty) {
        final productRef = _firestore.collection('products').doc(item.productId);
        batch.update(productRef, {
          'stockQuantity': FieldValue.increment(-item.quantity),
          'updatedAt': FieldValue.serverTimestamp(),
        });
      }
    }

    // 3. Cộng lại doanh thu ngày
    final summaryRef = _firestore.collection('daily_summaries').doc(order.dateString);
    batch.set(
      summaryRef,
      {
        'totalRevenue': FieldValue.increment(order.totalAmount),
        'totalOrders': FieldValue.increment(1),
        'lastUpdated': FieldValue.serverTimestamp(),
      },
      SetOptions(merge: true),
    );

    unawaited(batch.commit());
  }

  /// Stream đơn hàng mới nhất hôm nay (dành cho nút "Hủy đơn vừa bán" trên POS)
  Stream<OrderModel?> getLastOrderStream({required String dateString, String? createdBy}) {
    Query query = _firestore
        .collection('orders')
        .where('dateString', isEqualTo: dateString)
        .where('status', isEqualTo: 'ACTIVE');

    if (createdBy != null && createdBy.isNotEmpty) {
      query = query.where('createdBy', isEqualTo: createdBy);
    }

    return query
        .snapshots()
        .map((snapshot) {
      if (snapshot.docs.isEmpty) return null;
      final docs = snapshot.docs;
      // Sort theo thời gian giảm dần
      final orders = docs
          .map((d) => OrderModel.fromMap(d.data() as Map<String, dynamic>, d.id))
          .toList();
      orders.sort((a, b) => b.createdAt.compareTo(a.createdAt));
      return orders.first;
    });
  }

  /// Stream danh sách đơn hàng theo ngày (dành cho Admin & xem lịch sử)
  Stream<List<OrderModel>> getOrdersByDateStream(String dateString) {
    return _firestore
        .collection('orders')
        .where('dateString', isEqualTo: dateString)
        .snapshots()
        .map((snapshot) {
      final list = snapshot.docs
          .map((doc) => OrderModel.fromMap(doc.data(), doc.id))
          .toList();
      list.sort((a, b) => b.createdAt.compareTo(a.createdAt));
      return list;
    });
  }

  /// Stream danh sách đơn hàng theo tháng (cho báo cáo & xuất CSV)
  Stream<List<OrderModel>> getOrdersByMonthStream(String monthString) {
    return _firestore
        .collection('orders')
        .where('monthString', isEqualTo: monthString)
        .snapshots()
        .map((snapshot) {
      final list = snapshot.docs
          .map((doc) => OrderModel.fromMap(doc.data(), doc.id))
          .toList();
      list.sort((a, b) => b.createdAt.compareTo(a.createdAt));
      return list;
    });
  }
}
