import 'package:test/test.dart';
import '../../lib/core/utils/units_conversion.dart';

void main() {
  group('UnitsConversion - Quy đổi Thùng sang Lon/Đơn vị nhỏ', () {
    test('Quy đổi khi sản phẩm có unitsPerCase chuẩn (ví dụ: 24 lon/thùng)', () {
      expect(UnitsConversion.convertCasesToUnits(1, 24), equals(24));
      expect(UnitsConversion.convertCasesToUnits(2, 24), equals(48));
      expect(UnitsConversion.convertCasesToUnits(5, 24), equals(120));
    });

    test('Trường hợp số lượng thùng <= 0', () {
      expect(UnitsConversion.convertCasesToUnits(0, 24), equals(0));
      expect(UnitsConversion.convertCasesToUnits(-1, 24), equals(0));
    });

    test('Trường hợp sản phẩm không bán theo thùng (unitsPerCase == null hoặc 0)', () {
      expect(UnitsConversion.convertCasesToUnits(5, null), equals(5));
      expect(UnitsConversion.convertCasesToUnits(10, 0), equals(10));
    });

    test('Định dạng hiển thị chi tiết số lượng', () {
      expect(
        UnitsConversion.formatDetailedQuantity(48, 'lon', 24),
        equals('48 lon (2 thùng)'),
      );
      expect(
        UnitsConversion.formatDetailedQuantity(30, 'lon', 24),
        equals('30 lon (1 thùng 6 lon)'),
      );
      expect(
        UnitsConversion.formatDetailedQuantity(15, 'ly', null),
        equals('15 ly'),
      );
    });
  });
}
