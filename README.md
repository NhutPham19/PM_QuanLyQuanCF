# PM_QuanLyQuanCF — Phần Mềm Quản Lý Quán Cà Phê Gia Đình

> Hệ thống quản lý bán hàng và thu chi chuyên biệt cho quán cà phê gia đình, tối ưu trải nghiệm cho người lớn tuổi (Ba Mẹ) trên điện thoại Android cũ và cung cấp bảng điều khiển quản trị từ xa cho Con trên iPhone (iOS / Web PWA) với chi phí vận hành **0đ/tháng**.

---

## ☕ 1. TÍNH NĂNG NỔI BẬT

### 📱 Dành cho Ba Mẹ (Giao diện POS - Android)
* **Senior-friendly UI/UX:** Nền sáng tương phản cao (`#F8F9FA`), cỡ chữ lớn (18sp – 32sp), không thao tác phức tạp (không vuốt, không nhấn giữ).
* **Quy trình bán hàng 2 bước nhanh & chống bấm nhầm:**
  * **Bước 1:** Công tắc 1 chạm đổi giữa `[🏠 UỐNG TẠI QUÁN]` và `[🛵 MANG VỀ]` (giá tự động nhảy theo từng chế độ). Chạm món có âm thanh *"Tít"* và rung nhẹ phản hồi.
  * **Bước 2:** Màn hình xem lại đơn với dòng tổng tiền khổng lồ, nút `[+]` và `[-]` to 56dp, nút `[HOÀN TẤT & LƯU ĐƠN]` tự khóa chống bấm đúp, chuông *"Ting"* và tích xanh thành công.
* **Bàn phím số CASIO (`casio_keypad.dart`):** Bàn phím số riêng to rõ, phím `000`, tự động định dạng dấu chấm phân cách nghìn (`180.000 đ`), cảnh báo đỏ khi số tiền ≥ 1.000.000 đ.
* **Chi tiền & Nhập hàng:**
  * Nhập hàng bán (Lon / Thùng): Tự động nhân hệ số `unitsPerCase` (ví dụ: 1 thùng Sting = 24 lon) để cộng tồn kho và ghi nhận chi phí.
  * Mua đồ dùng quán: 1 chạm chọn Đá lạnh, Ly/Túi, Chanh/Đường... và nhập tiền chi.
* **Sổ tiền hôm nay:** Đọc duy nhất 1 document Firestore siêu nhẹ: Tiền bán (+), Tiền chi (-), Còn lại (Bán - Chi).
* **Ngoại tuyến (Offline-First):** Mất mạng Wi-Fi vẫn bán hàng bình thường, dữ liệu tự đồng bộ ngầm khi có mạng trở lại.

### 👑 Dành cho Con (Giao diện Quản trị Admin - iPhone / Web PWA)
* **0đ Chi phí App Store:** Sử dụng công nghệ Web PWA trên Safari iPhone (*Thêm vào MH chính*), giao diện toàn màn hình mượt mà như app gốc.
* **Quản lý Món ăn (Full CRUD):** Gom nhóm trực quan theo danh mục (`NƯỚC TỰ PHA`, `NƯỚC NGỌT`, `MÍA / CAM / DỪA`, `THUỐC LÁ`...). Thiết lập 2 giá (Tại quán / Mang về), đơn vị tính, quy đổi thùng, cờ quản lý trừ kho (`trackStock`).
* **Lưu trữ ảnh Cloudinary:** Upload trực tiếp từ iPhone lên Cloudinary API, tự động nén và cắt ảnh vuông tối ưu `w_300,h_300,c_fill,q_auto,f_auto`.
* **Báo cáo & Lịch sử đơn:** Thống kê doanh thu, chi phí, lợi nhuận theo ngày/tháng, hủy/khôi phục đơn hàng sai lệch và xuất file dữ liệu CSV.

---

## 🛠️ 2. KIẾN TRÚC KỸ THUẬT

* **Framework:** Flutter 3.19+ (Dart 3.0+)
* **State Management:** Riverpod
* **Cơ sở dữ liệu:** Google Cloud Firestore (Spark Plan 0đ)
* **Lưu trữ hình ảnh:** Cloudinary (Free Tier 25GB/tháng)
* **Hosting Admin:** Firebase Hosting (PWA)
* **2 Entry Points:**
  * `lib/main_pos.dart` (Bản build APK cho Ba Mẹ)
  * `lib/main_admin.dart` (Bản build Web cho Con)

---

## 📂 3. CẤU TRÚC DỰ ÁN

```
PM_QuanLyQuanCF/
├── android/app/google-services.json     # Cấu hình Firebase Android
├── web/                                 # Cấu hình PWA (index.html, manifest.json)
├── firestore.rules                      # Phân quyền bảo mật Firestore (POS vs Admin)
├── firestore.indexes.json               # Composite indexes Firestore
├── firebase.json / .firebaserc          # Cấu hình Firebase Hosting
├── tools/
│   ├── set_role.js                      # Script Node.js gán quyền ADMIN/POS
│   └── verify_all_logic.js              # Bộ kiểm thử tự động 21 kịch bản nghiệp vụ
└── lib/
    ├── main_pos.dart                    # Entry point POS Ba Mẹ
    ├── main_admin.dart                  # Entry point Admin Con
    ├── firebase_options.dart            # Cấu hình Firebase đa nền tảng
    ├── core/                            # Constants, Theme chữ to, Utils (VND, UTC+7...)
    ├── data/
    │   ├── models/                      # Category, Product, Order, Expense, DailySummary
    │   └── repositories/                # Product, Order, Expense, Summary, Auth, Cloudinary
    ├── services/                        # AudioService, CartStorageService
    └── features/
        ├── pos/                         # Màn hình chính, Bán hàng, Xem lại đơn, Chi tiền, Sổ tiền
        └── admin/                       # Dashboard, Quản lý món, Danh mục, Lịch sử, Báo cáo, CSV
```

---

## 🚀 4. HƯỚNG DẪN CHẠY & KIỂM THỬ

### 1. Kiểm thử Logic nghiệp vụ tự động (Không cần Flutter)
```bash
node tools/verify_all_logic.js
```

### 2. Chạy bản Web Admin của Con trên Chrome
```bash
flutter run -d chrome -t lib/main_admin.dart
```

### 3. Chạy bản Bán hàng POS của Ba Mẹ trên Android
```bash
flutter run -t lib/main_pos.dart
```

### 4. Build APK phát hành cho Ba Mẹ
```bash
flutter build apk --release -t lib/main_pos.dart
```

### 5. Deploy Web Admin lên Firebase Hosting cho iPhone
```bash
flutter build web --release -t lib/main_admin.dart
firebase deploy --only hosting
```
