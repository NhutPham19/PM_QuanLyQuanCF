/**
 * SCRIPT GÁN ROLE (CUSTOM CLAIMS) CHO TÀI KHOẢN FIREBASE
 * Chạy cục bộ 1 lần bằng Node.js khi khởi tạo tài khoản:
 *
 * Cài đặt:
 *   npm install firebase-admin
 *
 * Sử dụng:
 *   node tools/set_role.js <serviceAccountKey.json> <UID_CẦN_GÁN> <ADMIN | POS>
 */

const admin = require('firebase-admin');

const args = process.argv.slice(2);
if (args.length < 3) {
  console.log('❌ Thiếu tham số!');
  console.log('Cách dùng: node tools/set_role.js <serviceAccountKey.json> <UID> <ADMIN | POS>');
  process.exit(1);
}

const [serviceAccountPath, uid, role] = args;

if (role !== 'ADMIN' && role !== 'POS') {
  console.log('❌ Role không hợp lệ! Chỉ chấp nhận: ADMIN hoặc POS');
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

admin.auth().setCustomUserClaims(uid, { role })
  .then(() => {
    console.log(`✅ THÀNH CÔNG: Đã gán quyền role="${role}" cho tài khoản UID="${uid}"`);
    console.log('👉 Người dùng cần đăng xuất và đăng nhập lại trên thiết bị để token cập nhật quyền mới.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Lỗi khi gán claim:', error.message);
    process.exit(1);
  });
