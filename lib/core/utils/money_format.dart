/// Tiện ích định dạng tiền tệ VND chuẩn cho người lớn tuổi.
/// Quy tắc:
/// - Luôn có dấu chấm ngăn cách hàng nghìn (ví dụ: 15.000).
/// - Luôn có hậu tố "đ" (ví dụ: 15.000 đ).
/// - Tuyệt đối không dùng "15k" hay "15000".
/// - Xử lý đúng số 0 (0 đ) và số âm (-15.000 đ).
class MoneyFormat {
  /// Định dạng số nguyên thành chuỗi tiền tệ VND có dấu chấm ngăn cách.
  /// Ví dụ:
  /// - `15000` -> `"15.000 đ"`
  /// - `0` -> `"0 đ"`
  /// - `-25000` -> `"-25.000 đ"`
  /// - `1000000` -> `"1.000.000 đ"`
  static String formatVND(int amount, {bool includeSuffix = true}) {
    final isNegative = amount < 0;
    final absoluteString = amount.abs().toString();

    final buffer = StringBuffer();
    final length = absoluteString.length;

    for (int i = 0; i < length; i++) {
      if (i > 0 && (length - i) % 3 == 0) {
        buffer.write('.');
      }
      buffer.write(absoluteString[i]);
    }

    final formattedNumber = isNegative ? '-${buffer.toString()}' : buffer.toString();
    return includeSuffix ? '$formattedNumber đ' : formattedNumber;
  }

  /// Phân tích chuỗi tiền tệ thành số nguyên.
  /// Bỏ qua các ký tự '.', 'đ', 'VND', dấu cách.
  /// Ví dụ: `"15.000 đ"` -> `15000`, `"-20.000"` -> `-20000`.
  static int parseVND(String input) {
    if (input.trim().isEmpty) return 0;

    final isNegative = input.contains('-');
    final digitsOnly = input.replaceAll(RegExp(r'[^\d]'), '');

    if (digitsOnly.isEmpty) return 0;
    final value = int.parse(digitsOnly);
    return isNegative ? -value : value;
  }
}
