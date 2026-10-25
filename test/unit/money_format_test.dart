import 'package:test/test.dart';
import '../../lib/core/utils/money_format.dart';

void main() {
  group('MoneyFormat - Định dạng tiền tệ VND', () {
    test('Định dạng các số tiền phổ biến ở quán cà phê', () {
      expect(MoneyFormat.formatVND(12000), equals('12.000 đ'));
      expect(MoneyFormat.formatVND(15000), equals('15.000 đ'));
      expect(MoneyFormat.formatVND(20000), equals('20.000 đ'));
      expect(MoneyFormat.formatVND(180000), equals('180.000 đ'));
    });

    test('Định dạng số 0 đúng chuẩn', () {
      expect(MoneyFormat.formatVND(0), equals('0 đ'));
    });

    test('Định dạng số tiền hàng triệu (Nhập hàng số lượng lớn)', () {
      expect(MoneyFormat.formatVND(1000000), equals('1.000.000 đ'));
      expect(MoneyFormat.formatVND(12500000), equals('12.500.000 đ'));
    });

    test('Định dạng số tiền âm (Trường hợp trừ tiền/hoàn tiền)', () {
      expect(MoneyFormat.formatVND(-15000), equals('-15.000 đ'));
      expect(MoneyFormat.formatVND(-250000), equals('-250.000 đ'));
    });

    test('Tùy chọn không kèm hậu tố đ', () {
      expect(MoneyFormat.formatVND(15000, includeSuffix: false), equals('15.000'));
      expect(MoneyFormat.formatVND(1000000, includeSuffix: false), equals('1.000.000'));
    });

    test('Parse ngược chuỗi tiền tệ thành số nguyên int', () {
      expect(MoneyFormat.parseVND('15.000 đ'), equals(15000));
      expect(MoneyFormat.parseVND('1.500.000 đ'), equals(1500000));
      expect(MoneyFormat.parseVND('-20.000 đ'), equals(-20000));
      expect(MoneyFormat.parseVND(''), equals(0));
      expect(MoneyFormat.parseVND('abc'), equals(0));
    });
  });
}
