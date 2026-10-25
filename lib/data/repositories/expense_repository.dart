import 'dart:async';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../core/utils/vn_date.dart';
import '../../core/utils/units_conversion.dart';
import '../models/expense_model.dart';

class ExpenseRepository {
  final FirebaseFirestore _firestore;

  ExpenseRepository({FirebaseFirestore? firestore})
      : _firestore = firestore ?? FirebaseFirestore.instance;

  /// Ghi nhận phiếu chi nhập hàng (Thùng hoặc Lon) - Tự động quy đổi và cộng kho
  Future<String> recordRestockExpense({
    required String productId,
    required String productName,
    required bool isCase,
    required int inputQuantity,
    int? unitsPerCase,
    required int amount,
    required String createdBy,
  }) async {
    final expenseRef = _firestore.collection('expenses').doc();
    final expenseId = expenseRef.id;

    final nowUtc = DateTime.now().toUtc();
    final dateString = VnDateUtils.formatDateString(nowUtc);
    final monthString = VnDateUtils.formatMonthString(nowUtc);

    // Tính tổng số lượng lon/đơn vị quy đổi
    final totalUnits = isCase
        ? UnitsConversion.convertCasesToUnits(inputQuantity, unitsPerCase)
        : inputQuantity;

    final note = isCase && unitsPerCase != null
        ? 'Nhập $inputQuantity thùng ($totalUnits lon)'
        : 'Nhập $inputQuantity đơn vị';

    final batch = _firestore.batch();

    // 1. Tạo document phiếu chi
    final expenseData = {
      'expenseType': 'RESTOCK',
      'categoryName': 'Nhập hàng bán',
      'productId': productId,
      'productName': productName,
      'quantity': totalUnits,
      'amount': amount,
      'note': note,
      'status': 'ACTIVE',
      'dateString': dateString,
      'monthString': monthString,
      'createdAt': FieldValue.serverTimestamp(),
      'createdBy': createdBy,
    };
    batch.set(expenseRef, expenseData);

    // 2. Cộng tồn kho sản phẩm tương ứng
    if (productId.isNotEmpty) {
      final productRef = _firestore.collection('products').doc(productId);
      batch.update(productRef, {
        'stockQuantity': FieldValue.increment(totalUnits),
        'updatedAt': FieldValue.serverTimestamp(),
      });
    }

    // 3. Cập nhật tổng chi trong ngày
    final summaryRef = _firestore.collection('daily_summaries').doc(dateString);
    batch.set(
      summaryRef,
      {
        'totalExpense': FieldValue.increment(amount),
        'dateString': dateString,
        'monthString': monthString,
        'lastUpdated': FieldValue.serverTimestamp(),
      },
      SetOptions(merge: true),
    );

    unawaited(
      batch.commit().catchError((error) {
        // Log nội bộ
      }),
    );

    return expenseId;
  }

  /// Ghi nhận phiếu chi đồ dùng quán (Đá lạnh, Ly/Túi, Chanh/Đường...)
  Future<String> recordSuppliesExpense({
    required String categoryName,
    required int amount,
    String? note,
    required String createdBy,
  }) async {
    final expenseRef = _firestore.collection('expenses').doc();
    final expenseId = expenseRef.id;

    final nowUtc = DateTime.now().toUtc();
    final dateString = VnDateUtils.formatDateString(nowUtc);
    final monthString = VnDateUtils.formatMonthString(nowUtc);

    final batch = _firestore.batch();

    final expenseData = {
      'expenseType': 'SUPPLIES',
      'categoryName': categoryName,
      'amount': amount,
      'note': note ?? '',
      'status': 'ACTIVE',
      'dateString': dateString,
      'monthString': monthString,
      'createdAt': FieldValue.serverTimestamp(),
      'createdBy': createdBy,
    };
    batch.set(expenseRef, expenseData);

    final summaryRef = _firestore.collection('daily_summaries').doc(dateString);
    batch.set(
      summaryRef,
      {
        'totalExpense': FieldValue.increment(amount),
        'dateString': dateString,
        'monthString': monthString,
        'lastUpdated': FieldValue.serverTimestamp(),
      },
      SetOptions(merge: true),
    );

    unawaited(
      batch.commit().catchError((error) {
        // Log nội bộ
      }),
    );

    return expenseId;
  }

  /// Stream danh sách phiếu chi theo ngày
  Stream<List<ExpenseModel>> getExpensesByDateStream(String dateString) {
    return _firestore
        .collection('expenses')
        .where('dateString', isEqualTo: dateString)
        .snapshots()
        .map((snapshot) {
      final list = snapshot.docs
          .map((doc) => ExpenseModel.fromMap(doc.data(), doc.id))
          .toList();
      list.sort((a, b) => b.createdAt.compareTo(a.createdAt));
      return list;
    });
  }

  /// Stream danh sách phiếu chi theo tháng (cho báo cáo & xuất CSV)
  Stream<List<ExpenseModel>> getExpensesByMonthStream(String monthString) {
    return _firestore
        .collection('expenses')
        .where('monthString', isEqualTo: monthString)
        .snapshots()
        .map((snapshot) {
      final list = snapshot.docs
          .map((doc) => ExpenseModel.fromMap(doc.data(), doc.id))
          .toList();
      list.sort((a, b) => b.createdAt.compareTo(a.createdAt));
      return list;
    });
  }
}
