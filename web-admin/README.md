# 📱 Cà Phê Gia Đình - Web Admin 120Hz Apple Bento (React 19 + Vite)

> Hệ thống Quản trị Web độc lập, siêu mượt chuẩn Apple Bento dành cho Quản trị viên quán Cà Phê Gia Đình. Chạy song song và dùng chung Firebase Firestore với app POS Android (Flutter) của Ba Mẹ, cam kết **chi phí duy trì 0đ/tháng** và **không làm gián đoạn máy POS bán hàng**.

---

## ⚡ 1. Điểm nổi bật & Tối ưu hiệu năng

- **Công nghệ hiện đại:** React 19, TypeScript, Vite 8, Tailwind CSS, Lucide Icons, Recharts.
- **Phong cách thiết kế:** Apple Bento VIP bo góc lớn (`rounded-3xl`), kính mờ (`backdrop-blur`), hiển thị mượt 120Hz trên Safari iOS và Desktop.
- **Dung lượng siêu nhẹ (Performance Budget):**
  - Gói JS nạp lần đầu: **~86 KB gzip** (ngưỡng giới hạn của Claude là $\le$ 250 KB gzip).
  - Tách mã tự động (Code-splitting & Lazy-loading) cho từng phân hệ và biểu đồ.
  - Sử dụng Font hệ thống Apple San Francisco (`-apple-system`), không tốn tài nguyên tải font ngoài.
- **Hỗ trợ PWA (Progressive Web App):**
  - Tích hợp `vite-plugin-pwa` với service worker tự động cập nhật.
  - Hỗ trợ nút **"Thêm vào Màn hình chính"** (Add to Home Screen) trên iPhone như app nguyên bản (fullscreen, không lộ thanh URL trình duyệt).
- **Chi phí 0đ/tháng (Spark Plan):**
  - Không sử dụng Cloud Functions hay Cloud Run.
  - Cấp tài khoản nhân viên ngầm bằng **Secondary Firebase App Instance** trực tiếp ở client.
  - Upload ảnh menu qua Cloudinary Unsigned Preset `qlcf_unsigned`.
  - Xuất báo cáo CSV UTF-8 BOM trực tiếp tại trình duyệt, mở bằng Microsoft Excel không bao giờ lỗi font tiếng Việt.

---

## 📂 2. Cấu trúc thư mục

```
web-admin/
├── public/                 # Favicon, App Icons PWA & Apple Touch Icons
├── src/
│   ├── auth/               # Context phân quyền Admin, Route Guard RequireAdmin
│   ├── components/         # Giao diện dùng chung: AdminLayout, Sidebar, BottomNav
│   ├── features/dashboard/ # Biểu đồ Recharts lazy-load
│   ├── lib/                # Cấu hình Firebase SDK, Cloudinary upload, Format tiền tệ & ngày
│   ├── pages/              # 8 Phân hệ nghiệp vụ độc lập:
│   │   ├── LoginPage.tsx      # Đăng nhập bảo mật
│   │   ├── DashboardPage.tsx  # Thống kê thời gian thực (onSnapshot)
│   │   ├── ProductsPage.tsx   # Quản lý món & 2 mức giá (Tại quán / Mang về)
│   │   ├── CategoriesPage.tsx # Phân loại đồ uống & nút chi phí
│   │   ├── OrdersPage.tsx     # Lịch sử đơn hàng, Hủy/Khôi phục đơn nguyên tử
│   │   ├── ExpensesPage.tsx   # Sổ chi tiền & Nhập kho nguyên liệu
│   │   ├── ReportsPage.tsx    # Báo cáo doanh thu, chi phí, lãi ròng tháng & đối soát
│   │   ├── ExportPage.tsx     # Xuất dữ liệu CSV có mã UTF-8 BOM cho Excel
│   │   └── StaffPage.tsx      # Quản lý & Cấp tài khoản nhân viên
│   ├── types/              # Định nghĩa Typescript đồng bộ 100% với schema Firestore
│   ├── App.tsx             # Bộ định tuyến Router với React.lazy & Suspense
│   └── main.tsx            # Điểm khởi chạy ứng dụng React
├── .env.example            # Biến môi trường mẫu
├── vite.config.ts          # Cấu hình Vite, PWA manifest, rollup manualChunks
└── package.json
```

---

## 🛠️ 3. Hướng dẫn phát triển & Chạy máy cục bộ (Local Dev)

### 3.1. Cài đặt thư viện:
```bash
cd web-admin
npm install
```

### 3.2. Cấu hình file `.env`:
Tạo file `.env` trong thư mục `web-admin/` với nội dung từ Firebase Project `pm-quanlyquancf`:
```env
VITE_FB_API_KEY="AIzaSy..."
VITE_FB_AUTH_DOMAIN="pm-quanlyquancf.firebaseapp.com"
VITE_FB_PROJECT_ID="pm-quanlyquancf"
VITE_FB_APP_ID="1:874603417724:web:..."
VITE_CLOUDINARY_CLOUD_NAME="dhscv8q3b"
VITE_CLOUDINARY_UPLOAD_PRESET="qlcf_unsigned"
```

### 3.3. Chạy môi trường Dev:
```bash
npm run dev
```
Trình duyệt sẽ mở tại `http://localhost:5173`.

### 3.4. Kiểm thử & Đóng gói sản phẩm (Production Build):
```bash
npm run build
```
Bản build tối ưu hóa sẽ được tạo trong thư mục `web-admin/dist/`.

---

## 🚀 4. Hướng dẫn Deploy Firebase Hosting song song (Multi-site)

Hệ thống được thiết kế để triển khai song song với bản Flutter Web hiện có, không can thiệp vào máy POS của Ba Mẹ.

### Bước 1: Tạo Site phụ trên Firebase Console
1. Truy cập [Firebase Console Hosting](https://console.firebase.google.com/project/pm-quanlyquancf/hosting/sites).
2. Nhấn nút **"Add another site"** (Thêm trang web khác).
3. Đặt ID cho trang web mới, ví dụ: `pm-quanlyquancf-admin`.

### Bước 2: Liên kết Target Hosting trong máy tính
Tại thư mục gốc dự án (`PM_QuanLyQuanCF`), chạy lệnh:
```bash
npx firebase-tools target:apply hosting admin-web pm-quanlyquancf-admin
```

### Bước 3: Đóng gói và Deploy bản Web Admin mới
```bash
# Đóng gói bản web-admin
cd web-admin
npm run build
cd ..

# Deploy riêng target web-admin mới
npx firebase-tools deploy --only hosting:admin-web
```

> **Ghi chú chuyển đổi (Cutover):** Khi muốn dùng chính thức bản Web Admin mới này thay thế hoàn toàn bản web cũ tại domain chính `pm-quanlyquancf.web.app`, chỉ cần sửa trường `"public": "web-admin/dist"` trong file `firebase.json` ở thư mục gốc và chạy `npx firebase-tools deploy --only hosting`.

---

## 🔐 5. Tài khoản hệ thống

| Tài khoản | Mật khẩu | Quyền hạn | Ghi chú |
| :--- | :--- | :--- | :--- |
| `admin@quanlycf.com` | *(Mật khẩu riêng)* | **Quản trị viên (ADMIN)** | Đăng nhập được vào Web Admin, toàn quyền xem doanh thu, cài giá, xem lãi ròng |
| `post@quanlycf.com` | *(Mật khẩu POS)* | **Thu ngân (POS / STAFF)** | Dành riêng cho app Android của Ba Mẹ bán hàng; bị chặn tự động nếu vào Web Admin |
