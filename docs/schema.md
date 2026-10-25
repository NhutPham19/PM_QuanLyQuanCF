# ĐẶC TẢ SCHEMA CƠ SỞ DỮ LIỆU FIRESTORE (PHASE 0)
## DỰ ÁN: PM_QuanLyQuanCF

> Tài liệu này được rà soát và đối chiếu trực tiếp 100% từ mã nguồn Flutter hiện có (`lib/data/models/`, `lib/data/repositories/`, `firestore.rules`). Dùng làm căn cứ tuyệt đối cho việc xây dựng Web Admin mới (React + TypeScript).

---

## 1. DANH SÁCH CÁC COLLECTIONS CHÍNH THỨC

Hệ thống Firestore hiện tại sử dụng **6 collections chính**:
1. `products` — Danh mục món ăn & thức uống
2. `categories` — Nhóm phân loại món
3. `orders` — Đơn hàng bán ra
4. `daily_summaries` — Sổ tổng kết doanh thu & chi phí theo ngày
5. `expenses` — Phiếu chi tiền (nhập hàng & mua đồ dùng)
6. `expense_categories` — Nhóm loại chi phí

*(Lưu ý về `users`: Xem chi tiết tại Mục 7 bên dưới).*

---

## 2. CHI TIẾT SCHEMA TỪNG COLLECTION

### 2.1. Collection: `products`
- **Mục đích:** Lưu trữ thông tin từng món đồ uống / hàng bán tại quán.
- **Quy ước Document ID:** ID tự sinh (`autoId`) hoặc chuỗi định danh (ví dụ `prod_cf_den`).
- **Ai ghi:**
  - **Admin:** Toàn quyền tạo mới (`set`), chỉnh sửa (`update`), và xóa mềm (`isActive = false`).
  - **POS:** Chỉ được cập nhật trường `stockQuantity` và `updatedAt` khi bán hàng (trừ kho) hoặc nhập hàng (cộng kho). Bị Firestore Rules chặn nếu sửa các trường khác.

| Field Name | Kiểu dữ liệu | Bắt buộc | Mặc định | Ý nghĩa & Quy tắc |
| :--- | :--- | :--- | :--- | :--- |
| `name` | `string` | Có | - | Tên món (ví dụ: "CÀ PHÊ ĐÁ", "STING DÂU"). |
| `categoryId` | `string` | Có | `""` | ID của category thuộc collection `categories`. |
| `icon` | `string` | Có | `"🥤"` | Ký tự Emoji đại diện cho món (ví dụ: ☕, 🥫, 🚬). |
| `imageUrl` | `string` | Không | `null` | URL ảnh Cloudinary đã được nén tối ưu vuông `300x300`. |
| `priceDineIn` | `number` (int) | Có | `0` | **Đơn giá Uống Tại Quán** (VND, số nguyên ≥ 0). |
| `priceTakeAway` | `number` (int) | Có | `0` | **Đơn giá Mang Về** (VND, số nguyên ≥ 0). |
| `stockQuantity` | `number` (int) | Có | `0` | Số lượng tồn kho hiện tại (đơn vị bán lẻ nhỏ nhất: lon, điếu, chai). |
| `unit` | `string` | Có | `"ly"` | Đơn vị bán lẻ (ly, lon, chai, gói, điếu). |
| `unitsPerCase` | `number` (int) | Không | `null` | Số lượng quy đổi 1 thùng ra đơn vị bán (ví dụ: Sting = 24 lon/thùng). |
| `trackStock` | `boolean` | Có | `true` | `true`: trừ tồn kho khi bán; `false`: không trừ (món tự pha như cà phê, trà đá). |
| `lowStockAt` | `number` (int) | Có | `5` | Ngưỡng cảnh báo tồn kho thấp. |
| `sortOrder` | `number` (int) | Có | `1` | Thứ tự sắp xếp hiển thị trên lưới sản phẩm. |
| `isActive` | `boolean` | Có | `true` | `false`: Đã xóa mềm (ẩn khỏi danh sách POS). |
| `updatedAt` | `Timestamp` | Không | `null` | Thời gian cập nhật gần nhất (`serverTimestamp`). |

---

### 2.2. Collection: `categories`
- **Mục đích:** Danh mục phân loại đồ uống cho thanh lọc danh mục POS.
- **Quy ước Document ID:** ID tự sinh hoặc mã code (ví dụ: `cat_tu_pha`, `cat_nuoc_ngot`).
- **Ai ghi:** Chỉ Admin được tạo, sửa, xóa mềm. POS chỉ đọc danh mục có `isActive == true`.

| Field Name | Kiểu dữ liệu | Bắt buộc | Mặc định | Ý nghĩa |
| :--- | :--- | :--- | :--- | :--- |
| `name` | `string` | Có | `"DANH MỤC"` | Tên danh mục (ví dụ: "NƯỚC TỰ PHA", "NƯỚC NGỌT"). |
| `icon` | `string` | Có | `"☕"` | Emoji đại diện danh mục. |
| `orderIndex` | `number` (int) | Có | `1` | Thứ tự sắp xếp từ trái qua phải trên giao diện. |
| `isActive` | `boolean` | Có | `true` | Trạng thái hiển thị (`false` = đã ẩn/xóa). |

---

### 2.3. Collection: `orders`
- **Mục đích:** Lưu trữ lịch sử từng đơn hàng bán ra.
- **Quy ước Document ID:** ID tự sinh ngẫu nhiên từ Firestore (`autoId`).
- **Ai ghi:**
  - **POS:** Tạo mới đơn hàng khi bán. Có quyền hủy đơn do chính mình tạo trong vòng **10 phút** đầu tiên.
  - **Admin:** Xem danh sách, hủy đơn (`status = VOIDED`) bất kỳ lúc nào, hoặc khôi phục đơn (`status = ACTIVE`).
  - **CẤM XÓA CỨNG:** `allow delete: if false` trong rules để chống thất thoát dữ liệu.

| Field Name | Kiểu dữ liệu | Bắt buộc | Giá trị mẫu | Ý nghĩa & Quy tắc |
| :--- | :--- | :--- | :--- | :--- |
| `orderType` | `string` | Có | `'DINE_IN'` / `'TAKE_AWAY'` | Hình thức phục vụ: Tại quán hoặc Mang về. |
| `totalAmount` | `number` (int) | Có | `32000` | Tổng giá trị đơn hàng (VND, số nguyên). |
| `status` | `string` | Có | `'ACTIVE'` / `'VOIDED'` | Trạng thái đơn: `'ACTIVE'` (hợp lệ) hoặc `'VOIDED'` (đã hủy). |
| `items` | `array` | Có | `[...]` | Mảng danh sách các món trong đơn hàng (xem chi tiết mục con). |
| `dateString` | `string` | Có | `"2026-10-25"` | Ngày bán định dạng `YYYY-MM-DD` (theo giờ Việt Nam UTC+7). Dùng để query nhanh theo ngày mà không cần index phức tạp. |
| `monthString` | `string` | Có | `"2026-10"` | Tháng bán định dạng `YYYY-MM` (theo giờ VN). Dùng cho báo cáo tháng. |
| `createdAt` | `Timestamp` | Có | `serverTimestamp` | Thời điểm tạo đơn hàng chính xác trên máy chủ. |
| `createdBy` | `string` | Có | `"post@quanlycf.com"` | Định danh người tạo đơn (Email hoặc UID). |
| `voidedAt` | `Timestamp` | Không | `null` | Thời điểm hủy đơn (nếu có). |
| `voidedBy` | `string` | Không | `null` | Ai là người thực hiện hủy đơn (`'ADMIN'` hoặc `'POS_DEVICE'`). |

#### Cấu trúc phần tử trong mảng `items`:
```typescript
interface OrderItem {
  productId: string;   // ID món ăn
  name: string;        // Tên món lúc bán (tránh bị đổi nếu sau này sửa tên món)
  icon: string;        // Emoji
  price: number;       // Đơn vị VND (giá tại quán hoặc mang về tùy orderType lúc bán)
  quantity: number;    // Số lượng bán (nguyên dương)
  subtotal: number;    // price * quantity
  trackStock: boolean; // Có trừ tồn kho khi bán không
}
```

---

### 2.4. Collection: `daily_summaries`
- **Mục đích:** Sổ tổng kết doanh thu và dòng tiền trong ngày.
- **Quy ước Document ID:** **Bắt buộc chính xác là chuỗi `YYYY-MM-DD`** (Ví dụ: `2026-10-25`). Mỗi ngày chỉ có duy nhất 1 document.
- **Ai ghi:**
  - **POS & Admin:** Ghi cập nhật ngầm thông qua `FieldValue.increment()` trong `WriteBatch` khi tạo đơn mới (`+revenue, +1 orders`), hủy đơn (`-revenue, -1 orders`), khôi phục đơn (`+revenue, +1 orders`), hoặc ghi nhận phiếu chi (`+expense`).
  - **Admin:** Có quyền gọi hàm đối soát `recalculateDay(dateString)` để quét lại toàn bộ orders/expenses và ghi đè lại nếu có sai lệch.

| Field Name | Kiểu dữ liệu | Bắt buộc | Giá trị mẫu | Ý nghĩa |
| :--- | :--- | :--- | :--- | :--- |
| `dateString` | `string` | Có | `"2026-10-25"` | Trùng khớp với Document ID. |
| `monthString` | `string` | Có | `"2026-10"` | Tháng tương ứng (để query báo cáo tháng). |
| `totalRevenue` | `number` (int) | Có | `450000` | Tổng tiền bán được trong ngày (cộng dồn các đơn `ACTIVE`). |
| `totalExpense` | `number` (int) | Có | `120000` | Tổng tiền đã chi trong ngày (nhập hàng + đồ dùng). |
| `totalOrders` | `number` (int) | Có | `24` | Tổng số lượng đơn hàng thành công trong ngày. |
| `lastUpdated` | `Timestamp` | Không | `serverTimestamp` | Thời gian cập nhật gần nhất. |

> **Công thức tính dòng tiền còn lại trong ngày (Net Cash):**  
> `Tiền còn lại = totalRevenue - totalExpense`

---

### 2.5. Collection: `expenses`
- **Mục đích:** Lưu trữ từng phiếu chi tiền thực tế của quán.
- **Quy ước Document ID:** ID tự sinh (`autoId`).
- **Ai ghi:** POS tạo phiếu khi nhập hàng hoặc mua đồ; Admin xem và xuất báo cáo.

| Field Name | Kiểu dữ liệu | Bắt buộc | Giá trị mẫu | Ý nghĩa |
| :--- | :--- | :--- | :--- | :--- |
| `expenseType` | `string` | Có | `'RESTOCK'` / `'SUPPLIES'` / `'OTHER'` | Loại chi: Nhập hàng bán, Mua đồ dùng quán, hoặc Chi khác. |
| `categoryName` | `string` | Có | `"Nhập hàng bán"` / `"Mua Đá Lạnh"` | Tên khoản chi. |
| `productId` | `string` | Không | `"prod_sting"` | ID sản phẩm nếu là nhập hàng bán (`RESTOCK`). |
| `productName` | `string` | Không | `"STING DÂU"` | Tên sản phẩm nhập. |
| `quantity` | `number` (int) | Không | `48` | Tổng số đơn vị lẻ đã quy đổi để cộng vào kho (ví dụ: nhập 2 thùng 24 lon -> ghi 48). |
| `amount` | `number` (int) | Có | `150000` | Số tiền chi thực tế (VND). |
| `note` | `string` | Không | `"Nhập 2 thùng (48 lon)"` | Ghi chú chi tiết. |
| `status` | `string` | Có | `'ACTIVE'` | Trạng thái phiếu chi. |
| `dateString` | `string` | Có | `"2026-10-25"` | Ngày chi (`YYYY-MM-DD`). |
| `monthString` | `string` | Có | `"2026-10"` | Tháng chi (`YYYY-MM`). |
| `createdAt` | `Timestamp` | Có | `serverTimestamp` | Thời điểm ghi nhận. |
| `createdBy` | `string` | Có | `"POS_DEVICE"` | Ai tạo phiếu chi. |

---

### 2.6. Collection: `expense_categories`
- **Mục đích:** Các nút danh mục chi nhanh cho Ba Mẹ trên máy POS (ví dụ: Mua Đá Lạnh, Ly/Túi Xách, Chanh/Đường, Chi khác).
- **Quy ước Document ID:** `exp_da`, `exp_ly`, `exp_chanh`, `exp_khac` hoặc autoId.
- **Ai ghi:** Admin quản lý; POS chỉ đọc.

| Field Name | Kiểu dữ liệu | Bắt buộc | Ý nghĩa |
| :--- | :--- | :--- | :--- |
| `name` | `string` | Có | Tên khoản chi (ví dụ: "Mua Đá Lạnh"). |
| `orderIndex` | `number` (int) | Có | Thứ tự hiển thị. |
| `isActive` | `boolean` | Có | Trạng thái kích hoạt. |

---

## 3. LOGIC XỬ LÝ NGUYÊN TỬ (ATOMIC TRANSACTIONS & BATCHES)

### 3.1. Khi POS tạo đơn hàng (`submitOrder`)
Thực hiện trong **1 WriteBatch duy nhất**:
1. `batch.set(orders/{orderId}, orderData)`
2. Lặp qua các items có `trackStock == true`:  
   `batch.update(products/{productId}, { stockQuantity: FieldValue.increment(-quantity), updatedAt: serverTimestamp() })`
3. Cập nhật tổng kết ngày:  
   `batch.set(daily_summaries/{dateString}, { totalRevenue: FieldValue.increment(totalAmount), totalOrders: FieldValue.increment(1) }, SetOptions(merge: true))`

### 3.2. Khi Admin hoặc POS hủy đơn hàng (`voidOrder`)
Thực hiện trong **1 WriteBatch duy nhất**:
1. `batch.update(orders/{orderId}, { status: 'VOIDED', voidedAt: serverTimestamp(), voidedBy: voidedBy })`
2. Hoàn lại kho: Lặp qua items có `trackStock == true`:  
   `batch.update(products/{productId}, { stockQuantity: FieldValue.increment(quantity), updatedAt: serverTimestamp() })`
3. Trừ lại doanh thu ngày:  
   `batch.set(daily_summaries/{order.dateString}, { totalRevenue: FieldValue.increment(-order.totalAmount), totalOrders: FieldValue.increment(-1) }, SetOptions(merge: true))`

### 3.3. Khi Admin khôi phục đơn hàng đã hủy (`restoreOrder`)
Thực hiện trong **1 WriteBatch duy nhất**:
1. `batch.update(orders/{orderId}, { status: 'ACTIVE', voidedAt: null, voidedBy: null })`
2. Trừ lại kho:  
   `batch.update(products/{productId}, { stockQuantity: FieldValue.increment(-quantity), updatedAt: serverTimestamp() })`
3. Cộng lại doanh thu ngày:  
   `batch.set(daily_summaries/{order.dateString}, { totalRevenue: FieldValue.increment(order.totalAmount), totalOrders: FieldValue.increment(1) }, SetOptions(merge: true))`

---

## 4. CƠ CHẾ PHÂN QUYỀN & TÀI KHOẢN (AUTHENTICATION & ROLES)

### Hiện trạng trong hệ thống hiện tại:
1. **Không có collection `users` trên Firestore production.**
2. Việc nhận diện phân quyền đang dựa trên **Đích danh Email** và **Custom Claims**:
   - `admin@quanlycf.com` hoặc email chứa từ khóa `admin`: Phân quyền **ADMIN**.
   - `post@quanlycf.com` hoặc email chứa từ khóa `pos`/`bame`: Phân quyền **POS**.
3. **Firestore Security Rules hiện hành:**
   ```javascript
   function isAdmin() {
     return signedIn() && (
       request.auth.token.role == 'ADMIN' ||
       request.auth.token.email == 'admin@quanlycf.com'
     );
   }
   function isPos() {
     return signedIn() && (
       request.auth.token.role == 'POS' ||
       request.auth.token.email == 'post@quanlycf.com'
     );
   }
   ```
4. **Kế hoạch cho Web Admin mới:**
   - Trong Web Admin mới (React), ta sẽ hỗ trợ đăng nhập bằng tài khoản `admin@quanlycf.com`.
   - Khi tạo thêm tài khoản nhân viên (Phase 7), ta sẽ tạo collection `users/{uid}` lưu `{ email, role: 'admin' | 'staff', active: true }` và cập nhật rules tương ứng mà **vẫn giữ nguyên điều kiện fallback cho `admin@quanlycf.com` và `post@quanlycf.com`** để tuyệt đối không làm ảnh hưởng máy POS của Ba Mẹ.

---

## 5. CẤU HÌNH CLOUDINARY (LƯU TRỮ VÀ BIẾN ĐỔI ẢNH)

- **Cloud Name:** `v6mzvfbb`
- **Upload Preset (Unsigned):** `qlcf_unsigned`
- **Thư mục lưu trữ:** `pm_quanlyquancf`
- **Endpoint Upload Unsigned:**  
  `POST https://api.cloudinary.com/v1_1/v6mzvfbb/image/upload`  
  *(Không cần API Secret, an toàn 100% khi chạy trên Web Client)*.
- **Quy tắc biến đổi ảnh vuông (Transformation URL):**  
  Thêm chuỗi `w_300,h_300,c_fill,q_auto,f_auto` vào đường dẫn URL ảnh để tự động nén kích thước vuông 300x300, phục vụ việc tải ảnh siêu nhẹ trên mạng di động.
