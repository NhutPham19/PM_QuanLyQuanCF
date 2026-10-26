# YÊU CẦU ĐÁNH GIÁ KIẾN TRÚC KỸ THUẬT (ARCHITECTURAL REVIEW & RFC)
## DỰ ÁN: PHẦN MỀM QUẢN LÝ QUÁN CÀ PHÊ GIA ĐÌNH (PM_QuanLyQuanCF)

> **Mục đích tài liệu:** Bản đề xuất và cung cấp bối cảnh toàn diện để gửi cho **Claude (AI Architect)** nhằm đánh giá, phản biện và tư vấn giải pháp chuyển đổi công nghệ tối ưu, linh hoạt nhất cho hệ thống: Đảm bảo giao diện Web mượt mà tuyệt đối (120Hz native feel trên Safari/PC) trong khi app Android cho Ba Mẹ vẫn giữ được độ ổn định và chi phí vận hành duy trì ở mức **0đ/tháng**.

---

## 1. BỐI CẢNH DỰ ÁN & HAI NHÓM NGƯỜI DÙNG ĐỐI LẬP

Dự án phục vụ một quán cà phê gia đình thực tế với 2 nhóm người dùng có hành vi và môi trường hoàn toàn khác nhau:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                  HỆ THỐNG FIRESTORE CHUNG                              │
│                      (Cloud Firestore, Firebase Auth, Cloudinary Image CDN)            │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
                    ┌───────────────────────┴───────────────────────┐
                    ▼                                               ▼
     [ NHÓM 1: BA MẸ BÁN HÀNG ]                      [ NHÓM 2: CON CÁI QUẢN TRỊ ]
     - Thiết bị: Điện thoại Android cũ (2-3GB RAM)   - Thiết bị: iPhone (Safari) / Laptop PC
     - Hình thức: App cài đặt trực tiếp (APK)        - Hình thức: Trình duyệt Web (PWA / URL)
     - Yêu cầu: Siêu nhẹ, nút khổng lồ, offline,     - Yêu cầu: Mượt mà 100%, lướt nhẹ, quản lý
       chạm là ăn ngay, có âm thanh tít/ting.          món, giá 2 mức, xem doanh thu từ xa.
     - Ràng buộc: Không biết dùng app phức tạp.      - Ràng buộc: Chi phí 0đ (không mua Apple Dev 99$)
```

### 1.1. Nhóm 1: Ba Mẹ (Máy POS thu ngân tại quán)
- **Thiết bị:** Điện thoại Android giá rẻ, cấu hình thấp (RAM 2GB – 3GB).
- **Yêu cầu sống còn:** 
  - Khởi động tức thì, nút bấm to rõ, chữ lớn.
  - Phản hồi cực nhạy, có tiếng chuông tít (chọn món) và ting (hoàn tất đơn).
  - **Khả năng Offline 100%:** Mất mạng wifi tại quán vẫn bấm bán hàng bình thường, khi có mạng lại tự động đẩy dữ liệu lên Firestore.
  - Giữ sáng màn hình khi bán hàng (`wakelock`).

### 1.2. Nhóm 2: Con cái (Quản trị viên từ xa - Admin)
- **Thiết bị:** iPhone (chạy Safari iOS) và Laptop/MacBook.
- **Ràng buộc chi phí:** **0đ/tháng** (Không chi trả 99$/năm tài khoản Apple Developer để đẩy app lên App Store, do đó bắt buộc phải truy cập qua **Web Browser / PWA**).
- **Nghiệp vụ:** Theo dõi doanh thu thời gian thực, quản lý danh mục, cài đặt 2 mức giá (Tại quán / Mang về), xem lịch sử đơn hàng, hủy/khôi phục đơn, xuất báo cáo CSV, cấp tài khoản nhân viên.

---

## 2. HIỆN TRẠNG CÔNG NGHỆ & NGUYÊN NHÂN GÂY NGHẼN (PAIN POINTS)

### 2.1. Ngăn xếp công nghệ hiện tại (Current Tech Stack)
- **Framework:** **Flutter (Dart) đa nền tảng** cho cả 2 vai trò:
  - Bản Android POS: Biên dịch ra file `app-release.apk` (chạy native).
  - Bản Web Admin: Biên dịch ra `flutter build web` deploy lên **Firebase Hosting**.
- **Backend & Database:** Google Cloud Firestore (Spark Plan miễn phí vĩnh viễn), Firebase Auth.
- **Lưu trữ ảnh:** Cloudinary (Free tier 25GB/tháng, URL tự động nén kích thước vuông `300x300`).

### 2.2. Vấn đề thực tế (The Core Problem)
- **Bản Android APK của Ba Mẹ:** Chạy **cực kỳ mượt mà, phản hồi tức thì**, vì Flutter trên Android chạy native trực tiếp trên nhân ARM của thiết bị.
- **Bản Web Admin trên Safari / PC:** **Có độ trễ (input lag), cảm giác rít, nặng nề, cuộn trang không tự nhiên, không thể mượt như các trang web thông thường.**

### 2.3. Phân tích nguyên nhân kỹ thuật
1. **Bản chất CanvasKit/WebGL của Flutter Web:** Flutter Web không sinh ra mã HTML/DOM truyền thống. Nó đưa toàn bộ engine đồ họa Skia vào trình duyệt và vẽ giao diện lên **một thẻ `<canvas>` duy nhất**.
2. **Safari bóp nghẹt WebGL:** Trình duyệt Safari (đặc biệt trên iOS) áp chính sách tiết kiệm pin cực kỳ ngặt nghèo: giới hạn bộ nhớ đồ họa WebGL, dồn việc vẽ canvas vào đơn luồng (single-thread), không tối ưu cho việc render lại toàn bộ màn hình khi cuộn.
3. **Mô phỏng cuộn (Simulated Scrolling):** Vì là thẻ canvas, Safari không nhận diện được các phần tử DOM để kích hoạt bộ cuộn phần cứng 120Hz ProMotion của iOS, mà Flutter phải tự tính tọa độ và gia tốc cuộn bằng JavaScript/WASM, tạo cảm giác "nặng" và "giả tạo".

---

## 3. CÁC ĐỀ XUẤT KIẾN TRÚC ĐỂ CLAUDE ĐÁNH GIÁ (OPTIONS FOR REVIEW)

Dưới đây là 3 hướng tiếp cận công nghệ khả thi để giải quyết dứt điểm vấn đề này. Nhờ Claude đánh giá ưu/nhược điểm, mức độ linh hoạt và đề xuất giải pháp tốt nhất:

```
┌───────────────────────────────────────────────────────────────────────────────────────┐
│ KỊCH BẢN 1 (KHUYÊN DÙNG): KIẾN TRÚC HYBRID MONOREPO (TÁCH BIỆT WEB & MOBILE)        │
│                                                                                       │
│  [ DỰ ÁN TỔNG PM_QuanLyQuanCF ]                                                       │
│   ├── app-pos-mobile/  ──► FLUTTER (Chỉ chuyên build Android APK cho Ba Mẹ)           │
│   │                         (Giữ nguyên 100% tính năng mượt, offline, wakelock)       │
│   └── web-admin/       ──► REACT / NEXT.JS / VITE + TAILWIND (HTML DOM Thuần cho Con) │
│                             (Mượt 120fps trên Safari, tải cực nhanh, nhẹ < 200KB)     │
│                                      │                                                │
│                                      ▼                                                │
│                    CÙNG KẾT NỐI VÀO 1 FIREBASE FIRESTORE DUY NHẤT                     │
└───────────────────────────────────────────────────────────────────────────────────────┘
```

### Kịch bản 1: Decoupled Monorepo (Tách riêng Web Admin thuần HTML & Giữ Flutter Android)
- **POS Ba Mẹ (Android):** Giữ nguyên mã nguồn Flutter hiện tại, chỉ build ra file APK cài đặt lên điện thoại. Tiếp tục phát huy thế mạnh tốt nhất của Flutter trên Mobile (offline-first, SQLite/Firestore cache, âm thanh, Bluetooth in hóa đơn nếu cần sau này).
- **Web Admin Con (Trình duyệt):** Viết lại giao diện Admin bằng một Web Framework hiện đại thuần HTML/DOM:
  - **Lựa chọn 1A:** **React + Vite + Tailwind CSS + shadcn/ui** (Single Page App cực nhẹ, build tĩnh, deploy thẳng lên Firebase Hosting hiện có với chi phí 0đ).
  - **Lựa chọn 1B:** **Next.js (App Router)** deploy lên Vercel (Free) hoặc Firebase Hosting.
- **Chia sẻ dữ liệu:** Cả hai bên đều dùng trực tiếp **Firebase JS SDK** và **FlutterFire**, chung một cấu trúc Firestore Document (`products`, `orders`, `expenses`, `daily_summaries`).

### Kịch bản 2: Chuyển đổi toàn diện sang React Native / Expo (Universal React)
- Viết lại toàn bộ hệ thống bằng **Expo (React Native)**:
  - Android POS: Dùng React Native build APK.
  - Web Admin: Dùng Expo Web / React Native for Web (render ra thẻ HTML DOM div/span thực tế, không dùng WebGL canvas như Flutter).
- *Thắc mắc cho Claude:* Liệu độ mượt trên máy Android 2GB RAM của Ba Mẹ và khả năng xử lý offline của Expo có bằng được Flutter Native không?

### Kịch bản 3: Tối ưu sâu Flutter Web (Giữ nguyên kiến trúc 1 ngôn ngữ Dart)
- Liệu có kỹ thuật nào trong Flutter 3.24+ (như Skwasm đa luồng, WebAssembly WasmGC kết hợp cấu hình máy chủ COOP/COEP cao cấp, tinh chỉnh Service Worker) có thể đưa trải nghiệm trên Safari iPhone chạm mốc mượt mà như web thông thường được không? Hay đây là giới hạn kiến trúc không thể vượt qua của CanvasKit?

---

## 4. YÊU CẦU CỤ THỂ DÀNH CHO CLAUDE (PROMPT FOR CLAUDE)

Nhờ Claude đọc toàn bộ tài liệu này và trả lời chi tiết các câu hỏi sau:

### Câu hỏi 1: Đánh giá và Lựa chọn giải pháp tối ưu
1. Theo góc nhìn của một Senior Solutions Architect, trong 3 kịch bản trên (hoặc kịch bản khác anh đề xuất), giải pháp nào là **linh hoạt, thực dụng và tối ưu nhất** cho bài toán cụ thể này (Quán cà phê gia đình, 0đ chi phí, Ba Mẹ dùng Android cũ, Con dùng Safari iPhone)?
2. Đánh giá chi tiết ưu/nhược điểm của **Kịch bản 1 (Flutter cho POS + Vite/React cho Web Admin)** so với các phương án còn lại.

### Câu hỏi 2: Lựa chọn công nghệ cụ thể cho Web Admin
Nếu chọn Kịch bản 1:
- Giữa **Vite + React SPA** và **Next.js (App Router)**, phương án nào nhẹ hơn, tải nhanh hơn trên mạng di động 4G của iPhone, và dễ tích hợp Firebase Auth / Firestore nhất với chi phí lưu trữ 0đ trên Firebase Hosting?
- Nên chọn thư viện UI component nào để giao diện Admin sang trọng phong cách Bento VIP (Apple style) nhưng dung lượng bundle nhẹ nhất? (Ví dụ: Tailwind CSS + shadcn/ui, Tremor Dashboard, Ant Design, hay DaisyUI?)

### Câu hỏi 3: Lộ trình triển khai (Step-by-step Action Plan)
- Hãy phác thảo cấu trúc thư mục Monorepo khuyến nghị.
- Quy trình từng bước để bóc tách mã nguồn Web Admin sang công nghệ mới mà không làm gián đoạn app Android đang hoạt động của Ba Mẹ.
- Cung cấp đoạn mã mẫu (Starter Template) gồm:
  1. Cấu hình Firebase Web Client (`firebase.ts`).
  2. Một component Dashboard mẫu đọc realtime dữ liệu doanh thu hôm nay từ collection `daily_summaries` qua Firestore `onSnapshot`.
  3. Cơ chế đăng nhập và kiểm tra phân quyền Admin.
