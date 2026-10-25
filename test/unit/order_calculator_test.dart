import 'package:test/test.dart';
import '../../lib/core/utils/order_calculator.dart';

void main() {
  group('OrderCalculator - Tính toán giá bán và đơn hàng', () {
    test('Lựa chọn giá theo chế độ Tại quán vs Mang về', () {
      const priceDineIn = 15000;
      const priceTakeAway = 17000;

      // Chế độ tại quán
      expect(
        OrderCalculator.getPriceForMode(
          priceDineIn: priceDineIn,
          priceTakeAway: priceTakeAway,
          isDineIn: true,
        ),
        equals(15000),
      );

      // Chế độ mang về
      expect(
        OrderCalculator.getPriceForMode(
          priceDineIn: priceDineIn,
          priceTakeAway: priceTakeAway,
          isDineIn: false,
        ),
        equals(17000),
      );
    });

    test('Tính thành tiền từng món', () {
      expect(OrderCalculator.calculateSubtotal(12000, 2), equals(24000));
      expect(OrderCalculator.calculateSubtotal(15000, 1), equals(15000));
      expect(OrderCalculator.calculateSubtotal(15000, 0), equals(0));
      expect(OrderCalculator.calculateSubtotal(15000, -2), equals(0));
    });

    test('Tính tổng đơn hàng từ danh sách thành tiền', () {
      final subtotals = [24000, 15000, 30000];
      expect(OrderCalculator.calculateOrderTotal(subtotals), equals(69000));

      final emptyOrder = <int>[];
      expect(OrderCalculator.calculateOrderTotal(emptyOrder), equals(0));
    });

    test('Tính dòng tiền còn lại (Bán - Chi) trong ngày', () {
      expect(
        OrderCalculator.calculateNetCash(totalRevenue: 650000, totalExpense: 200000),
        equals(450000),
      );
      // Ngày mưa vắng khách, chi tiền mua nguyên liệu nhiều hơn tiền bán
      expect(
        OrderCalculator.calculateNetCash(totalRevenue: 100000, totalExpense: 350000),
        equals(-250000),
      );
    });
  });
}
