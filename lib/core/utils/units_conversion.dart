/// Tiện ích quy đổi đơn vị hàng hóa: Thùng -> Đơn vị nhỏ nhất (Lon/Ly/Chai).
class UnitsConversion {
  /// Quy đổi số lượng thùng sang đơn vị nhỏ nhất.
  /// Nếu [unitsPerCase] bằng null hoặc <= 0, trả về chính [cases].
  static int convertCasesToUnits(int cases, int? unitsPerCase) {
    if (cases <= 0) return 0;
    if (unitsPerCase == null || unitsPerCase <= 0) {
      return cases;
    }
    return cases * unitsPerCase;
  }

  /// Hiển thị chuỗi quy đổi thân thiện cho người lớn tuổi.
  /// Ví dụ:
  /// - 48 lon, unitsPerCase=24 -> "48 lon (2 thùng)"
  /// - 30 lon, unitsPerCase=24 -> "30 lon (1 thùng 6 lon)"
  /// - 10 ly, unitsPerCase=null -> "10 ly"
  static String formatDetailedQuantity(int totalUnits, String unitName, [int? unitsPerCase]) {
    if (totalUnits <= 0) return '0 $unitName';
    if (unitsPerCase == null || unitsPerCase <= 0) {
      return '$totalUnits $unitName';
    }

    final cases = totalUnits ~/ unitsPerCase;
    final remainder = totalUnits % unitsPerCase;

    if (cases > 0 && remainder == 0) {
      return '$totalUnits $unitName ($cases thùng)';
    } else if (cases > 0 && remainder > 0) {
      return '$totalUnits $unitName ($cases thùng $remainder $unitName)';
    } else {
      return '$totalUnits $unitName';
    }
  }
}
