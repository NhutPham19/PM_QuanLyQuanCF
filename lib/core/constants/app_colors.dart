import 'package:flutter/material.dart';

class AppColors {
  // Màu chính
  static const Color primaryGreen = Color(0xFF2E7D32);      // Nút thanh toán, lưu đơn, đã lưu mạng
  static const Color primaryGreenDark = Color(0xFF1B5E20);  // Trạng thái hover/active
  static const Color takeawayOrange = Color(0xFFE65100);    // Chế độ mang về, ghi chi tiền
  static const Color dineInBlue = Color(0xFF1565C0);        // Chế độ tại quán, sổ tiền
  static const Color dangerRed = Color(0xFFC62828);         // Hủy đơn, xóa món, tổng tiền cần trả

  // Màu nền & chữ đạt chuẩn độ tương phản cao cho người lớn tuổi
  static const Color bgLight = Color(0xFFF4F6F8);
  static const Color cardBg = Color(0xFFFFFFFF);
  static const Color textMain = Color(0xFF1A1A1A);
  static const Color textMuted = Color(0xFF64748B);
  static const Color borderColor = Color(0xFFE2E8F0);

  // Huy hiệu chỉ báo
  static const Color syncSuccessBg = Color(0xFFDCFCE7);
  static const Color syncSuccessText = Color(0xFF15803D);
  static const Color syncPendingBg = Color(0xFFFEF3C7);
  static const Color syncPendingText = Color(0xFFB45309);
}
