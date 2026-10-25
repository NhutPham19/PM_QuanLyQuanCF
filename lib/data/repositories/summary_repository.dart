import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/daily_summary_model.dart';

class SummaryRepository {
  final FirebaseFirestore _firestore;

  SummaryRepository({FirebaseFirestore? firestore})
      : _firestore = firestore ?? FirebaseFirestore.instance;

  /// Stream tổng kết ngày - Đọc đúng 1 document duy nhất (siêu nhẹ, tiết kiệm hạn ngạch Firestore)
  Stream<DailySummaryModel> getDailySummaryStream(String dateString) {
    return _firestore
        .collection('daily_summaries')
        .doc(dateString)
        .snapshots()
        .map((snapshot) {
      if (!snapshot.exists || snapshot.data() == null) {
        return DailySummaryModel(
          dateString: dateString,
          totalRevenue: 0,
          totalExpense: 0,
          totalOrders: 0,
          monthString: dateString.length >= 7 ? dateString.substring(0, 7) : '',
        );
      }
      return DailySummaryModel.fromMap(snapshot.data()!, snapshot.id);
    });
  }

  /// Lấy danh sách tổng kết ngày trong 1 tháng (dành cho Admin báo cáo)
  Stream<List<DailySummaryModel>> getMonthlySummariesStream(String monthString) {
    return _firestore
        .collection('daily_summaries')
        .where('monthString', isEqualTo: monthString)
        .snapshots()
        .map((snapshot) {
      final list = snapshot.docs
          .map((doc) => DailySummaryModel.fromMap(doc.data(), doc.id))
          .toList();
      list.sort((a, b) => b.dateString.compareTo(a.dateString));
      return list;
    });
  }

  /// Tính lại tổng kết ngày [P1] - Quét toàn bộ orders và expenses ACTIVE để đối soát lại
  Future<DailySummaryModel> recalculateDay(String dateString) async {
    // 1. Quét orders
    final ordersSnapshot = await _firestore
        .collection('orders')
        .where('dateString', isEqualTo: dateString)
        .where('status', isEqualTo: 'ACTIVE')
        .get();

    int totalRevenue = 0;
    int totalOrders = ordersSnapshot.docs.length;
    for (final doc in ordersSnapshot.docs) {
      final amount = (doc.data()['totalAmount'] as num?)?.toInt() ?? 0;
      totalRevenue += amount;
    }

    // 2. Quét expenses
    final expensesSnapshot = await _firestore
        .collection('expenses')
        .where('dateString', isEqualTo: dateString)
        .where('status', isEqualTo: 'ACTIVE')
        .get();

    int totalExpense = 0;
    for (final doc in expensesSnapshot.docs) {
      final amount = (doc.data()['amount'] as num?)?.toInt() ?? 0;
      totalExpense += amount;
    }

    final monthString = dateString.length >= 7 ? dateString.substring(0, 7) : '';

    final updatedSummary = DailySummaryModel(
      dateString: dateString,
      totalRevenue: totalRevenue,
      totalExpense: totalExpense,
      totalOrders: totalOrders,
      monthString: monthString,
      lastUpdated: DateTime.now(),
    );

    await _firestore.collection('daily_summaries').doc(dateString).set({
      'totalRevenue': totalRevenue,
      'totalExpense': totalExpense,
      'totalOrders': totalOrders,
      'dateString': dateString,
      'monthString': monthString,
      'lastUpdated': FieldValue.serverTimestamp(),
    }, SetOptions(merge: true));

    return updatedSummary;
  }
}
