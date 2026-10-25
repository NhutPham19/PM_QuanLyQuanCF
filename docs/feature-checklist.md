# BẢNG CHECKLIST TÍNH NĂNG WEB ADMIN (PHASE 0)
## DỰ ÁN: PM_QuanLyQuanCF

> Đây là bảng thước đo tiêu chuẩn "Xong" (Definition of Done) của dự án Web Admin mới. Mọi tính năng dưới đây đều được khảo sát trực tiếp từ bản Web Admin Flutter hiện có.

---

## 1. PHÂN HỆ XÁC THỰC & BẢO MẬT (AUTH)

- [ ] **Màn hình Đăng nhập Quản trị (`/login`):**
  - [ ] Nhập Email & Mật khẩu với nút hiển thị/ẩn mật khẩu.
  - [ ] Thông báo lỗi tiếng Việt rõ ràng khi nhập sai thông tin.
  - [ ] Khóa cứng chế độ đăng nhập (không hiển thị form đăng ký công khai).
- [ ] **Kiểm tra phân quyền nghiêm ngặt (`RequireAdmin`):**
  - [ ] Chỉ cho phép tài khoản Admin (`admin@quanlycf.com` hoặc role `admin`) vào hệ thống quản trị.
  - [ ] Tự động chuyển hướng về trang `/login` nếu chưa đăng nhập.
  - [ ] Chặn và hiển thị thông báo "Truy cập bị từ chối" nếu tài khoản POS hoặc tài khoản không có quyền cố tình đăng nhập.
- [ ] **Nút Đăng xuất (`Sign Out`):** Có nút đăng xuất tiện lợi kèm hộp thoại xác nhận trên thanh điều hướng.

---

## 2. BẢNG ĐIỀU KHIỂN THỜI GIAN THỰC (REALTIME DASHBOARD)

- [ ] **Thẻ Bento Hero - Doanh thu hôm nay (Realtime):**
  - [ ] Lắng nghe thời gian thực (`onSnapshot`) từ `daily_summaries/{YYYY-MM-DD}`.
  - [ ] Hiển thị số tiền Doanh thu hôm nay (VND) chữ to, đậm nét phong cách Apple Bento.
  - [ ] 3 chỉ số phụ kính mờ:
    - [ ] Tiền đã chi trong ngày (`totalExpense`).
    - [ ] Dòng tiền còn lại trong ngày (`totalRevenue - totalExpense`).
    - [ ] Tổng số đơn hàng thành công trong ngày (`totalOrders`).
  - [ ] Hiển thị ngày xem (theo giờ Việt Nam UTC+7).
- [ ] **Lưới thẻ Bento điều hướng nhanh:**
  - [ ] Thẻ "Món Ăn & Giá" (kèm số lượng món đang bán).
  - [ ] Thẻ "Danh Mục & Loại Chi" (nhóm đồ uống & nút chi).
  - [ ] Thẻ "Lịch Sử Đơn Hàng" (xem đơn bán & nút hủy/khôi phục).
  - [ ] Thẻ "Báo Cáo Doanh Thu" (thống kê tháng).
  - [ ] Thẻ "Phân Quyền & Cấp Tài Khoản" (dành riêng Admin).
  - [ ] Thẻ "Xuất Dữ Liệu CSV" (tải báo cáo Excel).
- [ ] **Biểu đồ doanh thu 7 ngày gần nhất (Lazy-loaded Recharts):**
  - [ ] Hiển thị xu hướng doanh thu và chi phí 7 ngày qua.
  - [ ] Lazy-load component biểu đồ để không làm tăng dung lượng gói JS tải lần đầu.

---

## 3. QUẢN LÝ MÓN ĂN & CÀI ĐẶT 2 MỨC GIÁ (`/products`)

- [ ] **Danh sách món ăn:**
  - [ ] Hiển thị lưới/danh sách với ảnh Cloudinary (vuông 300x300), emoji, tên món, danh mục.
  - [ ] Hiển thị đồng thời **2 mức giá**: `[Tại quán: ...đ]` và `[Mang về: ...đ]`.
  - [ ] Hiển thị số lượng tồn kho (kèm nhãn cảnh báo đỏ nếu `stockQuantity <= lowStockAt`).
  - [ ] Bộ lọc theo từng danh mục món ăn.
- [ ] **Thêm / Sửa món ăn (Form Dialog):**
  - [ ] Nhập Tên món.
  - [ ] Chọn Danh mục đồ uống (từ `categories`).
  - [ ] Chọn Icon Emoji đại diện.
  - [ ] Tích hợp Upload ảnh Cloudinary trực tiếp (Unsigned preset `qlcf_unsigned` vào thư mục `pm_quanlyquancf`) hoặc dán URL ảnh. Tự động áp dụng transform URL vuông `w_300,h_300,c_fill,q_auto,f_auto`.
  - [ ] **Cài đặt 2 mức giá độc lập**: Giá Uống Tại Quán (`priceDineIn`) và Giá Mang Về (`priceTakeAway`).
  - [ ] Cài đặt Đơn vị tính (ly, lon, chai, bao, điếu).
  - [ ] Công tắc Quản lý tồn kho (`trackStock` true/false).
  - [ ] Nhập số lượng tồn kho hiện tại và ngưỡng báo động thấp (`lowStockAt`).
  - [ ] Cài đặt số lượng quy đổi Thùng ra Lon (`unitsPerCase`, ví dụ 24 lon/thùng).
  - [ ] Thứ tự hiển thị (`sortOrder`).
- [ ] **Cập nhật nhanh tồn kho:** Cho phép sửa nhanh số lượng tồn kho trực tiếp từ danh sách.
- [ ] **Xóa mềm món ăn (`softDelete`):** Cập nhật `isActive: false` (không xóa cứng tài liệu để bảo vệ dữ liệu lịch sử đơn hàng cũ).

---

## 4. QUẢN LÝ DANH MỤC & LOẠI CHI PHÍ (`/categories`)

- [ ] **Tab 1: Danh mục món ăn (`categories`):**
  - [ ] Danh sách danh mục kèm Emoji và thứ tự `orderIndex`.
  - [ ] Thêm danh mục mới (Tên, Icon emoji, Thứ tự).
  - [ ] Chỉnh sửa danh mục.
  - [ ] Xóa mềm danh mục (`isActive: false`).
- [ ] **Tab 2: Danh mục chi phí quán (`expense_categories`):**
  - [ ] Danh sách các nút loại chi cho Ba Mẹ (Mua đá, mua ly, mua chanh, chi khác).
  - [ ] Thêm/Sửa/Ẩn loại chi phí.

---

## 5. LỊCH SỬ ĐƠN HÀNG & THAO TÁC HỦY/KHÔI PHỤC (`/orders`)

- [ ] **Bộ lọc lịch sử đơn hàng:**
  - [ ] Lọc theo ngày cụ thể (DatePicker hỗ trợ chọn ngày). Mặc định là ngày hôm nay.
  - [ ] Lọc theo trạng thái: Tất cả / Thành công (`ACTIVE`) / Đã hủy (`VOIDED`).
  - [ ] Lọc theo hình thức: Tất cả / Tại quán / Mang về.
- [ ] **Hiển thị chi tiết từng đơn hàng:**
  - [ ] Mã đơn hàng, thời gian tạo (giờ:phút:giây).
  - [ ] Nhãn hình thức: `[🏠 Tại quán]` (xanh dương) hoặc `[🛵 Mang về]` (cam).
  - [ ] Nhãn trạng thái rõ ràng nếu đơn đã hủy: `[❌ ĐÃ HỦY]` (gạch ngang số tiền).
  - [ ] Danh sách từng món trong đơn: `Số lượng x Tên món = Thành tiền`.
  - [ ] Tổng tiền đơn hàng (VND).
- [ ] **Thao tác Hủy đơn hàng nguyên tử (`voidOrder`):**
  - [ ] Hộp thoại xác nhận hủy đơn cảnh báo rõ ràng.
  - [ ] Cập nhật trạng thái `status = 'VOIDED'`, ghi nhận `voidedAt` và `voidedBy = 'ADMIN'`.
  - [ ] **Tự động hoàn lại số lượng tồn kho** cho các món có `trackStock == true` trong đơn.
  - [ ] **Tự động giảm trừ doanh thu và số đơn** trong `daily_summaries/{order.dateString}`.
- [ ] **Thao tác Khôi phục đơn hàng nguyên tử (`restoreOrder`):**
  - [ ] Đưa trạng thái về `status = 'ACTIVE'`, xóa thông tin `voidedAt`.
  - [ ] **Tự động trừ lại tồn kho** các món tương ứng.
  - [ ] **Tự động cộng lại doanh thu và số đơn** vào `daily_summaries/{order.dateString}`.

---

## 6. SỔ CHI TIỀN & NHẬP HÀNG (`/expenses`)

- [ ] Xem danh sách các khoản chi tiêu trong ngày hoặc theo tháng.
- [ ] Phân biệt rõ ràng 2 nhóm:
  - Phiếu chi Nhập hàng bán (`RESTOCK` - có số lượng lon quy đổi cộng vào kho).
  - Phiếu chi Đồ dùng quán (`SUPPLIES` / `OTHER` - mua đá, mua ly túi, chi khác).
- [ ] Thêm phiếu chi trực tiếp từ Web Admin.

---

## 7. BÁO CÁO THỐNG KÊ DOANH THU & LỢI NHUẬN (`/reports`)

- [ ] **Bộ chọn tháng báo cáo (`YYYY-MM`):** Mặc định tháng hiện tại.
- [ ] **Các thẻ tổng kết toàn tháng:**
  - [ ] Tổng doanh thu tháng (tổng các `totalRevenue` của các ngày).
  - [ ] Tổng chi phí tháng (tổng các `totalExpense`).
  - [ ] **Lợi nhuận ròng tháng** (`Doanh thu - Chi phí`).
  - [ ] Tổng số đơn hàng bán ra trong tháng.
- [ ] **Bảng sao kê chi tiết từng ngày trong tháng:**
  - [ ] Cột: Ngày, Doanh thu, Chi phí, Dòng tiền còn lại (Bán - Chi), Số đơn.
- [ ] **Nút Đối soát / Tính lại ngày (`recalculateDay`):** Cho phép Admin quét lại toàn bộ dữ liệu đơn hàng và chi phí của 1 ngày bất kỳ để đồng bộ lại `daily_summaries` nếu phát hiện có sai lệch.

---

## 8. XUẤT BÁO CÁO CSV / EXCEL (`/export`)

- [ ] Chọn tháng cần xuất báo cáo.
- [ ] **Xuất CSV Danh sách đơn hàng:**
  - Cột: Mã Đơn, Ngày Bán, Loại Đơn, Tổng Tiền (VND), Trạng Thái, Chi Tiết Món.
- [ ] **Xuất CSV Danh sách phiếu chi:**
  - Cột: Mã Phiếu Chi, Ngày Chi, Loại Chi, Khoản Mục, Số Tiền (VND), Ghi Chú.
- [ ] **Yêu cầu kỹ thuật:** File CSV có gắn mã BOM UTF-8 (`\uFEFF`) để khi mở bằng Microsoft Excel tiếng Việt không bao giờ bị lỗi font chữ. Hỗ trợ nút tải file trực tiếp và nút sao chép vào Clipboard.

---

## 9. QUẢN LÝ PHÂN QUYỀN & CẤP TÀI KHOẢN (`/staff`)

- [ ] Hiển thị danh sách các tài khoản đang hoạt động (`admin@quanlycf.com`, `post@quanlycf.com`...).
- [ ] **Form cấp tài khoản mới an toàn:**
  - Nhập Email & Mật khẩu mới (ít nhất 6 ký tự).
  - Chọn phân quyền vai trò: `Quản trị viên (Admin)` hoặc `Thu ngân POS (Ba Mẹ)`.
  - Sử dụng instance Firebase thứ hai (`initializeApp(config, "secondary")`) để tạo user mà **không làm mất phiên đăng nhập của Admin hiện tại**.

---

## 10. TỐI ƯU HIỆU NĂNG & PWA (PERFORMANCE & PWA)

- [ ] Giao diện Responsive chuẩn Apple Bento: Tối ưu hoàn hảo cho iPhone (Safari) và Desktop Laptop.
- [ ] Hỗ trợ PWA (`vite-plugin-pwa`): Cài đặt "Thêm vào Màn hình chính" trên iPhone như một ứng dụng độc lập.
- [ ] Dung lượng bundle JS lần đầu ≤ 250KB gzip.
- [ ] Tách code lazy-load cho các route nặng (Biểu đồ Recharts, Xuất CSV).
- [ ] Đạt điểm Lighthouse Mobile Performance ≥ 90.
- [ ] Deploy song song lên Firebase Hosting với chi phí **0đ/tháng**.
