import 'package:test/test.dart';
import '../../lib/core/utils/vn_date.dart';

void main() {
  group('VnDateUtils - Xử lý ngày giờ chuẩn UTC+7', () {
    test('Chuyển đổi đúng ngày theo giờ Việt Nam tại ranh giới 23h30 và 00h30', () {
      // 16h30 UTC = 23h30 VN (ngày 2026-10-25)
      final time2330Vn = DateTime.utc(2026, 10, 25, 16, 30);
      expect(VnDateUtils.formatDateString(time2330Vn), equals('2026-10-25'));
      expect(VnDateUtils.formatMonthString(time2330Vn), equals('2026-10'));

      // 17h30 UTC = 00h30 VN (đã sang ngày 2026-10-26)
      final time0030Vn = DateTime.utc(2026, 10, 25, 17, 30);
      expect(VnDateUtils.formatDateString(time0030Vn), equals('2026-10-26'));
      expect(VnDateUtils.formatMonthString(time0030Vn), equals('2026-10'));
    });

    test('Chuyển giao năm mới (31/12 sang 01/01)', () {
      // 16h59 UTC ngày 31/12 = 23h59 VN ngày 31/12/2026
      final newYearEve = DateTime.utc(2026, 12, 31, 16, 59);
      expect(VnDateUtils.formatDateString(newYearEve), equals('2026-12-31'));
      expect(VnDateUtils.formatMonthString(newYearEve), equals('2026-12'));

      // 17h01 UTC ngày 31/12 = 00h01 VN ngày 01/01/2027
      final newYearDay = DateTime.utc(2026, 12, 31, 17, 1);
      expect(VnDateUtils.formatDateString(newYearDay), equals('2027-01-01'));
      expect(VnDateUtils.formatMonthString(newYearDay), equals('2027-01'));
    });

    test('Kiểm tra quyền hủy đơn trong 10 phút', () {
      final orderTime = DateTime(2026, 10, 25, 10, 0);

      // Sau 5 phút -> Hủy được
      final checkAt5Min = DateTime(2026, 10, 25, 10, 5);
      expect(VnDateUtils.isWithinMinutes(orderTime, durationMinutes: 10, currentTime: checkAt5Min), isTrue);

      // Sau 9 phút 59 giây -> Hủy được
      final checkAt9Min = DateTime(2026, 10, 25, 10, 9, 59);
      expect(VnDateUtils.isWithinMinutes(orderTime, durationMinutes: 10, currentTime: checkAt9Min), isTrue);

      // Sau 11 phút -> Hết quyền hủy
      final checkAt11Min = DateTime(2026, 10, 25, 10, 11);
      expect(VnDateUtils.isWithinMinutes(orderTime, durationMinutes: 10, currentTime: checkAt11Min), isFalse);
    });
  });
}
