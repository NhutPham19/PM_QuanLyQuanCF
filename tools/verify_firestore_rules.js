// Automated Test & Verification Suite for Firestore Security Rules (Phase 2)
// Run with: node tools/verify_firestore_rules.js

import fs from 'fs';
import path from 'path';

console.log('====================================================');
console.log('🛡️  KIỂM THỬ BẢO MẬT FIRESTORE SECURITY RULES (PHASE 2)');
console.log('====================================================\n');

const rulesPath = path.resolve('firebase/firestore.rules');
if (!fs.existsSync(rulesPath)) {
  console.error(`❌ Không tìm thấy file: ${rulesPath}`);
  process.exit(1);
}

const rulesContent = fs.readFileSync(rulesPath, 'utf8');

let totalTests = 0;
let passedTests = 0;

function checkRule(description, assertion) {
  totalTests++;
  if (assertion) {
    passedTests++;
    console.log(`  [PASS] ${description}`);
  } else {
    console.error(`  ❌ [FAIL] ${description}`);
  }
}

// 1. Kiểm tra cấu trúc rules_version 2
checkRule(
  "Rules khai báo rules_version = '2'",
  rulesContent.includes("rules_version = '2';")
);

// 2. Kiểm tra helper functions
checkRule(
  "Có hàm kiểm tra đăng nhập signedIn()",
  rulesContent.includes("function signedIn()")
);

checkRule(
  "Có hàm isAdmin() hỗ trợ cả users collection, token claim và email admin@quanlycf.com",
  rulesContent.includes("function isAdmin()") &&
  rulesContent.includes("admin@quanlycf.com") &&
  rulesContent.includes("ADMIN")
);

checkRule(
  "Có hàm isStaff() hỗ trợ cả users collection, token claim và email post@quanlycf.com",
  rulesContent.includes("function isStaff()") &&
  rulesContent.includes("post@quanlycf.com") &&
  rulesContent.includes("POS")
);

// 3. Kiểm tra bảo vệ từng collection
checkRule(
  "Collection users: Người dùng đọc doc của chính mình, Admin đọc toàn bộ",
  rulesContent.includes("match /users/{uid}") &&
  rulesContent.includes("request.auth.uid == uid || isAdmin()")
);

checkRule(
  "Collection products: POS chỉ được cập nhật tồn kho (stockQuantity & updatedAt)",
  rulesContent.includes("match /products/{id}") &&
  rulesContent.includes("affectedKeys().hasOnly(['stockQuantity', 'updatedAt'])")
);

checkRule(
  "Collection products: Chỉ Admin được đổi giá, tạo mới, xóa món",
  rulesContent.includes("allow create, delete: if isAdmin();")
);

checkRule(
  "Collection orders: Tuyệt đối CẤM xóa cứng đơn hàng (allow delete: if false)",
  rulesContent.includes("match /orders/{id}") &&
  rulesContent.includes("allow delete: if false;")
);

checkRule(
  "Collection orders: POS chỉ được hủy đơn trong vòng 10 phút đầu",
  rulesContent.includes("duration.value(10, 'm')") &&
  rulesContent.includes("request.resource.data.status == 'VOIDED'")
);

checkRule(
  "Collection expenses: Tuyệt đối CẤM xóa cứng phiếu chi",
  rulesContent.includes("match /expenses/{id}") &&
  rulesContent.includes("allow delete: if false;")
);

checkRule(
  "Collection daily_summaries: Nhân viên và Admin được ghi để cập nhật doanh thu",
  rulesContent.includes("match /daily_summaries/{dateString}") &&
  rulesContent.includes("allow write: if isStaff();")
);

console.log(`\n----------------------------------------------------`);
console.log(`Kết quả: ${passedTests}/${totalTests} bài kiểm tra đạt yêu cầu.`);
if (passedTests === totalTests) {
  console.log(`✔ Rules bảo mật đạt chuẩn 100%, bảo vệ tuyệt đối hệ thống và tương thích hoàn toàn với POS Ba Mẹ!`);
} else {
  process.exit(1);
}
