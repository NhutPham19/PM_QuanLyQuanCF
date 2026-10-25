/// Tiện ích tính toán hóa đơn bán hàng và tổng kết dòng tiền.
class OrderCalculator {
  /// Lấy đơn giá tương ứng theo chế độ bán (Tại quán vs Mang về).
  static int getPriceForMode({
    required int priceDineIn,
    required int priceTakeAway,
    required bool isDineIn,
  }) {
    return isDineIn ? priceDineIn : priceTakeAway;
  }

  /// Tính thành tiền của một món: Đơn giá * Số lượng.
  static int calculateSubtotal(int unitPrice, int quantity) {
    if (unitPrice < 0 || quantity <= 0) return 0;
    return unitPrice * quantity;
  }

  /// Tính tổng tiền đơn hàng từ danh sách thành tiền của các món.
  static int calculateOrderTotal(List<int> itemSubtotals) {
    return itemSubtotals.fold(0, (sum, subtotal) => sum + (subtotal > 0 ? subtotal : 0));
  }

  /// Tính tiền còn lại (Bán - Chi) trong ngày.
  static int calculateNetCash({
    required int totalRevenue,
    required int totalExpense,
  }) {
    return totalRevenue - totalExpense;
  }
}
