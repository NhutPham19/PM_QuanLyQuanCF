import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../data/models/order_model.dart';

class CartStorageService {
  static const String _cartDraftKey = 'pm_cf_cart_draft';
  static const String _cartModeKey = 'pm_cf_cart_mode';

  /// Lưu nháp danh sách món và chế độ bán (Tại quán / Mang về)
  static Future<void> saveDraftCart({
    required List<OrderItemModel> items,
    required bool isDineIn,
  }) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      if (items.isEmpty) {
        await prefs.remove(_cartDraftKey);
        await prefs.remove(_cartModeKey);
      } else {
        final listMap = items.map((e) => e.toMap()).toList();
        await prefs.setString(_cartDraftKey, json.encode(listMap));
        await prefs.setBool(_cartModeKey, isDineIn);
      }
    } catch (_) {}
  }

  /// Nạp lại bản nháp giỏ hàng nếu app bị hệ điều hành tắt ngầm
  static Future<({List<OrderItemModel> items, bool isDineIn})> loadDraftCart() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final draftStr = prefs.getString(_cartDraftKey);
      final isDineIn = prefs.getBool(_cartModeKey) ?? true;

      if (draftStr != null && draftStr.isNotEmpty) {
        final List<dynamic> listRaw = json.decode(draftStr);
        final items = listRaw
            .map((item) => OrderItemModel.fromMap(item as Map<String, dynamic>))
            .toList();
        return (items: items, isDineIn: isDineIn);
      }
    } catch (_) {}

    return (items: <OrderItemModel>[], isDineIn: true);
  }

  /// Xóa bản nháp khi đã hoàn tất đơn hàng
  static Future<void> clearDraft() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_cartDraftKey);
      await prefs.remove(_cartModeKey);
    } catch (_) {}
  }
}
