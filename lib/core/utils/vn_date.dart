/// Tiện ích xử lý ngày giờ chuẩn Việt Nam (UTC+7).
/// Đảm bảo không bị phụ thuộc vào việc người dùng chỉnh sai múi giờ hoặc giờ trên máy Android.
class VnDateUtils {
  /// Lấy thời điểm hiện tại quy về múi giờ Việt Nam (UTC+7) độc lập.
  static DateTime nowVn([DateTime? referenceTime]) {
    final utc = (referenceTime ?? DateTime.now()).toUtc();
    return utc.add(const Duration(hours: 7));
  }

  /// Trả về chuỗi ngày dạng YYYY-MM-DD theo giờ VN.
  /// Ví dụ: "2026-10-25"
  static String formatDateString([DateTime? dateTime]) {
    final vnTime = nowVn(dateTime);
    final year = vnTime.year.toString().padLeft(4, '0');
    final month = vnTime.month.toString().padLeft(2, '0');
    final day = vnTime.day.toString().padLeft(2, '0');
    return '$year-$month-$day';
  }

  /// Trả về chuỗi tháng dạng YYYY-MM theo giờ VN.
  /// Ví dụ: "2026-10"
  static String formatMonthString([DateTime? dateTime]) {
    final vnTime = nowVn(dateTime);
    final year = vnTime.year.toString().padLeft(4, '0');
    final month = vnTime.month.toString().padLeft(2, '0');
    return '$year-$month';
  }

  /// Kiểm tra xem thời điểm [createdAt] có nằm trong vòng [durationMinutes]
  /// tính tới thời điểm [currentTime] hay không (dùng để kiểm tra quyền hủy đơn trong 10 phút).
  static bool isWithinMinutes(
    DateTime createdAt, {
    int durationMinutes = 10,
    DateTime? currentTime,
  }) {
    final now = currentTime ?? DateTime.now();
    final difference = now.difference(createdAt);
    return !difference.isNegative && difference.inMinutes < durationMinutes;
  }
}
