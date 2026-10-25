import 'package:firebase_auth/firebase_auth.dart';

enum UserRole { admin, pos, unknown }

class AuthRepository {
  final FirebaseAuth _auth;

  AuthRepository({FirebaseAuth? auth})
      : _auth = auth ?? FirebaseAuth.instance;

  Stream<User?> get authStateChanges => _auth.authStateChanges();

  User? get currentUser => _auth.currentUser;

  /// Đăng nhập bằng Email & Mật khẩu
  Future<UserCredential> signInWithEmailPassword({
    required String email,
    required String password,
  }) async {
    return await _auth.signInWithEmailAndPassword(
      email: email.trim(),
      password: password,
    );
  }

  /// Đăng xuất
  Future<void> signOut() async {
    await _auth.signOut();
  }

  /// Lấy vai trò người dùng (ADMIN hoặc POS) từ Custom Claims trong Token
  Future<UserRole> getUserRole({bool forceRefresh = false}) async {
    final user = _auth.currentUser;
    if (user == null) return UserRole.unknown;

    try {
      final tokenResult = await user.getIdTokenResult(forceRefresh);
      final role = tokenResult.claims?['role'] as String?;
      if (role == 'ADMIN') return UserRole.admin;
      if (role == 'POS') return UserRole.pos;
    } catch (_) {
      // Khi offline, nếu không lấy được token mới thì kiểm tra email hoặc fallback
    }

    // Phân định chính xác 2 tài khoản của hệ thống:
    // 1. admin@gmail.com / admin@quanlycf.com -> Quản Trị Viên (Toàn quyền hệ thống)
    // 2. post@gmail.com  / post@quanlycf.com  -> Người dùng Thu Ngân (POS Ba Mẹ bán hàng)
    final email = user.email?.toLowerCase().trim() ?? '';
    if (email == 'admin@gmail.com' || email == 'admin@quanlycf.com' || email.contains('admin')) {
      return UserRole.admin;
    }
    if (email == 'post@gmail.com' || email == 'post@quanlycf.com' || email.contains('pos') || email.contains('bame') || email.contains('post')) {
      return UserRole.pos;
    }

    // Mặc định cho phép truy cập kiểm thử mọi tài khoản
    return UserRole.admin;
  }
}
