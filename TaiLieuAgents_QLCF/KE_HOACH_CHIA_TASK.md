# KẾ HOẠCH PHÂN CHIA NHIỆM VỤ (TASK BREAKDOWN)
## DỰ ÁN QUẢN LÝ QUÁN CÀ PHÊ GIA ĐÌNH (PM_QuanLyQuanCF)

**Căn cứ triển khai:** `QLCF_DAC_TA_TOAN_DIEN_v2.0.md`  
**Mục tiêu:** Chia nhỏ thành các Phase và Task độc lập, có thể thực thi tuần tự, dễ kiểm soát chất lượng, nghiệm thu rõ ràng.

---

## MA TRẬN ĐỘ ƯU TIÊN
- **[P0] Bắt buộc (Crucial):** Tính năng cốt lõi, không có không thể vận hành quán.
- **[P1] Nên có (High):** Giúp trải nghiệm mượt mà, chống sai sót, phục hồi dữ liệu.
- **[P2] Mở rộng (Optional):** Làm sau khi hệ thống đã chạy ổn định tại quán.

---

## BẢNG TỔNG HỢP CÁC PHASE

```
Phase 1: Khởi tạo & Cấu hình Nền tảng (Firebase, Cloudinary, Flutter)
   │
Phase 2: Xây dựng Lõi Nghiệp vụ (Core Utilities, Models, Repositories) & Unit Tests
   │
Phase 3: Phát triển Giao diện Bán hàng POS cho Ba Mẹ (Android APK)
   │
Phase 4: Tối ưu Ngoại tuyến (Offline-First) & Hiệu năng trên Android cũ
   │
Phase 5: Phát triển Giao diện Quản trị Admin cho Con (iPhone / Flutter Web)
   │
Phase 6: Kiểm thử Tổng thể, Nghiệm thu & Bàn giao thực tế tại quán
```

---

## CHI TIẾT TỪNG PHASE VÀ TASK

### PHASE 1: KHỞI TẠO NỀN TẢNG & BẢO MẬT

| Task ID | Tên công việc | Ưu tiên | Chi tiết thực hiện & Tiêu chí hoàn thành (DoD) |
|---|---|---|---|
| **TASK-1.1** | Khởi tạo dự án Flutter | **[P0]** | • Tạo Flutter project trong thư mục dự án.<br>• Thiết lập 2 entry point riêng: `lib/main_pos.dart` và `lib/main_admin.dart`.<br>• Cài đặt các package chuẩn: `cloud_firestore`, `firebase_core`, `firebase_auth`, `cached_network_image`, `audioplayers`, `wakelock_plus`, `shared_preferences`, `intl`, `http`. |
| **TASK-1.2** | Cấu hình Firebase & Firestore Security Rules | **[P0]** | • Tạo project trên Firebase Console (Gói Spark 0đ).<br>• Cấu hình Firestore và Authentication (Email/Password).<br>• Triển khai file `firestore.rules` (Mục 8 trong tài liệu đặc tả) để phân quyền: POS chỉ được cập nhật tồn kho, không được sửa giá hay xóa danh mục.<br>• Tạo file `firestore.indexes.json` cho các truy vấn đơn hàng theo ngày/tháng. |
| **TASK-1.3** | Cấu hình Cloudinary Media | **[P0]** | • Đăng ký tài khoản Cloudinary (Gói Free 25GB, không cần thẻ).<br>• Tạo một **Unsigned Upload Preset** (ví dụ tên: `qlcf_unsigned`) thư mục `pm_quanlyquancf`.<br>• Lưu `cloud_name` và `upload_preset` vào hằng số cấu hình. |
| **TASK-1.4** | Script phân quyền tài khoản (Custom Claims) | **[P0]** | • Viết script Node.js `tools/set_role.js` dùng Firebase Admin SDK để gán role `ADMIN` cho tài khoản của con và `POS` cho tài khoản của ba mẹ.<br>• Chạy script thử nghiệm và kiểm tra claim trong token. |

---

### PHASE 2: LÕI NGHIỆP VỤ & UNIT TESTING

| Task ID | Tên công việc | Ưu tiên | Chi tiết thực hiện & Tiêu chí hoàn thành (DoD) |
|---|---|---|---|
| **TASK-2.1** | Viết các Hàm Tiện ích Logic lõi (Core Utils) | **[P0]** | • `money_format.dart`: Định dạng số tiền `15.000 đ` có dấu chấm ngăn nghìn.<br>• `vn_date.dart`: Chuyển đổi timestamp sang `YYYY-MM-DD` và `YYYY-MM` theo giờ Việt Nam (UTC+7) chuẩn xác.<br>• `units_conversion.dart`: Quy đổi Thùng -> Lon theo hệ số `unitsPerCase`.<br>• `order_calculator.dart`: Tính tổng tiền món theo giá Tại quán / Mang về, tính tồn kho còn lại. |
| **TASK-2.2** | Xây dựng Bộ Unit Tests tự động | **[P0]** | • Tạo thư mục `test/unit/` chuẩn của Flutter/Dart.<br>• Viết và chạy thành công 100% các bài test cho 4 bộ tiện ích trên.<br>• Đảm bảo không có lỗi edge-case (số 0, số âm, đơn vị null, múi giờ đêm 23h30 - 00h30). |
| **TASK-2.3** | Xây dựng Data Models | **[P0]** | • Tạo các class: `Category`, `Product`, `Order`, `OrderItem`, `Expense`, `DailySummary`.<br>• Model `Product` có thuộc tính `trackStock: bool` (mặc định `true`, riêng món bán lẻ như *Thuốc Jet điếu* là `false` để không trừ kho).<br>• Seed dữ liệu 4 danh mục chính: `NƯỚC TỰ PHA`, `NƯỚC NGỌT`, `MÍA / CAM / DỪA`, `THUỐC LÁ`.<br>• Viết hàm `fromFirestore()` và `toMap()` an toàn, có fallback mặc định. |
| **TASK-2.4** | Xây dựng Data Repositories | **[P0]** | • `ProductRepository`: Đọc danh mục, đọc sản phẩm, cache offline.<br>• `OrderRepository`: Tạo đơn bằng `WriteBatch + FieldValue.increment()`. Khi trừ tồn kho, kiểm tra `if (item.trackStock)` mới thực hiện trừ kho.<br>• `ExpenseRepository`: Ghi nhận phiếu chi nhập hàng và chi phí vận hành.<br>• `CloudinaryRepository`: Gửi HTTP POST upload ảnh lên Cloudinary và sinh URL chuẩn `w_300,h_300,c_fill,q_auto,f_auto`. |

---

### PHASE 3: GIAO DIỆN BÁN HÀNG CHO BA MẸ (POS - ANDROID)

| Task ID | Tên công việc | Ưu tiên | Chi tiết thực hiện & Tiêu chí hoàn thành (DoD) |
|---|---|---|---|
| **TASK-3.1** | Senior Design Theme & Audio Service | **[P0]** | • Xây dựng `SeniorTheme`: Nền trắng sứ `#F8F9FA`, chữ đen than `#1A1A1A`, cỡ chữ từ 18sp - 32sp.<br>• Tích hợp `audio_service.dart`: Nạp sẵn âm thanh *"Tít"* (chạm món) và *"Ting"* (lưu đơn thành công).<br>• Bật `wakelock_plus` để chống khóa màn hình khi đang bán. |
| **TASK-3.2** | Màn hình chính POS (Home Screen) | **[P0]** | • Hiển thị 3 nút bấm kích thước lớn: `[BÁN HÀNG]`, `[CHI TIỀN / MUA HÀNG]`, `[SỔ TIỀN HÔM NAY]`.<br>• Tích hợp thanh chỉ báo đồng bộ góc trên: `✔ Đã lưu lên mạng` / `⏳ Đang chờ mạng`.<br>• Nút `[HỦY ĐƠN VỪA BÁN]` (chỉ hiện khi có đơn tạo trong 10 phút gần nhất). |
| **TASK-3.3** | Màn hình Chọn món (Bước 1 Bán hàng) | **[P0]** | • Đỉnh màn hình: 2 nút lớn `[🏠 UỐNG TẠI QUÁN]` và `[🛵 MANG VỀ]` (Cách 1). Đồng bộ 100% danh mục & món ăn, chỉ nhảy giá tương ứng.<br>• Danh mục Wrap xuống dòng: `TẤT CẢ`, `NƯỚC TỰ PHA`, `NƯỚC NGỌT`, `MÍA / CAM / DỪA`, `THUỐC LÁ`.<br>• Món *Thuốc Jet (điếu)* có huy hiệu `Lẻ +2k`, giá 2.000 đ đồng giá, bán không trừ kho.<br>• Thẻ món ăn cao ≥ 140dp, ảnh vuông Cloudinary, tên món in hoa ≥ 20sp, giá ≥ 22sp.<br>• Chạm món: Tăng số lượng + phát tiếng "Tít" + rung nhẹ.<br>• Thanh ghim đáy: `XEM ĐƠN (X món) - Y đ` màu xanh lá to rõ. |
| **TASK-3.4** | Màn hình Xem lại đơn & Lưu (Bước 2) | **[P0]** | • Chỉ hiện các món khách vừa chọn, dòng tổng tiền khổng lồ 28sp - 32sp.<br>• Nút `[+]` và `[-]` to (≥ 64dp) để thêm bớt hoặc xóa món.<br>• Nút khổng lồ `[HOÀN TẤT & LƯU ĐƠN]`: Chống bấm đúp (disable ngay sau 1 chạm), gọi ghi đơn ngầm không await, hiện tích xanh to, phát tiếng "Ting", tự quay về bước 1 sau 1.5s. |
| **TASK-3.5** | Widget Bàn phím số to CASIO (`casio_keypad.dart`) | **[P0]** | • Thiết kế bàn phím số riêng chiếm 1/2 màn hình.<br>• Phím số `0-9`, phím `000`, phím `Xóa lùi ⌫`, phím `Đồng ý`.<br>• Tự động format dấu chấm phân cách hàng nghìn khi đang gõ. |
| **TASK-3.6** | Màn hình Chi tiền & Nhập hàng | **[P0]** | • 2 thẻ to: `NHẬP HÀNG BÁN` (chọn món, chọn Thùng/Lon, nhập số lượng + tiền) và `MUA ĐỒ DÙNG QUÁN` (chọn 1 chạm: Đá lạnh, Ly/Túi, Chanh đường... + nhập tiền).<br>• Màn hình xác nhận chữ lớn: *"Chi X đ cho Y. Đúng không?"* + cảnh báo số tiền lớn nếu ≥ 1.000.000 đ. |
| **TASK-3.7** | Màn hình Sổ tiền hôm nay | **[P0]** | • Đọc 1 document `daily_summaries/{YYYY-MM-DD}`.<br>• Hiển thị 3 dòng to: Tiền bán (+), Tiền chi (-), Còn lại (Bán - Chi). |

---

### PHASE 4: TỐI ƯU OFFLINE & HIỆU NĂNG MÁY ANDROID CŨ

| Task ID | Tên công việc | Ưu tiên | Chi tiết thực hiện & Tiêu chí hoàn thành (DoD) |
|---|---|---|---|
| **TASK-4.1** | Cấu hình Firestore Persistence | **[P0]** | • Bật `Settings(persistenceEnabled: true, cacheSizeBytes: Settings.CACHE_SIZE_UNLIMITED)` trên app Android.<br>• Tải toàn bộ danh mục và sản phẩm về cache trong lần mở app đầu tiên khi có mạng. |
| **TASK-4.2** | Tối ưu Cache Hình ảnh | **[P0]** | • Sử dụng `CachedNetworkImage` tải ảnh từ Cloudinary qua URL đã tối ưu.<br>• Lưu ảnh vào đĩa cứng điện thoại, không bao giờ tải lại ảnh cũ.<br>• Giữ `MemoryCache` thấp để không gây tràn RAM trên máy 2GB. |
| **TASK-4.3** | Lưu nháp giỏ hàng phòng ngừa văng app | **[P1]** | • Lưu giỏ hàng vào `shared_preferences` mỗi khi chạm món.<br>• Khi mở lại app, nếu có giỏ hàng chưa lưu thì tự động nạp lại. Chặn nút Back vật lý của điện thoại nếu giỏ chưa trống. |
| **TASK-4.4** | Thử nghiệm thực tế chế độ máy bay (Airplane Mode) | **[P0]** | • Bật chế độ máy bay: Bán 5 đơn + 2 phiếu chi -> Hoàn tất tức thì.<br>• Tắt app, mở lại -> Dữ liệu còn nguyên.<br>• Bật lại Wi-Fi -> Dữ liệu tự đồng bộ lên Firestore đầy đủ trong vòng 3 giây. |

---

### PHASE 5: GIAO DIỆN QUẢN TRỊ CHO CON (ADMIN - iOS / WEB PWA)

| Task ID | Tên công việc | Ưu tiên | Chi tiết thực hiện & Tiêu chí hoàn thành (DoD) |
|---|---|---|---|
| **TASK-5.1** | Màn hình Quản lý Sản phẩm (Full CRUD & Chia nhóm danh mục) | **[P0]** | • Danh sách sản phẩm của Admin được **gom nhóm trực quan theo từng danh mục** (Nước tự pha, Nước ngọt, Mía/Cam/Dừa, Thuốc lá) kèm số lượng món.<br>• Sửa thanh Sub-nav tabs không bị rớt dòng chữ.<br>• Form thêm/sửa món: Tên, danh mục, Giá tại quán, Giá mang về, Đơn vị tính, Quy đổi thùng (`unitsPerCase`), Checkbox `Quản lý trừ tồn kho` (bỏ chọn cho thuốc điếu lẻ).<br>• Chọn ảnh từ iPhone -> Upload lên Cloudinary -> Nhận URL tối ưu -> Lưu vào Firestore. |
| **TASK-5.2** | Màn hình Quản lý Danh mục (Full CRUD) & Loại chi | **[P0]** | • Quản lý danh mục món ăn (Thêm, Sửa tên/icon, Xóa danh mục).<br>• Quản lý các nút chi đồ dùng quán (Mua đá, mua ly...). |
| **TASK-5.3** | Màn hình Báo cáo Doanh thu & Lợi nhuận | **[P0]** | • Xem theo Ngày / Tuần / Tháng / Năm từ `daily_summaries`.<br>• Thống kê: Tổng doanh thu, Tổng chi phí, Chênh lệch dòng tiền, Danh sách chi tiết từng ngày. |
| **TASK-5.4** | Quản lý Lịch sử Đơn & Hủy/Khôi phục | **[P0]** | • Admin xem toàn bộ danh sách đơn hàng đã bán trong ngày.<br>• Nút "Hủy đơn" và "Khôi phục đơn" (hệ thống tự đảo ngược tồn kho và cập nhật doanh thu). |
| **TASK-5.5** | Tính lại tổng kết ngày & Xuất CSV | **[P1]** | • Nút "Tính lại ngày": Quét lại orders và expenses để tính lại `daily_summaries` nếu bị lệch.<br>• Xuất file CSV danh sách đơn và phiếu chi theo tháng để lưu trữ ngoại tuyến. |
| **TASK-5.6** | Build & Deploy Firebase Hosting (PWA) | **[P0]** | • Chạy lệnh `flutter build web --release -t lib/main_admin.dart`.<br>• Chạy `firebase deploy --only hosting`.<br>• Mở Safari trên iPhone, bấm "Thêm vào MH chính", kiểm tra giao diện toàn màn hình. |

---

### PHASE 6: NGHIỆM THU & BÀN GIAO TẠI QUÁN

| Task ID | Tên công việc | Ưu tiên | Chi tiết thực hiện & Tiêu chí hoàn thành (DoD) |
|---|---|---|---|
| **TASK-6.1** | Cài đặt APK lên máy Android của ba mẹ | **[P0]** | • Build file APK: `flutter build apk --release -t lib/main_pos.dart`.<br>• Cài đặt trực tiếp vào điện thoại của ba mẹ.<br>• Đăng nhập tài khoản POS một lần duy nhất. |
| **TASK-6.2** | Hướng dẫn thực hành & Kiểm thử người dùng | **[P0]** | • Cùng ba mẹ thao tác thực tế tại quán trong 1 buổi bán hàng: Bán tại quán, bán mang về, nhập 1 thùng nước, chi tiền mua đá.<br>• Kiểm tra xem ba mẹ có nhìn rõ chữ không, có bấm nhầm nút nào không. |
| **TASK-6.3** | Bàn giao tài liệu & Vận hành chính thức | **[P0]** | • Hướng dẫn con cách theo dõi trên iPhone và xuất file CSV cuối tháng.<br>• Chính thức đưa phần mềm vào vận hành thay cho sổ tay. |

---

## QUY TẮC PHỐI HỢP KHI TRIỂN KHAI
1. Agent thực hiện tuần tự từ **Phase 1 -> Phase 2 -> Phase 3 -> Phase 4 -> Phase 5 -> Phase 6**.
2. Sau khi hoàn thành mỗi Phase, agent phải chạy kiểm thử, báo cáo kết quả và chờ người dùng xác nhận trước khi tiếp tục Phase kế tiếp.
3. Mọi chuỗi hiển thị cho người dùng phải là **tiếng Việt có dấu**, rõ ràng, thân thiện với người lớn tuổi.
