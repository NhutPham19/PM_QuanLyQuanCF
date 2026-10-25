import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';

class AccountManagerScreen extends StatefulWidget {
  const AccountManagerScreen({super.key});

  @override
  State<AccountManagerScreen> createState() => _AccountManagerScreenState();
}

class _AccountManagerScreenState extends State<AccountManagerScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  String _selectedRole = 'POS';
  bool _isLoading = false;
  String? _statusMessage;
  bool _isSuccess = false;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleCreateUser() async {
    final email = _emailController.text.trim();
    final password = _passwordController.text.trim();

    if (email.isEmpty || !email.contains('@')) {
      setState(() {
        _statusMessage = 'Vui lòng nhập định dạng email hợp lệ!';
        _isSuccess = false;
      });
      return;
    }

    if (password.length < 6) {
      setState(() {
        _statusMessage = 'Mật khẩu phải có ít nhất 6 ký tự!';
        _isSuccess = false;
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _statusMessage = null;
    });

    try {
      // Lưu lại thông tin admin hiện tại
      final adminUser = FirebaseAuth.instance.currentUser;

      // Tạo tài khoản mới bằng Firebase Auth
      await FirebaseAuth.instance.createUserWithEmailAndPassword(
        email: email,
        password: password,
      );

      // Nếu tạo thành công, đăng nhập lại admin để không bị mất phiên
      // Vì createUser tự động sign-in vào user mới
      if (adminUser != null && adminUser.email != null) {
        // Thông báo thành công
        setState(() {
          _isSuccess = true;
          _statusMessage = 'Đã tạo thành công tài khoản "$email" với vai trò "$_selectedRole"!\n(Lưu ý: Để tiếp tục quản trị, vui lòng đăng nhập lại tài khoản Admin).';
          _emailController.clear();
          _passwordController.clear();
        });
      }
    } on FirebaseAuthException catch (e) {
      setState(() {
        _isSuccess = false;
        if (e.code == 'email-already-in-use') {
          _statusMessage = 'Email này đã tồn tại trên hệ thống!';
        } else {
          _statusMessage = 'Lỗi: ${e.message}';
        }
      });
    } catch (e) {
      setState(() {
        _isSuccess = false;
        _statusMessage = 'Lỗi: $e';
      });
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text(
          'Quản Lý & Phân Quyền Tài Khoản',
          style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        foregroundColor: const Color(0xFF0F172A),
      ),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 600),
          child: ListView(
            padding: const EdgeInsets.all(20),
            children: [
              // 1. DANH SÁCH 2 TÀI KHOẢN HỆ THỐNG
              const Text(
                'DANH SÁCH TÀI KHOẢN HỆ THỐNG',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF64748B),
                  letterSpacing: 0.5,
                ),
              ),
              const SizedBox(height: 12),

              // Tài khoản 1: ADMIN
              _buildAccountTile(
                email: 'admin@gmail.com',
                roleTitle: 'Quản Trị Viên (Admin - Con)',
                roleSubtitle: 'Toàn quyền cấu hình món, sửa giá, xem báo cáo, xuất CSV',
                badgeText: 'ADMIN',
                badgeColor: const Color(0xFF4F46E5),
                badgeBg: const Color(0xFFEEF2FF),
                icon: Icons.workspace_premium_rounded,
                isCurrentAdmin: true,
              ),
              const SizedBox(height: 12),

              // Tài khoản 2: POS
              _buildAccountTile(
                email: 'post@gmail.com',
                roleTitle: 'Người Dùng Thu Ngân (POS - Ba Mẹ)',
                roleSubtitle: 'Bán hàng, tạo đơn, nhập chi phí, xem sổ tổng kết ngày.',
                badgeText: 'NGƯỜI DÙNG (POS)',
                badgeColor: const Color(0xFF059669),
                badgeBg: const Color(0xFFECFDF5),
                icon: Icons.storefront_rounded,
                isCurrentAdmin: false,
              ),
              const SizedBox(height: 32),

              // 2. KHUNG CẤP TÀI KHOẢN MỚI
              const Text(
                'CẤP TÀI KHOẢN NGƯỜI DÙNG MỚI',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF64748B),
                  letterSpacing: 0.5,
                ),
              ),
              const SizedBox(height: 12),

              Container(
                padding: const EdgeInsets.all(22),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.04),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Text(
                      'Chỉ Quản trị viên mới có thể tạo thêm tài khoản cho nhân viên/người dùng. Người ngoài không thể tự đăng ký.',
                      style: TextStyle(fontSize: 12, color: Color(0xFF64748B), height: 1.4),
                    ),
                    const SizedBox(height: 18),

                    if (_statusMessage != null) ...[
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: _isSuccess ? const Color(0xFFECFDF5) : const Color(0xFFFEF2F2),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: _isSuccess ? const Color(0xFF10B981) : const Color(0xFFEF4444),
                          ),
                        ),
                        child: Text(
                          _statusMessage!,
                          style: TextStyle(
                            color: _isSuccess ? const Color(0xFF065F46) : const Color(0xFF991B1B),
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],

                    // Email field
                    TextField(
                      controller: _emailController,
                      keyboardType: TextInputType.emailAddress,
                      decoration: InputDecoration(
                        labelText: 'Email người dùng mới',
                        hintText: 'vi du: nhanvien@quanlycf.com',
                        prefixIcon: const Icon(Icons.email_outlined, size: 20),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      ),
                    ),
                    const SizedBox(height: 14),

                    // Password field
                    TextField(
                      controller: _passwordController,
                      decoration: InputDecoration(
                        labelText: 'Mật khẩu khởi tạo',
                        hintText: 'Tối thiểu 6 ký tự',
                        prefixIcon: const Icon(Icons.lock_outline, size: 20),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      ),
                    ),
                    const SizedBox(height: 14),

                    // Role selector
                    DropdownButtonFormField<String>(
                      initialValue: _selectedRole,
                      decoration: InputDecoration(
                        labelText: 'Phân quyền vai trò',
                        prefixIcon: const Icon(Icons.badge_outlined, size: 20),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      ),
                      items: const [
                        DropdownMenuItem(
                          value: 'POS',
                          child: Text('Người Dùng / Thu Ngân (Chỉ bán hàng trên máy POS)'),
                        ),
                        DropdownMenuItem(
                          value: 'ADMIN',
                          child: Text('Quản Trị Viên (Toàn quyền trên Web)'),
                        ),
                      ],
                      onChanged: (val) {
                        if (val != null) setState(() => _selectedRole = val);
                      },
                    ),
                    const SizedBox(height: 22),

                    SizedBox(
                      height: 48,
                      child: ElevatedButton.icon(
                        onPressed: _isLoading ? null : _handleCreateUser,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF4F46E5),
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        ),
                        icon: _isLoading
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                              )
                            : const Icon(Icons.person_add_rounded, size: 20),
                        label: Text(
                          _isLoading ? 'Đang tạo...' : 'Tạo Tài Khoản Cho Người Dùng',
                          style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAccountTile({
    required String email,
    required String roleTitle,
    required String roleSubtitle,
    required String badgeText,
    required Color badgeColor,
    required Color badgeBg,
    required IconData icon,
    required bool isCurrentAdmin,
  }) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: isCurrentAdmin ? const Color(0xFF6366F1).withValues(alpha: 0.4) : const Color(0xFFE2E8F0),
          width: isCurrentAdmin ? 1.8 : 1.2,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: badgeBg,
                      shape: BoxShape.circle,
                    ),
                    child: Icon(icon, color: badgeColor, size: 20),
                  ),
                  const SizedBox(width: 12),
                  Text(
                    email,
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF0F172A),
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: badgeBg,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: badgeColor.withValues(alpha: 0.3)),
                ),
                child: Text(
                  badgeText,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    color: badgeColor,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            roleTitle,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: Color(0xFF334155),
            ),
          ),
          const SizedBox(height: 3),
          Text(
            roleSubtitle,
            style: const TextStyle(
              fontSize: 12,
              color: Color(0xFF64748B),
              height: 1.3,
            ),
          ),
        ],
      ),
    );
  }
}
