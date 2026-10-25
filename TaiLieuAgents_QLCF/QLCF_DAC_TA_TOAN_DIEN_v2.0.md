# ĐẶC TẢ THIẾT KẾ & TRIỂN KHAI TOÀN DIỆN v2.0
## HỆ THỐNG QUẢN LÝ QUÁN CÀ PHÊ GIA ĐÌNH (PM_QuanLyQuanCF)

**Dành cho:** AI Coding Agent & Đội ngũ phát triển triển khai mã nguồn  
**Phiên bản:** 2.0.0 (Bản tổng hợp chính thức duy nhất, thay thế toàn bộ các bản thiết kế trước)  
**Trạng thái phê duyệt:** Đã thống nhất giải pháp Cloudinary (Lưu ảnh URL tối ưu, 0đ, không cần thẻ tín dụng) + Firebase Spark (Firestore, Auth, Hosting)

---

## 1. TỔNG QUAN BỐI CẢNH & YÊU CẦU NGƯỜI DÙNG

### 1.1. Bối cảnh vận hành thực tế
- Mô hình kinh doanh: Quán cà phê gia đình phục vụ hai hình thức song song: **Uống tại chỗ** và **Mang đi (Take-away)**.
- **Đối tượng vận hành chính (Ba mẹ):**
  - Độ tuổi: 40 – 60 tuổi.
  - Trình độ công nghệ: Cơ bản, không thành thạo smartphone, thao tác ngón tay chậm, mắt bắt đầu viễn thị.
  - Tâm lý sử dụng: Sợ thao tác sai làm hỏng app, sợ bấm nhầm đơn, không thích đọc nhiều chữ nhỏ hay thao tác nhiều bước phức tạp.
- **Thiết bị tại quán (POS Device):**
  - Điện thoại Android đời cũ, RAM khiêm tốn (2GB – 3GB), CPU yếu.
  - **Yêu cầu sống còn:** Ứng dụng phải cực kỳ nhẹ (chiếm ít RAM, không dùng Base64 trong database gây giật CPU), khởi động tức thì, cuộn danh sách mượt mà (60fps), không bị tràn bộ nhớ gây văng app (OOM).
- **Người quản trị (Con cái - Admin):**
  - Sử dụng iPhone (iOS), cần setup danh mục, sản phẩm, hình ảnh, hai mức giá và theo dõi doanh thu từ xa.
  - **Ràng buộc chi phí: 0đ/tháng.** Không chi trả 99$/năm Apple Developer (sử dụng Web App/PWA trên Safari iPhone) và không cần thẻ thanh toán quốc tế cho các dịch vụ lưu trữ đám mây.

---

## 2. QUYẾT ĐỊNH KIẾN TRÚC ĐÃ CHỐT (CORE ARCHITECTURAL DECISIONS)

| # | Hạng mục | Quyết định kỹ thuật | Lý do & Giải pháp thực thi |
|---|---|---|---|
| **D1** | **Lưu trữ hình ảnh** | **Dùng Cloudinary (Free Tier)** qua URL tối ưu | Cloudinary miễn phí 25GB/tháng, **không yêu cầu thẻ tín dụng**. Tự động cắt vuông `300x300` và nén siêu nhẹ (`w_300,h_300,c_fill,q_auto,f_auto`). Điện thoại Android dùng `cached_network_image` tải 1 lần lưu vào ổ cứng, không tốn CPU giải mã Base64. |
| **D2** | **Cơ sở dữ liệu & Đồng bộ** | **Google Cloud Firestore (Spark Plan)** | Gói miễn phí vĩnh viễn (50k reads, 20k writes/ngày). Bật `persistenceEnabled: true` để lưu cache offline. Mất mạng vẫn bán hàng bình thường, có mạng tự đồng bộ ngầm. |
| **D3** | **Xác thực & Phân quyền** | **Firebase Auth + Custom Claims (`ADMIN` / `POS`)** | Phân quyền bảo mật ở tầng Firestore Security Rules. Máy ba mẹ chỉ cấp quyền `POS` (khóa toàn bộ chức năng sửa giá, sửa danh mục). Máy con cấp quyền `ADMIN`. |
| **D4** | **Cấu trúc mã nguồn** | **2 Entry Points riêng biệt:** `main_pos.dart` và `main_admin.dart` | Tách riêng file chạy: Bản APK của ba mẹ không bị phình to bởi code vẽ biểu đồ (`fl_chart`) hay code quản trị của Admin. |
| **D5** | **Giao diện bán hàng** | **Công tắc chế độ tại đỉnh màn hình (Cách 1)** | 2 nút lớn `[🏠 UỐNG TẠI QUÁN]` (xanh dương, mặc định) và `[🛵 MANG VỀ]` (cam). Chạm đổi 1 cái là toàn bộ giá trên các thẻ món tự nhảy sang biểu giá tương ứng. |
| **D6** | **Quy trình bán hàng** | **Xác nhận 2 bước an toàn (2-Step Review)** | Bước 1: Chạm thẻ món (+1 số lượng, phát tiếng "Tít" + rung nhẹ).<br>Bước 2: Bấm thanh ghim đáy sang màn hình "Xem lại đơn" (chữ to, kiểm tra lại món/tiền, nút +/- to) -> Bấm "Hoàn tất & Lưu" -> Chuông "Ting" -> Tự xóa giỏ và quay về ban đầu sau 1.5s. |
| **D7** | **Bỏ tính năng thối tiền** | **Không tính tiền thừa trên app** | Ba mẹ tự tính nhẩm hoặc khách chuyển khoản; loại bỏ các ô nhập tiền khách đưa để màn hình tối giản tối đa, chống rối mắt. |
| **D8** | **Quy đổi Thùng -> Lon** | **Thuộc tính `unitsPerCase` trong Product** | Khi ba mẹ nhập "1 thùng Sting", hệ thống tự động nhân với 24 để cộng 24 lon vào tồn kho và ghi nhận tiền chi. |
| **D9** | **Ghi dữ liệu an toàn khi Offline** | **Dùng WriteBatch + `FieldValue.increment()`** | **Không dùng Transaction** vì Transaction bắt buộc phải có mạng. Khi gọi `batch.commit()`, không dùng `await` để giao diện phản hồi ngay lập tức cho ba mẹ mà không bị xoay vòng tròn. |
| **D10** | **Bảo vệ giỏ hàng** | **Auto-save nháp vào `shared_preferences`** | Nếu hệ điều hành Android tự đóng app khi thiếu RAM, mở lại app sẽ tự khôi phục lại giỏ hàng đang chọn dở. |

---

## 3. SƠ ĐỒ LUỒNG DỮ LIỆU & KIẾN TRÚC HỆ THỐNG

```
[ CON CÁI (Admin trên iPhone) ]
       │
       ├─ (1) Upload ảnh món ăn ──► [ CLOUDINARY API ] ──► Trả về URL tối ưu
       │                                                         │
       ├─ (2) Nhập giá (Tại quán/Mang về)                        │
       │      Lưu món ăn kèm URL ảnh ────────────────────────┐   │
       │                                                     ▼   ▼
       └─ (3) Xem báo cáo doanh thu/lợi nhuận ◄──► [ GOOGLE FIRESTORE ]
                                                           ▲
                                                           │ (Đồng bộ ngầm khi có mạng)
                                                           ▼
[ BA MẸ (POS trên Android cũ) ]                   [ BỘ NHỚ LOCAL CACHE ]
       │                                                   │
       ├─ (A) Đọc Menu & Tải ảnh 1 lần ────────────────────┘
       ├─ (B) Bán hàng: [Tại quán] / [Mang về] ──► Lưu đơn offline ngay lập tức
       ├─ (C) Nhập hàng (Thùng/Lon) & Mua đồ ────► Cập nhật tồn kho & chi phí
       └─ (D) Xem sổ tiền hôm nay ───────────────► Đọc 1 document Daily Summary
```

---

## 4. QUY TẮC THIẾT KẾ UX/UI CHUYÊN BIỆT CHO NGƯỜI LỚN TUỔI

### 4.1. Quy chuẩn thị giác (Visual Accessibility)
* **Kích thước chữ (Typography):**
  - Tên món ăn/nước uống: Font chữ không chân in hoa, đậm (Bold), **tối thiểu 20sp**.
  - Giá tiền hiển thị trên thẻ món: **22sp – 24sp**, luôn có dấu chấm ngăn cách hàng nghìn và ký hiệu `đ` rõ ràng (Ví dụ: `15.000 đ`, tuyệt đối cấm hiển thị dạng `15k` hay `15000`).
  - Dòng tổng tiền thanh toán: Kích thước khổng lồ **28sp – 32sp**, màu xanh lá cây hoặc đỏ nổi bật.
  - **Đảm bảo khả năng co giãn:** Ứng dụng phải hoạt động bình thường, không tràn chữ hay che mất nút khi người dùng bật chế độ "Phóng to cỡ chữ hệ thống" từ 1.3x đến 1.5x trên Android.
* **Màu sắc tương phản cao (High Contrast):**
  - Nền ứng dụng: Trắng sứ (`#F8F9FA`), chữ màu đen than (`#1A1A1A`) đạt độ tương phản tối đa.
  - **Xanh lá cây (`#2E7D32`):** Nút thanh toán, nút lưu đơn, chỉ báo "Đã lưu lên mạng".
  - **Cam đậm (`#E65100`):** Nút chế độ "Mang về", nút ghi chi tiền (độ tương phản 3.8:1, chỉ dùng kèm chữ in đậm ≥ 20sp).
  - **Xanh dương (`#1565C0`):** Nút chế độ "Uống tại quán" (độ tương phản 5.8:1).
  - **Đỏ (`#C62828`):** Nút hủy đơn, nút xóa món, cảnh báo lỗi.

### 4.2. Quy chuẩn tương tác (Interaction Principles)
* **Quy tắc "Một chạm" (Single Tap Only):**
  - Tuyệt đối KHÔNG sử dụng: Vuốt ngang (swipe), nhấn giữ (long press), kéo thả (drag & drop), chụm 2 ngón tay phóng to thu nhỏ.
  - Vùng chạm tối thiểu (Touch Target): **≥ 48x48 dp**; Thẻ sản phẩm đạt chiều cao **≥ 140 dp**.
* **Bàn phím số CASIO tự chế (`casio_keypad.dart`):**
  - Khi cần nhập số lượng hoặc số tiền, app hiển thị bàn phím số riêng chiếm 1/2 màn hình.
  - Phím bấm khổng lồ: `0 – 9`, nút `000` (nhập nhanh hàng nghìn), nút `⌫` (xóa lùi), và nút `ĐỒNG Ý` màu xanh lá.
  - Định dạng số tiền trực tiếp khi đang gõ (nhập `20` -> hiện `20.000 đ`).
* **Phản hồi xúc giác & Âm thanh (Feedback):**
  - Chạm chọn món: Rung nhẹ (`HapticFeedback.lightImpact()`) + âm thanh *"Tít"* ngắn (được nạp sẵn vào bộ nhớ bằng `audioplayers` chế độ low-latency).
  - Lưu đơn thành công: Âm thanh *"Ting"* vang nhẹ + biểu tượng dấu tích xanh to toàn màn hình.
* **Chống tắt màn hình:** Tích hợp `wakelock_plus` để giữ màn hình điện thoại luôn sáng khi đang ở màn hình bán hàng.

---

## 5. ĐẶC TẢ CHI TIẾT CÁC MÀN HÌNH & LUỒNG NGHIỆP VỤ (POS - ANDROID)

### 5.1. Màn hình chính POS (Home Screen)
Hiển thị đúng **3 nút hành động khổng lồ** chiếm trọn màn hình:
1. `[ ☕ BÁN HÀNG ]` (Màu xanh lá cây)
2. `[ 📦 CHI TIỀN / MUA HÀNG ]` (Màu cam đậm)
3. `[ 💵 SỔ TIỀN HÔM NAY ]` (Màu xanh dương)

*Góc trên bên phải màn hình:* Hiển thị chỉ báo đồng bộ mạng tinh tế (không dùng popup):
- `✔ Đã lưu lên mạng` (Màu xanh) khi toàn bộ dữ liệu đã được đẩy lên Firestore.
- `⏳ Đang chờ mạng` (Màu cam) khi có đơn hàng/phiếu chi chưa kịp đồng bộ (`hasPendingWrites == true`).

*Nếu có đơn hàng vừa tạo trong vòng 10 phút:* Hiển thị thêm nút phụ viền đỏ phía dưới: `[ ↩ HỦY ĐƠN VỪA BÁN ]`.

---

### 5.2. Màn hình Bán hàng (2 bước)

#### Bước 1: Chọn món
- **Đỉnh màn hình:** 2 nút công tắc lớn:
  - `[ 🏠 UỐNG TẠI QUÁN ]` (Nền xanh dương - Mặc định).
  - `[ 🛵 MANG VỀ ]` (Nền cam).
  - Chạm vào nút nào thì giá niêm yết trên các thẻ món tự cập nhật theo chế độ đó. Cả 2 chế độ (Tại quán và Mang về) đồng bộ hoàn toàn cùng danh mục và sản phẩm, chỉ khác thông tin đơn giá và chi tiết món.
- **Danh mục:** Các thẻ chip danh mục tự động xuống dòng (Wrap layout), bao gồm 3 nhóm chính: `NƯỚC TỰ PHA`, `NƯỚC NGỌT`, `MÍA / CAM / DỪA` (không giới hạn, Admin có thể thêm/sửa/xóa tùy ý), không cuộn ngang.
- **Lưới sản phẩm:** Chia 2 cột, thẻ sản phẩm cao tối thiểu 140dp. Ảnh sản phẩm vuông 1:1 tải qua URL Cloudinary (đã được cache).
- **Thao tác chọn:** Chạm vào thẻ sản phẩm -> Số lượng trên góc thẻ nhảy lên `1`, `2`, `3`... kèm âm thanh "Tít".
- **Thanh ghim đáy (Sticky Bottom Bar):** Nền xanh lá đậm, chữ trắng khổng lồ:  
  👉 **`XEM ĐƠN (3 món) — 39.000 đ`**

#### Bước 2: Xem lại đơn & Lưu (Review Screen)
- Khi ba mẹ bấm vào thanh ghim đáy, màn hình chuyển sang giao diện xem lại đơn:
  - Danh sách các món đã chọn hiển thị to rõ.
  - Cạnh mỗi món có nút `[+]` và `[-]` kích thước 64x64dp để tăng giảm số lượng, hoặc nút `XÓA` màu đỏ.
  - Chữ hiển thị tổng tiền cực to: **TỔNG CỘNG: 39.000 Đ**.
  - Nút bấm khổng lồ chiếm toàn chiều ngang: **`[ HOÀN TẤT & LƯU ĐƠN ]`**.
- **Xử lý khi bấm nút:**
  - Nút bị vô hiệu hóa ngay tức thì để chống bấm đúp (chống tạo 2 đơn trùng lặp).
  - Khởi tạo `orderId` từ trước, thực hiện `WriteBatch`:
    - Tạo document trong `orders`.
    - Trừ tồn kho sản phẩm bằng `FieldValue.increment(-quantity)`.
    - Cập nhật doanh thu ngày vào `daily_summaries` bằng `FieldValue.increment(totalAmount)`.
  - Gọi `batch.commit()` (không dùng `await` để giao diện phản hồi tức thì mà không cần mạng).
  - Hiện biểu tượng tích xanh to + phát tiếng "Ting" thành công.
  - Tự động xóa giỏ hàng và quay về Bước 1 sau 1.5 giây.
- **Lưu ý:** Nếu tồn kho của món ≤ 0, hệ thống **vẫn cho phép bán bình thường** (để không làm gián đoạn ba mẹ bán hàng, Admin sẽ nhận cảnh báo tồn kho âm để kiểm tra sau).

---

### 5.3. Màn hình Chi tiền & Mua hàng (Expense & Restock Flow)
Bao gồm 2 thẻ lựa chọn lớn:

#### Thẻ 1: "NHẬP THÊM HÀNG BÁN" (Quản lý tồn kho)
1. Ba mẹ chạm chọn món có sẵn (Ví dụ: *Lon Sting dâu*).
2. Nếu món có thiết lập `unitsPerCase` (Ví dụ = 24), màn hình hiện 2 nút to: `[ LON ]` hoặc `[ THÙNG ]`.
3. Bàn phím CASIO hiện lên: Ba mẹ nhập số lượng (Ví dụ: `1` Thùng) -> Tiếp tục nhập số tiền đã trả cho đại lý (Ví dụ: `180.000 đ`).
4. **Màn hình xác nhận lớn [P0]:** Chữ to rõ: *"Nhập 1 THÙNG (24 lon) Sting dâu - Hết 180.000 đ. Đúng không?"*.
5. Bấm `[ ĐÚNG, LƯU ]` -> Hệ thống tự động:
   - Cộng tồn kho: `stockQuantity = stockQuantity + 24`.
   - Ghi nhận 1 phiếu chi vào `expenses` với `amount = 180.000 đ`.
   - Cập nhật tổng chi ngày vào `daily_summaries`.

#### Thẻ 2: "MUA ĐỒ DÙNG CHO QUÁN" (Chi phí vận hành)
1. Chạm 1 nút trong danh sách có sẵn (từ `expense_categories`):
   - `[ Mua Đá Lạnh ]`
   - `[ Mua Ly / Ống Hút / Túi Xách ]`
   - `[ Mua Chanh / Tắc / Đường ]`
   - `[ Chi Khác... ]`
2. Bàn phím CASIO hiện lên: Nhập số tiền (Ví dụ: `20.000 đ`).
3. Màn hình xác nhận lớn: *"Chi 20.000 đ cho Mua Đá Lạnh. Đúng không?"* (Nếu số tiền ≥ 1.000.000 đ sẽ có cảnh báo chữ đỏ *"Số tiền lớn, hãy kiểm tra kỹ số 0"*).
4. Bấm `[ ĐÚNG, LƯU ]` -> Ghi nhận phiếu chi và cập nhật tổng chi ngày.

---

### 5.4. Màn hình Sổ Tiền Hôm Nay
Đọc duy nhất 1 document `daily_summaries/{YYYY-MM-DD}` (siêu nhẹ và tiết kiệm hạn ngạch Firestore):
```
+-----------------------------------------------+
|               SỔ TIỀN HÔM NAY                 |
|                                               |
|   [+] TIỀN BÁN ĐƯỢC:         + 650.000 đ     |
|   [-] TIỀN ĐÃ CHI:           - 200.000 đ     |
|   -----------------------------------------   |
|   (=) CÒN LẠI (BÁN − CHI):     450.000 đ     |
+-----------------------------------------------+
```
*(Ghi chú: Nhãn hiển thị chính xác là "CÒN LẠI (BÁN − CHI)", không dùng chữ "Tiền trong két" vì chưa tính tiền vốn đầu ngày hay tiền khách chuyển khoản).*

---

## 6. ĐẶC TẢ CHI TIẾT MÀN HÌNH QUẢN TRỊ (ADMIN - iOS / WEB PWA)

Triển khai bằng Flutter Web, deploy lên **Firebase Hosting**. Sử dụng Safari trên iPhone chọn *"Thêm vào MH chính"*.

### 6.1. Toàn quyền Quản lý Danh mục & Sản phẩm (Full CRUD) trên iPhone
Admin có toàn quyền quản trị từ xa:
- **Quản lý Danh mục (Category CRUD):**
  - Thêm, sửa tên, đổi icon, xóa danh mục.
  - Ba nhóm danh mục mặc định: `NƯỚC TỰ PHA`, `NƯỚC NGỌT`, `MÍA / CAM / DỪA`.
- **Quản lý Sản phẩm (Product CRUD & Dual Pricing):**
  - Thêm món mới, sửa món, xóa món (xóa mềm).
  - Tên món, icon đại diện, chọn danh mục.
  - **Đồng bộ 2 mục Uống tại quán và Mang về:** Cả hai chế độ đều hiển thị chung danh mục và danh sách sản phẩm, nhưng Admin cấu hình chi tiết riêng:
    - **Giá Uống tại quán** (Ví dụ: `15.000 đ`).
    - **Giá Mang về** (Ví dụ: `17.000 đ`).
  - Đơn vị tính (`ly`, `lon`, `trái`, `chai`...).
  - Quy đổi thùng (`unitsPerCase`, ví dụ: `24` lon/thùng cho nước ngọt).
  - Tồn kho ban đầu và ngưỡng cảnh báo tồn kho thấp.
- **Cơ chế Upload ảnh Cloudinary:**
  - Chọn ảnh từ thư viện iPhone.
  - Gửi HTTP POST Multipart trực tiếp lên Cloudinary API thông qua **Unsigned Upload Preset** (cấu hình sẵn thư mục `pm_quanlyquancf` trên Cloudinary).
  - Nhận về `public_id` hoặc URL ảnh.
  - Tạo URL chuẩn với bộ lọc tự động:  
    `https://res.cloudinary.com/<cloud_name>/image/upload/w_300,h_300,c_fill,q_auto,f_auto/<public_id>.jpg`
  - Lưu URL này vào trường `imageUrl` của sản phẩm trong Firestore.
  - **Không dùng collection `product_images`**, không lưu Base64 vào Firestore.

### 6.2. Báo cáo Doanh thu & Quản lý Đơn hàng
- Báo cáo theo Ngày / Tuần / Tháng / Năm truy vấn từ `daily_summaries`.
- Báo cáo tháng: Hiển thị Tổng doanh thu, Tổng chi phí, Chênh lệch dòng tiền và bảng đối soát từng ngày.
- Danh sách đơn hàng trong ngày: Xem chi tiết từng món đã bán, thời gian bán, hình thức bán (Tại quán/Mang về).
- **Quyền Hủy & Khôi phục đơn:** Admin có quyền hủy mọi đơn hàng sai lệch và khôi phục lại khi cần (hệ thống tự động đảo ngược tồn kho và cập nhật lại `daily_summaries`).
- **Nút "Tính lại tổng kết" [P1]:** Quét lại toàn bộ orders và expenses có trạng thái `ACTIVE` trong ngày để tính lại `daily_summaries` nếu có sự sai lệch.
- **Xuất dữ liệu CSV theo tháng [P1]:** Cho phép tải file CSV danh sách đơn hàng và phiếu chi để lưu trữ dự phòng ra máy tính.

---

## 7. THIẾT KẾ CƠ SỞ DỮ LIỆU (FIRESTORE SCHEMA v2.0)

Quy ước chuẩn:
- Mọi đơn vị tiền tệ là **số nguyên VND** (kiểu `int`).
- Ngày giờ máy chủ dùng **`FieldValue.serverTimestamp()`**.
- `dateString` (`YYYY-MM-DD`) và `monthString` (`YYYY-MM`) được tính độc lập theo múi giờ **Việt Nam (UTC+7)** từ UTC để tránh sai lệch khi đồng hồ điện thoại bị chỉnh sai:  
  `DateTime.now().toUtc().add(const Duration(hours: 7))`.
- ID tài liệu của `orders`, `expenses` dùng **auto-ID** của Firestore.
- Xóa dữ liệu luôn là **xóa mềm** (`isActive = false` hoặc `status = 'VOIDED'`).

### 7.1. Collection: `categories`
```json
{
  "id": "cat_tu_pha",
  "name": "NƯỚC TỰ PHA",
  "icon": "☕",
  "orderIndex": 1,
  "isActive": true
}
```
*Seed ban đầu:* `NƯỚC TỰ PHA` (☕), `NƯỚC NGỌT` (🥫), `MÍA / CAM / DỪA` (🎋), `THUỐC LÁ` (🚬). Admin có toàn quyền thêm, sửa, xóa và các sản phẩm trên màn hình Admin được gom nhóm trực quan theo từng danh mục này.

### 7.2. Collection: `products`
```json
{
  "id": "prod_sting_dau",
  "name": "STING DÂU",
  "categoryId": "cat_nuoc_ngot",
  "imageUrl": "https://res.cloudinary.com/qlcf/image/upload/w_300,h_300,c_fill,q_auto,f_auto/sting.jpg",
  "priceDineIn": 12000,
  "priceTakeAway": 12000,
  "stockQuantity": 48,
  "unit": "lon",
  "unitsPerCase": 24,
  "trackStock": true,
  "lowStockAt": 5,
  "sortOrder": 1,
  "isActive": true,
  "updatedAt": "<serverTimestamp>"
}
```
*(Ghi chú đặc biệt cho trường `trackStock`: Mặc định là `true` (có trừ tồn kho). Riêng món **"THUỐC JET (ĐIẾU)"** thuộc danh mục Thuốc lá, giá 2.000 đ/điếu, có trường `trackStock: false` — khi bán món này hệ thống **không trừ tồn kho**, chỉ cộng tiền vào đơn hàng cho khách mua lẻ).*

### 7.3. Collection: `orders`
```json
{
  "id": "ord_auto_generated_id",
  "orderType": "DINE_IN", 
  "items": [
    {
      "productId": "prod_sting_dau",
      "name": "STING DÂU",
      "price": 12000,
      "quantity": 2,
      "subtotal": 24000
    },
    {
      "productId": "prod_cf_sua",
      "name": "CÀ PHÊ SỮA",
      "price": 15000,
      "quantity": 1,
      "subtotal": 15000
    }
  ],
  "totalAmount": 39000,
  "status": "ACTIVE",
  "voidedAt": null,
  "voidedBy": null,
  "dateString": "2026-10-25",
  "monthString": "2026-10",
  "createdAt": "<serverTimestamp>",
  "createdBy": "<uid_pos>"
}
```

### 7.4. Collection: `expenses`
```json
{
  "id": "exp_auto_generated_id",
  "expenseType": "RESTOCK", 
  "categoryName": "Nhập hàng bán",
  "productId": "prod_sting_dau",
  "productName": "STING DÂU",
  "quantity": 24,
  "amount": 180000,
  "note": "Nhập 1 thùng 24 lon",
  "status": "ACTIVE",
  "dateString": "2026-10-25",
  "monthString": "2026-10",
  "createdAt": "<serverTimestamp>",
  "createdBy": "<uid_pos>"
}
```

### 7.5. Collection: `expense_categories` (Nút chọn 1 chạm cho chi đồ dùng)
```json
{
  "id": "exp_da",
  "name": "Mua Đá Lạnh",
  "orderIndex": 1,
  "isActive": true
}
```
*Seed ban đầu:* `Mua Đá Lạnh`, `Mua Ly / Ống Hút / Túi Xách`, `Mua Chanh / Tắc / Đường`, `Chi Khác...`.

### 7.6. Collection: `daily_summaries` (Doc ID = YYYY-MM-DD)
```json
{
  "totalRevenue": 650000,
  "totalExpense": 200000,
  "totalOrders": 28,
  "dateString": "2026-10-25",
  "monthString": "2026-10",
  "lastUpdated": "<serverTimestamp>"
}
```
*(Ghi chú: Không lưu trường `netCash`, giá trị còn lại tính trực tiếp khi hiển thị = `totalRevenue - totalExpense`).*

---

## 8. BẢO MẬT & FIRESTORE SECURITY RULES

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    function signedIn() { return request.auth != null; }
    function isAdmin()  { return signedIn() && request.auth.token.role == 'ADMIN'; }
    function isPos()    { return signedIn() && request.auth.token.role == 'POS'; }

    // Danh mục & loại chi phí: Mọi tài khoản đăng nhập đều được đọc, chỉ Admin được sửa
    match /categories/{id}         { allow read: if signedIn(); allow write: if isAdmin(); }
    match /expense_categories/{id} { allow read: if signedIn(); allow write: if isAdmin(); }

    // Sản phẩm: POS chỉ được cập nhật số lượng tồn kho (stockQuantity) và updatedAt
    match /products/{id} {
      allow read: if signedIn();
      allow create, delete: if isAdmin();
      allow update: if isAdmin() || (isPos() &&
        request.resource.data.diff(resource.data).affectedKeys().hasOnly(['stockQuantity', 'updatedAt']));
    }

    // Đơn hàng: Cho phép POS và Admin tạo đơn
    // POS chỉ được hủy đơn do chính mình tạo trong vòng 10 phút đầu tiên
    match /orders/{id} {
      allow read: if signedIn();
      allow create: if signedIn();
      allow update: if isAdmin() || (isPos()
        && resource.data.createdBy == request.auth.uid
        && request.time < resource.data.createdAt + duration.value(10, 'm')
        && request.resource.data.status == 'VOIDED'
        && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['status', 'voidedAt', 'voidedBy']));
      allow delete: if false; // Không cho phép xóa cứng
    }

    // Khoản chi: Cho phép tạo, cấm xóa cứng
    match /expenses/{id} {
      allow read: if signedIn();
      allow create: if signedIn();
      allow update: if isAdmin();
      allow delete: if false;
    }

    // Tổng kết ngày: Cả Admin và POS đều được đọc và cập nhật (thông qua batch increment)
    match /daily_summaries/{day} {
      allow read, write: if signedIn();
    }
  }
}
```

---

## 9. QUY TẮC MÃ NGUỒN GHI DỮ LIỆU AN TOÀN KHI MẤT MẠNG (OFFLINE-SAFE)

```dart
// Code mẫu ghi đơn hàng Offline-Safe trong Repository
Future<void> submitOrder({
  required String orderId,
  required Map<String, dynamic> orderData,
  required List<OrderItem> items,
  required int totalAmount,
  required String dateString,
  required String monthString,
}) async {
  final db = FirebaseFirestore.instance;
  final batch = db.batch();

  // 1. Tạo document đơn hàng
  final orderRef = db.collection('orders').doc(orderId);
  batch.set(orderRef, orderData);

  // 2. Trừ tồn kho từng sản phẩm (Chỉ trừ nếu trackStock == true, bỏ qua món bán lẻ như Thuốc Jet điếu)
  for (final item in items) {
    if (item.trackStock) {
      final productRef = db.collection('products').doc(item.productId);
      batch.update(productRef, {
        'stockQuantity': FieldValue.increment(-item.quantity),
        'updatedAt': FieldValue.serverTimestamp(),
      });
    }
  }

  // 3. Cập nhật tổng kết ngày
  final summaryRef = db.collection('daily_summaries').doc(dateString);
  batch.set(summaryRef, {
    'totalRevenue': FieldValue.increment(totalAmount),
    'totalOrders': FieldValue.increment(1),
    'dateString': dateString,
    'monthString': monthString,
    'lastUpdated': FieldValue.serverTimestamp(),
  }, SetOptions(merge: true));

  // 4. Commit ngầm - TUYỆT ĐỐI KHÔNG DÙNG await ĐỂ TRÁNH TREO UI KHI MẤT MẠNG
  unawaited(batch.commit().catchError((error) {
    // Ghi log lỗi nội bộ nếu có
  }));
}
```

---

## 10. CẤU TRÚC THƯ MỤC DỰ ÁN FLUTTER HOÀN CHỈNH

```
PM_QuanLyQuanCF/
├── android/                             # Cấu hình Native Android (Build APK cho ba mẹ)
├── web/                                 # Cấu hình Web PWA (Deploy Hosting cho iPhone)
├── assets/
│   ├── images/                          # Ảnh mặc định placeholder
│   └── sounds/                          # beep.mp3, success.mp3
├── firestore.rules                      # File cấu hình bảo mật Firestore
├── firestore.indexes.json               # Cấu hình composite indexes
├── firebase.json                        # Cấu hình Firebase Hosting & Emulators
├── tools/
│   └── set_role.js                      # Script Node.js gán claim ADMIN/POS (chạy 1 lần)
├── test/
│   └── unit/                            # Thư mục chứa toàn bộ Unit Tests logic lõi
│       ├── money_format_test.dart
│       ├── vn_date_test.dart
│       ├── units_conversion_test.dart
│       ├── order_calculation_test.dart
│       └── summary_calculation_test.dart
└── lib/
    ├── main_pos.dart                    # Entry point cho điện thoại Android của ba mẹ
    ├── main_admin.dart                  # Entry point cho Web Dashboard trên iPhone
    ├── core/
    │   ├── theme/                       # Theme chữ to (Senior Theme), màu tương phản cao
    │   ├── constants/                   # Hằng số màu sắc, chuỗi UI tiếng Việt
    │   └── utils/
    │       ├── money_format.dart        # Định dạng tiền tệ VND (dấu chấm ngăn nghìn)
    │       ├── vn_date.dart             # Xử lý ngày giờ chuẩn Việt Nam (UTC+7)
    │       ├── units_conversion.dart    # Quy đổi thùng -> lon
    │       └── order_calculator.dart    # Tính toán tiền đơn hàng & tồn kho
    ├── data/
    │   ├── models/                      # Category, Product, Order, Expense, DailySummary
    │   └── repositories/                # product_repo, order_repo, expense_repo, summary_repo, auth_repo, cloudinary_repo
    ├── services/
    │   ├── audio_service.dart           # Phát âm thanh phản hồi low-latency
    │   └── storage_cache_service.dart   # Quản lý cache ảnh trên bộ nhớ máy
    └── features/
        ├── pos/                         # Toàn bộ giao diện cho Ba mẹ
        │   ├── pos_home_screen.dart     # 3 nút lớn + chỉ báo đồng bộ
        │   ├── sales_screen.dart        # Chọn món + Toggle Tại quán/Mang về
        │   ├── order_review_screen.dart # Xem lại đơn và hoàn tất
        │   ├── expense_screen.dart      # Nhập hàng & Chi phí quán
        │   ├── daily_summary_screen.dart# Sổ tiền hôm nay
        │   └── widgets/
        │       ├── product_card.dart    # Thẻ sản phẩm chữ to, ảnh vuông Cloudinary
        │       ├── casio_keypad.dart    # Bàn phím số to CASIO
        │       └── sync_indicator.dart  # Icon chỉ báo đồng bộ mạng
        └── admin/                       # Toàn bộ giao diện cho Con
            ├── admin_dashboard.dart     # Tổng quan & điều hướng
            ├── product_manager.dart     # Quản lý món, 2 giá, upload Cloudinary
            ├── category_manager.dart    # Quản lý danh mục
            ├── orders_history.dart      # Lịch sử đơn & Hủy/Khôi phục đơn
            ├── reports_screen.dart      # Báo cáo ngày/tuần/tháng/năm
            └── export_csv_screen.dart   # Xuất file CSV dự phòng
```

---

## 11. BẢNG TIÊU CHÍ NGHIỆM THU CHẤT LƯỢNG (ACCEPTANCE CRITERIA)

1. **Hiệu năng máy cũ:**
   - App POS mở lên dưới 2.5 giây trên máy Android RAM 2GB.
   - Thao tác cuộn danh sách món ăn đạt tốc độ khung hình mượt mà, không bị giật hay tràn bộ nhớ RAM do ảnh.
2. **Khả năng chạy ngoại tuyến (Offline):**
   - Bật chế độ máy bay: Bán 5 đơn hàng và tạo 2 phiếu chi -> Màn hình vẫn thông báo thành công tức thì, không bị đứng hay xoay vòng tròn.
   - Chỉ báo mạng chuyển sang `⏳ Đang chờ mạng`. Thoát hẳn app và mở lại -> Dữ liệu bán hàng vẫn còn nguyên vẹn.
   - Bật Wi-Fi lại -> Chỉ báo chuyển sang `✔ Đã lưu lên mạng`, dữ liệu trên Firestore nhảy đúng số liệu ngay lập tức.
3. **Quy đổi Thùng -> Lon:** Nhập "1 thùng Sting" (quy định 24 lon/thùng) -> Tồn kho tăng chính xác 24 lon.
4. **An toàn dữ liệu:** Bấm đúp liên tiếp vào nút "HOÀN TẤT & LƯU ĐƠN" -> Hệ thống chỉ tạo đúng **1 đơn hàng duy nhất**, không trừ kho 2 lần.
5. **Giao diện người lớn tuổi:**
   - Kích hoạt cỡ chữ hệ thống 1.5x -> Không có nút nào bị đè, không có chữ nào bị mất nét.
   - Mọi giá tiền hiển thị đúng chuẩn `15.000 đ`.
