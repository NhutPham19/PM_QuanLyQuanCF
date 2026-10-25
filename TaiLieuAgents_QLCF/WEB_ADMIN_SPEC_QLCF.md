# ĐẶC TẢ TÁC VỤ: XÂY WEB ADMIN (VITE + REACT) CHO PM_QuanLyQuanCF

> **Dành cho:** AI coding agent (Antigravity / Cursor / Claude Code...).
> **Cách dùng:** Đọc toàn bộ file này trước, làm **tuần tự theo từng Phase**, hết mỗi Phase **dừng lại và báo cáo** để chủ dự án kiểm tra rồi mới sang Phase tiếp theo.

---

## 0. TÓM TẮT NHIỆM VỤ

Dự án là phần mềm quản lý quán cà phê gia đình. Hiện tại cả POS Android và Web Admin đều viết bằng **Flutter**. Bản Flutter Web chạy trên Safari/iPhone và PC bị giật, cuộn không mượt (do Flutter Web vẽ lên một thẻ `<canvas>`, không phải DOM thật). Đây là giới hạn kiến trúc, không sửa bằng cấu hình được.

**Quyết định đã chốt:**
- **Giữ nguyên Flutter** cho app POS Android của Ba Mẹ. **Không được sửa gì ở phần này.**
- **Viết mới Web Admin** bằng **Vite + React + TypeScript + Tailwind CSS + shadcn/ui** (HTML/DOM thuần), dùng chung **một Firebase project / Firestore** hiện có.

Mục tiêu của bạn: dựng Web Admin mới có đầy đủ nghiệp vụ như Web Admin Flutter hiện tại, mượt 120Hz trên Safari iPhone, deploy được lên Firebase Hosting với chi phí **0đ/tháng**.

---

## 1. RÀNG BUỘC BẮT BUỘC (KHÔNG ĐƯỢC VI PHẠM)

1. **Không đụng vào app POS Flutter** (build APK của Ba Mẹ). Chỉ được di chuyển thư mục khi chủ dự án cho phép, và phải xác nhận vẫn build được.
2. **Chi phí 0đ:** chỉ dùng Firebase **Spark plan**. **CẤM** dùng: Cloud Functions, Cloud Run, Next.js SSR, Firebase Admin SDK chạy trên server, hoặc bất cứ thứ gì buộc phải nâng lên **Blaze plan**.
3. **Không dùng Next.js.** Đây là SPA nội bộ sau đăng nhập, không cần SEO/SSR.
4. **Không đoán schema.** Phải đọc code Flutter hiện tại để lấy đúng tên collection, tên field, kiểu dữ liệu (xem Phase 0). Mọi field trong file này đánh dấu *(giả định)* phải được đối chiếu với code thật.
5. **Không đặt bí mật trong client.** Không đưa Cloudinary API secret, service account hay bất kỳ khóa riêng tư nào vào code web. Chỉ dùng cấu hình công khai của Firebase Web và upload preset *unsigned* của Cloudinary (nếu app Flutter hiện đang dùng cách đó).
6. **Bảo mật nằm ở Firestore Security Rules**, không phải ở kiểm tra giao diện. Kiểm tra role ở React chỉ để ẩn/hiện UI.
7. **Tiền tệ là số nguyên VND**, không dùng số thực. **Múi giờ nghiệp vụ là `Asia/Ho_Chi_Minh`** khi tính "hôm nay", "tuần này", "tháng này".
8. **Không để hai nơi cùng ghi một dữ liệu tổng hợp theo hai logic khác nhau.** Với `daily_summaries`: phải làm đúng như Flutter hiện đang làm (xem Phase 6). Nếu không chắc, dừng lại và hỏi.

---

## 2. BỐI CẢNH NGƯỜI DÙNG

| Nhóm | Thiết bị | Dùng gì | Ghi chú |
|---|---|---|---|
| Ba Mẹ (thu ngân) | Android cũ, RAM 2–3GB | App Flutter APK | Offline 100%, nút to. **Không đụng tới.** |
| Con cái (admin) | iPhone (Safari), laptop/MacBook | **Web Admin mới (bạn xây)** | Không có Apple Developer, nên dùng web/PWA |

Web Admin cần các nghiệp vụ: theo dõi doanh thu realtime, quản lý danh mục và món, **cài 2 mức giá (Tại quán / Mang về)**, xem lịch sử đơn, **hủy/khôi phục đơn**, quản lý chi phí, **xuất báo cáo CSV**, **cấp tài khoản nhân viên**.

---

## 3. TECH STACK CHỐT

| Hạng mục | Chọn |
|---|---|
| Build tool | Vite |
| UI | React 18 + TypeScript (strict) |
| Style | Tailwind CSS |
| Component | shadcn/ui (copy từng component cần dùng, không cài cả thư viện UI nặng) |
| Router | react-router-dom |
| Backend | Firebase JS SDK v10+ (modular): Auth, Firestore |
| Biểu đồ | Recharts, **bắt buộc lazy-load** (`React.lazy`) |
| PWA | vite-plugin-pwa |
| Ảnh | Cloudinary (URL transform, không tự lưu ảnh) |
| Test | Vitest + Firebase Emulator Suite cho rules |
| Deploy | Firebase Hosting (site riêng, xem Phase 8) |

**Cấm thêm:** Ant Design, MUI, Redux, Moment.js, Lodash toàn bộ, bất kỳ thư viện nào > 30KB gzip mà không có lý do được ghi rõ.

**Ngân sách hiệu năng:** JS tải lần đầu mục tiêu **≤ 250KB gzip**. Biểu đồ, trang báo cáo, xuất CSV phải tách chunk và lazy-load. Lighthouse Mobile Performance ≥ 90.

---

## 4. CẤU TRÚC THƯ MỤC MỤC TIÊU

```
PM_QuanLyQuanCF/
├── apps/
│   ├── pos-mobile/              # Flutter — KHÔNG SỬA
│   └── web-admin/               # Dự án bạn xây
│       ├── src/
│       │   ├── lib/
│       │   │   ├── firebase.ts
│       │   │   ├── format.ts        # vnd(), dateKey()
│       │   │   └── cloudinary.ts    # build URL ảnh
│       │   ├── auth/
│       │   │   ├── AuthProvider.tsx
│       │   │   └── RequireAdmin.tsx
│       │   ├── features/
│       │   │   ├── dashboard/
│       │   │   ├── orders/
│       │   │   ├── products/
│       │   │   ├── expenses/
│       │   │   ├── reports/
│       │   │   └── staff/
│       │   ├── components/ui/       # shadcn
│       │   ├── App.tsx
│       │   └── main.tsx
│       ├── index.html
│       ├── vite.config.ts
│       └── package.json
├── firebase/
│   ├── firestore.rules
│   └── firestore.indexes.json
├── docs/
│   └── schema.md                # BẠN TẠO Ở PHASE 0
└── firebase.json
```

Nếu repo hiện tại đang ở dạng khác (Flutter nằm ở gốc), **đừng tự di chuyển**. Tạo `apps/web-admin/` (hoặc `web-admin/`) bên cạnh và hỏi chủ dự án trước khi dời Flutter.

---

## 5. CÁC PHASE THỰC HIỆN

> Hết mỗi Phase: chạy build, chạy test, rồi **báo cáo** gồm (a) đã làm gì, (b) file nào thay đổi, (c) những chỗ còn nghi ngờ, (d) câu hỏi cần chủ dự án quyết. **Không tự ý làm sang Phase kế tiếp.**

### Phase 0: Khảo sát và đóng băng schema (CHỈ ĐỌC, KHÔNG VIẾT CODE WEB)

1. Đọc toàn bộ code Flutter: tìm mọi chỗ đọc/ghi Firestore (`FirebaseFirestore.instance`, `collection(`, `.doc(`, `.set(`, `.update(`, `runTransaction`, `WriteBatch`).
2. Lập `docs/schema.md` gồm, cho **từng collection** (`products`, `orders`, `expenses`, `daily_summaries`, `users` hoặc tương đương):
   - Tên field, kiểu dữ liệu thật, field nào bắt buộc/tùy chọn.
   - Quy ước doc ID (ví dụ `daily_summaries/{YYYY-MM-DD}`).
   - Ai ghi (POS hay Admin), khi nào ghi.
   - Cách lưu 2 mức giá (tại quán / mang về) trong `products`.
   - Cách lưu trạng thái đơn (hoàn tất / đã hủy), thời điểm tạo, thông tin món trong đơn.
3. Lập **danh sách tính năng** của Web Admin Flutter hiện tại (từng màn hình, từng thao tác) thành checklist trong `docs/feature-checklist.md`. Đây là thước đo "xong" của cả dự án.
4. Xác định cách Flutter hiện đang:
   - Hủy/khôi phục đơn (có cập nhật `daily_summaries` không, bằng transaction hay batch?).
   - Phân quyền (dựa vào đâu để phân biệt admin và nhân viên?).
   - Tạo tài khoản nhân viên.
   - Upload ảnh lên Cloudinary (cloud name, upload preset, transform).
5. Đọc `firestore.rules` hiện có (nếu có) và ghi lại.

**Tiêu chí hoàn thành:** `docs/schema.md` và `docs/feature-checklist.md` đã có, kèm danh sách câu hỏi mở. **Dừng lại, chờ chủ dự án duyệt.**

---

### Phase 1: Khởi tạo dự án

- `npm create vite@latest web-admin -- --template react-ts`, bật `strict` trong tsconfig.
- Cài Tailwind, shadcn/ui, react-router-dom, firebase.
- Tạo `.env.example` với các biến `VITE_FB_API_KEY`, `VITE_FB_AUTH_DOMAIN`, `VITE_FB_PROJECT_ID`, `VITE_FB_APP_ID`. **Không commit `.env` thật.**
- Dựng layout cơ bản: sidebar (desktop) / tab bar dưới (mobile), responsive.

**Hoàn thành khi:** `npm run build` thành công, trang trống có điều hướng chạy được trên iPhone Safari (dùng Responsive Mode hoặc thiết bị thật).

---

### Phase 2: Đăng nhập, phân quyền, Security Rules

- Cài `AuthProvider` và `RequireAdmin` (mẫu ở mục 6).
- Role lấy từ `users/{uid}.role` (hoặc đúng cơ chế Flutter đang dùng, theo `docs/schema.md`). **Không dùng custom claims** (cần Cloud Functions, tức Blaze).
- Viết `firebase/firestore.rules` (mẫu ở mục 6.4), **sửa theo schema thật**.
- Viết test rules bằng Emulator Suite. Phải có test: người chưa đăng nhập bị chặn, nhân viên không đọc được `expenses`/`daily_summaries`, admin đọc được.

**QUAN TRỌNG:** Rules mới phải **không làm hỏng app POS Flutter** (nhân viên vẫn phải tạo được đơn, đọc được món). Test kỹ trên Emulator trước khi đề xuất deploy. **Không tự deploy rules lên production.** Đưa lệnh cho chủ dự án tự chạy.

---

### Phase 3: Dashboard (chỉ đọc)

- Doanh thu hôm nay realtime qua `onSnapshot` trên `daily_summaries/{hôm nay}` (mẫu ở 6.3).
- Thẻ Bento: tổng doanh thu, số đơn, tại quán vs mang về, so với hôm qua.
- Biểu đồ 7/30 ngày (lazy-load Recharts), dùng `query` có `orderBy` và `limit` hợp lý.
- Luôn `return unsub` trong `useEffect` để tránh rò rỉ listener và tốn lượt đọc.

---

### Phase 4: Danh sách đơn hàng (chỉ đọc)

- Danh sách đơn có phân trang (`limit` + `startAfter`), lọc theo ngày, trạng thái.
- Xem chi tiết đơn.
- Nếu cần index tổng hợp, ghi vào `firebase/firestore.indexes.json`.
- **Không tải toàn bộ collection `orders`** vào client.

---

### Phase 5: Quản lý món và 2 mức giá

- CRUD danh mục và món. Form có 2 trường giá: **Tại quán** và **Mang về** (theo schema thật).
- Ảnh: dùng URL Cloudinary với transform vuông (ví dụ `c_fill,w_300,h_300,f_auto,q_auto`). Upload theo đúng cách Flutter đang làm (unsigned preset). Không lưu secret.
- Validate: giá là số nguyên ≥ 0.
- Mọi thay đổi món phải **tương thích với app POS** (POS đọc lại được).

---

### Phase 6: Hủy/khôi phục đơn, chi phí, xuất CSV

- **Hủy/khôi phục đơn:** làm **chính xác như logic Flutter hiện tại** (đã ghi ở Phase 0). Nếu hủy đơn phải trừ vào `daily_summaries`, dùng `runTransaction` hoặc `writeBatch` để cập nhật đơn và tổng kết **trong cùng một thao tác nguyên tử**. Nếu logic Flutter không rõ ràng, **dừng và hỏi**, đừng đoán.
- **Chi phí (`expenses`):** CRUD, lọc theo tháng.
- **Xuất CSV:** tạo ở client, lazy-load, có BOM UTF-8 (`\uFEFF`) để Excel đọc đúng tiếng Việt. Thêm cột theo yêu cầu báo cáo hiện có của Flutter.

---

### Phase 7: Cấp tài khoản nhân viên

- Gọi `createUserWithEmailAndPassword` trên app chính sẽ **đăng nhập luôn bằng tài khoản mới** và đá admin ra. Cách xử lý (không cần Cloud Functions): khởi tạo **một instance Firebase App thứ hai** (`initializeApp(config, "secondary")`) chỉ để tạo user, sau đó `signOut` instance phụ, rồi ghi `users/{uid} = { role: "staff", ... }` bằng phiên admin.
- Rules phải cho phép admin ghi `users/{uid}` (mẫu 6.4 đang khóa ghi, bạn cần điều chỉnh cho Phase này nhưng **chỉ cho admin**).
- Tính năng vô hiệu hóa nhân viên: đánh dấu `active: false` trong `users` và để rules từ chối.

---

### Phase 8: PWA, tối ưu hiệu năng, deploy song song

- `vite-plugin-pwa`: manifest, icon, cho phép "Thêm vào Màn hình chính" trên iPhone.
- Tối ưu: tách chunk (`manualChunks` cho firebase/recharts), lazy-load route, font hệ thống (San Francisco) thay vì tải font web.
- Cache: `/assets/**` header `Cache-Control: public,max-age=31536000,immutable`.
- **Deploy song song, không thay thế ngay:** dùng Firebase Hosting multi-site. Giữ site Flutter Web cũ, deploy bản mới lên site thứ hai. Chủ dự án dùng thử một thời gian rồi tự quyết định cutover.

Ví dụ `firebase.json` (điều chỉnh `site`/`target` theo project thật):

```json
{
  "hosting": [
    {
      "target": "admin-new",
      "public": "apps/web-admin/dist",
      "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
      "rewrites": [{ "source": "**", "destination": "/index.html" }],
      "headers": [
        {
          "source": "/assets/**",
          "headers": [{ "key": "Cache-Control", "value": "public,max-age=31536000,immutable" }]
        }
      ]
    }
  ],
  "firestore": { "rules": "firebase/firestore.rules", "indexes": "firebase/firestore.indexes.json" }
}
```

---

## 6. MÃ MẪU KHỞI ĐẦU

> Tên collection/field dưới đây là *(giả định)*. **Phải sửa theo `docs/schema.md`.**

### 6.1. `src/lib/firebase.ts`

```ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const config = {
  apiKey: import.meta.env.VITE_FB_API_KEY,
  authDomain: import.meta.env.VITE_FB_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FB_PROJECT_ID,
  appId: import.meta.env.VITE_FB_APP_ID,
};

export const app = initializeApp(config);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const firebaseConfig = config; // dùng cho app phụ ở Phase 7
```

### 6.2. `src/lib/format.ts`

```ts
export const vnd = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

// Trả về "YYYY-MM-DD" theo giờ Việt Nam
export const dateKey = (d: Date = new Date()) =>
  new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" }).format(d);
```

### 6.3. Auth và Dashboard

```tsx
// src/auth/AuthProvider.tsx
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

type Role = "admin" | "staff" | null;
type Ctx = {
  user: User | null;
  role: Role;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<Ctx>(null!);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const snap = await getDoc(doc(db, "users", u.uid));
        setRole((snap.data()?.role as Role) ?? null);
      } else {
        setRole(null);
      }
      setLoading(false);
    });
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, login, logout: () => signOut(auth) }}>
      {children}
    </AuthContext.Provider>
  );
}
```

```tsx
// src/auth/RequireAdmin.tsx
import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, role, loading } = useAuth();
  if (loading) return <div className="p-8 text-sm text-neutral-500">Đang tải…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role !== "admin") return <div className="p-8">Bạn không có quyền truy cập.</div>;
  return <>{children}</>;
}
```

```tsx
// src/features/dashboard/TodayRevenue.tsx
import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { dateKey, vnd } from "../../lib/format";

type DailySummary = {
  totalRevenue: number;      // (giả định)
  orderCount: number;        // (giả định)
  dineInRevenue?: number;    // (giả định)
  takeawayRevenue?: number;  // (giả định)
};

export function TodayRevenue() {
  const [data, setData] = useState<DailySummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, "daily_summaries", dateKey()),
      (snap) => setData(snap.exists() ? (snap.data() as DailySummary) : null),
      (err) => setError(err.message),
    );
    return unsub;
  }, []);

  if (error) return <p className="text-red-600">Lỗi: {error}</p>;

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="col-span-2 rounded-3xl bg-white p-6 shadow-sm">
        <p className="text-sm text-neutral-500">Doanh thu hôm nay</p>
        <p className="mt-2 text-4xl font-semibold tracking-tight">{vnd(data?.totalRevenue ?? 0)}</p>
      </div>
      <div className="rounded-3xl bg-white p-5 shadow-sm">
        <p className="text-sm text-neutral-500">Số đơn</p>
        <p className="mt-1 text-2xl font-semibold">{data?.orderCount ?? 0}</p>
      </div>
      <div className="rounded-3xl bg-white p-5 shadow-sm">
        <p className="text-sm text-neutral-500">Tại quán / Mang về</p>
        <p className="mt-1 text-lg font-medium">
          {vnd(data?.dineInRevenue ?? 0)} / {vnd(data?.takeawayRevenue ?? 0)}
        </p>
      </div>
    </div>
  );
}
```

### 6.4. `firebase/firestore.rules` (mẫu, sửa theo schema thật)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function role() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
    }
    function isAdmin() { return request.auth != null && role() == 'admin'; }
    function isStaff() { return request.auth != null && role() in ['admin', 'staff']; }

    match /users/{uid} {
      allow read: if request.auth != null && (request.auth.uid == uid || isAdmin());
      allow write: if isAdmin();
    }
    match /daily_summaries/{id} { allow read: if isAdmin(); allow write: if isStaff(); }
    match /products/{id}        { allow read: if isStaff(); allow write: if isAdmin(); }
    match /orders/{id} {
      allow read: if isStaff();
      allow create: if isStaff();
      allow update, delete: if isAdmin();
    }
    match /expenses/{id}        { allow read, write: if isAdmin(); }
  }
}
```

> Lưu ý: nếu app POS hiện ghi vào collection khác hoặc cần quyền khác (ví dụ nhân viên sửa đơn của chính mình), **phải chỉnh rules cho khớp**, nếu không POS sẽ bị chặn khi bán hàng. Test kỹ bằng Emulator trước.

---

## 7. HƯỚNG DẪN THIẾT KẾ GIAO DIỆN

- Phong cách **Bento / Apple**: thẻ bo góc lớn (`rounded-3xl`), nền sáng xám nhạt, nhiều khoảng trắng, đổ bóng rất nhẹ, số liệu lớn và đậm.
- **Mobile-first.** Thiết kế cho iPhone trước, rồi mở rộng cho laptop.
- Font hệ thống: `font-family: -apple-system, BlinkMacSystemFont, "SF Pro", system-ui, sans-serif`.
- Vùng chạm tối thiểu 44×44px, tôn trọng `env(safe-area-inset-*)` cho iPhone có tai thỏ.
- Hỗ trợ dark mode qua `prefers-color-scheme`.
- Tuyệt đối không dùng animation nặng. Chỉ dùng `transform` và `opacity`, tránh làm layout thrash.
- Toàn bộ chữ giao diện bằng **tiếng Việt**.

---

## 8. TIÊU CHÍ "XONG" CỦA TOÀN DỰ ÁN

- [ ] Mọi mục trong `docs/feature-checklist.md` đã có ở Web Admin mới.
- [ ] App POS Flutter **không bị thay đổi** và vẫn bán hàng, offline, đồng bộ bình thường.
- [ ] Test rules (Emulator) đều pass, người lạ và nhân viên không truy cập được dữ liệu admin.
- [ ] Hủy/khôi phục đơn cho ra `daily_summaries` **khớp** với cách Flutter tính.
- [ ] Lighthouse Mobile Performance ≥ 90, JS lần đầu ≤ 250KB gzip.
- [ ] Cuộn mượt trên iPhone Safari thật.
- [ ] Không có chi phí phát sinh (không Functions, không Blaze).
- [ ] Deploy được lên Firebase Hosting site riêng, chạy song song với bản Flutter Web cũ.
- [ ] Có `README.md` ghi cách chạy, build, deploy.

---

## 9. KHI GẶP TÌNH HUỐNG KHÔNG CHẮC

Dừng lại và hỏi chủ dự án trong các trường hợp:
- Schema Firestore thật khác với giả định và ảnh hưởng đến cả POS.
- Cần thay đổi bất cứ thứ gì ở app POS hoặc Firestore Rules đang chạy production.
- Một giải pháp yêu cầu Cloud Functions hoặc nâng gói Blaze.
- Logic nghiệp vụ (tính tổng, hủy đơn, giá 2 mức) không rõ ràng từ code Flutter.

**Không bao giờ** tự quyết rồi báo sau với những mục trên.
