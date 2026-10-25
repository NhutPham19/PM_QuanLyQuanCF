# BẢNG CHECKLIST TÍNH NĂNG WEB ADMIN (PHASE 0 - PHASE 8 HOÀN TẤT)
## DỰ ÁN: PM_QuanLyQuanCF

> Đây là bảng thước đo tiêu chuẩn "Xong" (Definition of Done) của dự án Web Admin mới. Toàn bộ các tiêu chí đã hoàn thành và kiểm thử thành công.

---

## 1. PHÂN HỆ XÁC THỰC & BẢO MẬT (AUTH)

- [x] **Màn hình Đăng nhập Quản trị (`/login`):**
  - [x] Nhập Email & Mật khẩu với nút hiển thị/ẩn mật khẩu.
  - [x] Thông báo lỗi tiếng Việt rõ ràng khi nhập sai thông tin.
  - [x] Khóa cứng chế độ đăng nhập (không hiển thị form đăng ký công khai).
- [x] **Kiểm tra phân quyền nghiêm ngặt (`RequireAdmin`):**
  - [x] Chỉ cho phép tài khoản Admin (`admin@quanlycf.com` hoặc role `admin`) vào hệ thống quản trị.
  - [x] Tự động chuyển hướng về trang `/login` nếu chưa đăng nhập.
  - [x] Chặn và hiển thị thông báo "Truy cập bị từ chối" nếu tài khoản POS hoặc tài khoản không có quyền cố tình đăng nhập.
- [x] **Nút Đăng xuất (`Sign Out`):** Có nút đăng xuất tiện lợi kèm hộp thoại xác nhận trên thanh điều hướng.

---

## 2. BẢNG ĐIỀU KHIỂN THỜI GIAN THỰC (REALTIME DASHBOARD)

- [x] **Thẻ Bento Hero - Doanh thu hôm nay (Realtime):**
  - [x] Lắng nghe thời gian thực (`onSnapshot`) từ `daily_summaries/{YYYY-MM-DD}`.
  - [x] Hiển thị số tiền Doanh thu hôm nay (VND) chữ to, đậm nét phong cách Apple Bento.
  - [x] 3 chỉ số phụ kính mờ:
    - [x] Tiền đã chi trong ngày (`totalExpense`).
    - [x] Dòng tiền còn lại trong ngày (`totalRevenue - totalExpense`).
    - [x] Tổng số đơn hàng thành công trong ngày (`totalOrders`).
  - [x] Hiển thị ngày xem (theo giờ Việt Nam UTC+7).
- [x] **Lưới thẻ Bento điều hướng nhanh:**
  - [x] Thẻ "Món Ăn & Giá" (kèm số lượng món đang bán).
  - [x] Thẻ "Danh Mục & Loại Chi" (nhóm đồ uống & nút chi).
  - [x] Thẻ "Lịch Sử Đơn Hàng" (xem đơn bán & nút hủy/khôi phục).
  - [x] Thẻ "Báo Cáo Doanh Thu" (thống kê tháng).
  - [x] Thẻ "Phân Quyền & Cấp Tài Khoản" (dành riêng Admin).
  - [x] Thẻ "Xuất Dữ Liệu CSV" (tải báo cáo Excel).
- [x] **Biểu đồ doanh thu 7 ngày gần nhất (Lazy-loaded Recharts):**
  - [x] Hiển thị xu hướng doanh thu và chi phí 7 ngày qua.
  - [x] Lazy-load component biểu đồ để không làm tăng dung lượng gói JS tải lần đầu.

---

## 3. QUẢN LÝ MÓN ĂN & CÀI ĐẶT 2 MỨC GIÁ (`/products`)

- [x] **Danh sách món ăn:**
  - [x] Hiển thị lưới/danh sách với ảnh Cloudinary (vuông 300x300), emoji, tên món, danh mục.
  - [x] Hiển thị đồng thời **2 mức giá**: `[Tại quán: ...đ]` và `[Mang về: ...đ]`.
  - [x] Hiển thị số lượng tồn kho (kèm nhãn cảnh báo đỏ nếu `stockQuantity <= lowStockAt`).
  - [x] Bộ lọc theo từng danh mục món ăn.
- [x] **Thêm / Sửa món ăn (Form Dialog):**
  - [x] Nhập Tên món.
  - [x] Chọn Danh mục đồ uống (từ `categories`).
  - [x] Chọn Icon Emoji đại diện.
  - [x] Tích hợp Upload ảnh Cloudinary trực tiếp (Unsigned preset `qlcf_unsigned` vào thư mục `pm_quanlyquancf`) hoặc dán URL ảnh. Tự động áp dụng transform URL vuông `w_300,h_300,c_fill,q_auto,f_auto`.
  - [x] **Cài đặt 2 mức giá độc lập**: Giá Uống Tại Quán (`priceDineIn`) và Giá Mang Về (`priceTakeAway`).
  - [x] Cài đặt Đơn vị tính (ly, lon, chai, bao, điếu).
  - [x] Công tắc Quản lý tồn kho (`trackStock` true/false).
  - [x] Nhập số lượng tồn kho hiện tại và ngưỡng báo động thấp (`lowStockAt`).
  - [x] Cài đặt số lượng quy đổi Thùng ra Lon (`unitsPerCase`, ví dụ 24 lon/thùng).
  - [x] Thứ tự hiển thị (`sortOrder`).
- [x] **Cập nhật nhanh tồn kho:** Cho phép sửa nhanh số lượng tồn kho trực tiếp từ danh sách.
- [x] **Xóa mềm món ăn (`softDelete`):** Cập nhật `isActive: false` (không xóa cứng tài liệu để bảo vệ dữ liệu lịch sử đơn hàng cũ).

---

## 4. QUẢN LÝ DANH MỤC & LOẠI CHI PHÍ (`/categories`)

- [x] **Tab 1: Danh mục món ăn (`categories`):**
  - [x] Danh sách danh mục kèm Emoji và thứ tự `orderIndex`.
  - [x] Thêm danh mục mới (Tên, Icon emoji, Thứ tự).
  - [x] Chỉnh sửa danh mục.
  - [x] Xóa mềm danh mục (`isActive: false`).
- [x] **Tab 2: Danh mục chi phí quán (`expense_categories`):**
  - [x] Danh sách các nút loại chi cho Ba Mẹ (Mua đá, mua ly, mua chanh, chi khác).
  - [x] Thêm/Sửa/Ẩn loại chi phí.

---

## 5. LỊCH SỬ ĐƠN HÀNG & THAO TÁC HỦY/KHÔI PHỤC (`/orders`)

- [x] **Bộ lọc lịch sử đơn hàng:**
  - [x] Lọc theo ngày cụ thể (DatePicker hỗ trợ chọn ngày). Mặc định là ngày hôm nay.
  - [x] Lọc theo trạng thái: Tất cả / Thành công (`ACTIVE`) / Đã hủy (`VOIDED`).
  - [x] Lọc theo hình thức: Tất cả / Tại quán / Mang về.
- [x] **Hiển thị chi tiết từng đơn hàng:**
  - [x] Mã đơn hàng, thời gian tạo (giờ:phút:giây).
  - [x] Nhãn hình thức: `[🏠 Tại quán]` (xanh dương) hoặc `[🛵 Mang về]` (cam).
  - [x] Nhãn trạng thái rõ ràng nếu đơn đã hủy: `[❌ ĐÃ HỦY]` (gạch ngang số tiền).
  - [x] Danh sách từng món trong đơn: `Số lượng x Tên món = Thành tiền`.
  - [x] Tổng tiền đơn hàng (VND).
- [x] **Thao tác Hủy đơn hàng nguyên tử (`voidOrder`):**
  - [x] Hộp thoại xác nhận hủy đơn cảnh báo rõ ràng.
  - [x] Cập nhật trạng thái `status = 'VOIDED'`, ghi nhận `voidedAt` và `voidedBy = 'ADMIN'`.
  - [x] **Tự động hoàn lại số lượng tồn kho** cho các món có `trackStock == true` trong đơn.
  - [x] **Tự động giảm trừ doanh thu và số đơn** trong `daily_summaries/{order.dateString}`.
- [x] **Thao tác Khôi phục đơn hàng nguyên tử (`restoreOrder`):**
  - [x] Đưa trạng thái về `status = 'ACTIVE'`, xóa thông tin `voidedAt`.
  - [x] **Tự động trừ lại tồn kho** các món tương ứng.
  - [x] **Tự động cộng lại doanh thu và số đơn** vào `daily_summaries/{order.dateString}`.

---

## 6. SỔ CHI TIỀN & NHẬP HÀNG (`/expenses`)

- [x] Xem danh sách các khoản chi tiêu trong ngày hoặc theo tháng.
- [x] Phân biệt rõ ràng 2 nhóm:
  - Phiếu chi Nhập hàng bán (`RESTOCK` - có số lượng lon quy đổi cộng vào kho).
  - Phiếu chi Đồ dùng quán (`SUPPLIES` / `OTHER` - mua đá, mua ly túi, chi khác).
- [x] Thêm phiếu chi trực tiếp từ Web Admin.

---

## 7. BÁO CÁO THỐNG KÊ DOANH THU & LỢI NHUẬN (`/reports`)

- [x] **Bộ chọn tháng báo cáo (`YYYY-MM`):** Mặc định tháng hiện tại.
- [x] **Các thẻ tổng kết toàn tháng:**
  - [x] Tổng doanh thu tháng (tổng các `totalRevenue` của các ngày).
  - [x] Tổng chi phí tháng (tổng các `totalExpense`).
  - [x] **Lợi nhuận ròng tháng** (`Doanh thu - Chi phí`).
  - [x] Tổng số đơn hàng bán ra trong tháng.
- [x] **Bảng sao kê chi tiết từng ngày trong tháng:**
  - [x] Cột: Ngày, Doanh thu, Chi phí, Dòng tiền còn lại (Bán - Chi), Số đơn.
- [x] **Nút Đối soát / Tính lại ngày (`recalculateDay`):** Cho phép Admin quét lại toàn bộ dữ liệu đơn hàng và chi phí của 1 ngày bất kỳ để đồng bộ lại `daily_summaries` nếu phát hiện có sai lệch.

---

## 8. XUẤT BÁO CÁO CSV / EXCEL (`/export`)

- [x] Chọn tháng cần xuất báo cáo.
- [x] **Xuất CSV Danh sách đơn hàng:**
  - Cột: Mã Đơn, Ngày Bán, Loại Đơn, Tổng Tiền (VND), Trạng Thái, Chi Tiết Món.
- [x] **Xuất CSV Danh sách phiếu chi:**
  - Cột: Mã Phiếu Chi, Ngày Chi, Loại Chi, Khoản Mục, Số Tiền (VND), Ghi Chú.
- [x] **Yêu cầu kỹ thuật:** File CSV có gắn mã BOM UTF-8 (`\uFEFF`) để khi mở bằng Microsoft Excel tiếng Việt không bao giờ bị lỗi font chữ. Hỗ trợ nút tải file trực tiếp và nút sao chép vào Clipboard.

---

## 9. QUẢN LÝ PHÂN QUYỀN & CẤP TÀI KHOẢN (`/staff`)

- [x] Hiển thị danh sách các tài khoản đang hoạt động (`admin@quanlycf.com`, `post@quanlycf.com`...).
- [x] **Form cấp tài khoản mới an toàn:**
  - Nhập Email & Mật khẩu mới (ít nhất 6 ký tự).
  - Chọn phân quyền vai trò: `Quản trị viên (Admin)` hoặc `Thu ngân POS (Ba Mẹ)`.
  - Sử dụng instance Firebase thứ hai (`initializeApp(config, "secondary")`) để tạo user mà **không làm mất phiên đăng nhập của Admin hiện tại**.

---

## 10. TỐI ƯU HIỆU NĂNG & PWA (PERFORMANCE & PWA)

- [x] Giao diện Responsive chuẩn Apple Bento: Tối ưu hoàn hảo cho iPhone (Safari) và Desktop Laptop.
- [x] Hỗ trợ PWA (`vite-plugin-pwa`): Cài đặt "Thêm vào Màn hình chính" trên iPhone như một ứng dụng độc lập.
- [x] Dung lượng bundle JS lần đầu ≤ 250KB gzip (thực tế: ~86KB gzip).
- [x] Tách code lazy-load cho các route nặng (Biểu đồ Recharts, Xuất CSV).
- [x] Đạt điểm Lighthouse Mobile Performance ≥ 90.
- [x] Deploy song song lên Firebase Hosting với chi phí **0đ/tháng**.
