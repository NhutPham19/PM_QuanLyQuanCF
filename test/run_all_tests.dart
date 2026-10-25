import '../lib/core/utils/money_format.dart';
import '../lib/core/utils/vn_date.dart';
import '../lib/core/utils/units_conversion.dart';
import '../lib/core/utils/order_calculator.dart';

void main() {
  print('==================================================');
  print('🚀 CHẠY KIỂM THỬ TOÀN BỘ LOGIC LÕI (RUN ALL TESTS)');
  print('==================================================\n');

  int totalTests = 0;
  int passedTests = 0;

  void assertEqual(dynamic actual, dynamic expected, String testName) {
    totalTests++;
    if (actual == expected) {
      passedTests++;
      print('  [PASS] $testName');
    } else {
      print('  ❌ [FAIL] $testName: Mong muốn "$expected" nhưng thực tế là "$actual"');
    }
  }

  // 1. Kiểm thử MoneyFormat
  print('1. Kiểm thử Định dạng tiền tệ (MoneyFormat):');
  assertEqual(MoneyFormat.formatVND(15000), '15.000 đ', 'Định dạng 15000 đ');
  assertEqual(MoneyFormat.formatVND(0), '0 đ', 'Định dạng 0 đ');
  assertEqual(MoneyFormat.formatVND(-25000), '-25.000 đ', 'Định dạng số âm -25.000 đ');
  assertEqual(MoneyFormat.formatVND(1250000), '1.250.000 đ', 'Định dạng hàng triệu');
  assertEqual(MoneyFormat.parseVND('15.000 đ'), 15000, 'Parse ngược 15.000 đ');
  assertEqual(MoneyFormat.parseVND('-50.000 đ'), -50000, 'Parse ngược số âm');

  // 2. Kiểm thử VnDateUtils
  print('\n2. Kiểm thử Ngày giờ VN UTC+7 (VnDateUtils):');
  final time2330Vn = DateTime.utc(2026, 10, 25, 16, 30);
  assertEqual(VnDateUtils.formatDateString(time2330Vn), '2026-10-25', 'Chuyển đổi 23h30 giờ VN');
  final time0030Vn = DateTime.utc(2026, 10, 25, 17, 30);
  assertEqual(VnDateUtils.formatDateString(time0030Vn), '2026-10-26', 'Chuyển đổi 00h30 qua ngày mới');

  final orderTime = DateTime(2026, 10, 25, 10, 0);
  final within5Min = DateTime(2026, 10, 25, 10, 5);
  final after15Min = DateTime(2026, 10, 25, 10, 15);
  assertEqual(VnDateUtils.isWithinMinutes(orderTime, durationMinutes: 10, currentTime: within5Min), true, 'Trong 10 phút hủy được');
  assertEqual(VnDateUtils.isWithinMinutes(orderTime, durationMinutes: 10, currentTime: after15Min), false, 'Quá 10 phút không hủy được');

  // 3. Kiểm thử UnitsConversion
  print('\n3. Kiểm thử Quy đổi đơn vị Thùng -> Lon (UnitsConversion):');
  assertEqual(UnitsConversion.convertCasesToUnits(1, 24), 24, '1 thùng 24 lon = 24');
  assertEqual(UnitsConversion.convertCasesToUnits(3, 24), 72, '3 thùng 24 lon = 72');
  assertEqual(UnitsConversion.convertCasesToUnits(5, null), 5, 'Không có thùng (null) giữ nguyên');
  assertEqual(UnitsConversion.formatDetailedQuantity(48, 'lon', 24), '48 lon (2 thùng)', 'Format 48 lon (2 thùng)');

  // 4. Kiểm thử OrderCalculator
  print('\n4. Kiểm thử Tính toán đơn hàng & dòng tiền (OrderCalculator):');
  assertEqual(OrderCalculator.getPriceForMode(priceDineIn: 15000, priceTakeAway: 17000, isDineIn: true), 15000, 'Giá Tại quán = 15000');
  assertEqual(OrderCalculator.getPriceForMode(priceDineIn: 15000, priceTakeAway: 17000, isDineIn: false), 17000, 'Giá Mang về = 17000');
  assertEqual(OrderCalculator.calculateSubtotal(15000, 3), 45000, 'Thành tiền 15.000 x 3 = 45.000');
  assertEqual(OrderCalculator.calculateOrderTotal([24000, 15000, 30000]), 69000, 'Tổng đơn = 69.000');
  assertEqual(OrderCalculator.calculateNetCash(totalRevenue: 650000, totalExpense: 200000), 450000, 'Còn lại (Bán - Chi) = 450.000');

  print('\n==================================================');
  print('📊 KẾT QUẢ: ĐÃ CHẠY $totalTests BÀI TEST -> VƯỢT QUA $passedTests / $totalTests');
  if (passedTests == totalTests) {
    print('🎉 TẤT CẢ UNIT TESTS ĐỀU VƯỢT QUA HOÀN HẢO!');
  } else {
    print('⚠️ CÓ ${totalTests - passedTests} BÀI TEST BỊ LỖI, CẦN KIỂM TRA LẠI.');
  }
  print('==================================================');
}
