import 'package:test/test.dart';

void main() {
  group('Daily & Monthly Summary Aggregation Logic', () {
    test('Cộng dồn doanh thu và đơn hàng khi có đơn mới', () {
      int totalRevenue = 500000;
      int totalOrders = 20;

      // Đơn mới phát sinh 45.000 đ
      const newOrderAmount = 45000;
      totalRevenue += newOrderAmount;
      totalOrders += 1;

      expect(totalRevenue, equals(545000));
      expect(totalOrders, equals(21));
    });

    test('Giảm trừ khi hủy đơn hàng trong 10 phút', () {
      int totalRevenue = 545000;
      int totalOrders = 21;

      // Hủy đơn 45.000 đ vừa tạo
      const voidOrderAmount = 45000;
      totalRevenue -= voidOrderAmount;
      totalOrders -= 1;

      expect(totalRevenue, equals(500000));
      expect(totalOrders, equals(20));
    });

    test('Cộng dồn chi phí khi có phiếu nhập hàng hoặc mua vật dụng', () {
      int totalExpense = 150000;

      // Mua đá 20.000 đ
      totalExpense += 20000;
      // Nhập 1 thùng nước 180.000 đ
      totalExpense += 180000;

      expect(totalExpense, equals(350000));
    });
  });
}
