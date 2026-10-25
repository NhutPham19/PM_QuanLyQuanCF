import 'dart:convert';
import 'dart:typed_data';
import 'package:http/http.dart' as http;

class CloudinaryRepository {
  final String cloudName;
  final String uploadPreset;

  CloudinaryRepository({
    this.cloudName = 'v6mzvfbb',
    this.uploadPreset = 'qlcf_unsigned',
  });

  /// Sinh URL ảnh đã được cắt vuông 300x300, nén nhẹ tự động tối ưu cho máy yếu
  String getOptimizedUrl(String publicId, {String extension = 'jpg'}) {
    // Nếu chuỗi truyền vào đã là full URL Cloudinary thì thêm biến đổi w_300,h_300 nếu chưa có
    if (publicId.startsWith('http://') || publicId.startsWith('https://')) {
      if (publicId.contains('/image/upload/') && !publicId.contains('w_300')) {
        return publicId.replaceFirst(
          '/image/upload/',
          '/image/upload/w_300,h_300,c_fill,q_auto,f_auto/',
        );
      }
      return publicId;
    }

    final cleanId = publicId.endsWith('.$extension')
        ? publicId.substring(0, publicId.length - (extension.length + 1))
        : publicId;

    return 'https://res.cloudinary.com/$cloudName/image/upload/w_300,h_300,c_fill,q_auto,f_auto/$cleanId.$extension';
  }

  /// Tải ảnh lên Cloudinary qua Unsigned Upload Preset (Dùng được cho cả Web iOS & Android)
  Future<String?> uploadImageBytes({
    required Uint8List bytes,
    required String filename,
    String folder = 'pm_quanlyquancf',
  }) async {
    try {
      final uri = Uri.parse('https://api.cloudinary.com/v1_1/$cloudName/image/upload');
      final request = http.MultipartRequest('POST', uri)
        ..fields['upload_preset'] = uploadPreset
        ..fields['folder'] = folder
        ..files.add(
          http.MultipartFile.fromBytes(
            'file',
            bytes,
            filename: filename,
          ),
        );

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final data = json.decode(response.body) as Map<String, dynamic>;
        final publicId = data['public_id'] as String?;
        final secureUrl = data['secure_url'] as String?;

        if (publicId != null) {
          final format = (data['format'] as String?) ?? 'jpg';
          return getOptimizedUrl(publicId, extension: format);
        }
        return secureUrl;
      } else {
        // Ghi nhận mã lỗi phản hồi
        return null;
      }
    } catch (_) {
      return null;
    }
  }
}
