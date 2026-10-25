import React, { useState, useEffect } from "react";
import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { collection, getDocs, doc, setDoc, updateDoc } from "firebase/firestore";
import { firebaseConfig, db } from "@/lib/firebase";
import type { AppUser } from "@/types";
import {
  Users,
  UserPlus,
  ShieldCheck,
  Smartphone,
  Lock,
  Mail,
  CheckCircle2,
  XCircle,
  X,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";

export const StaffPage: React.FC = () => {
  const [userList, setUserList] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal tạo tài khoản
  const [modalOpen, setModalOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"admin" | "staff">("staff");
  const [isCreating, setIsCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const snap = await getDocs(collection(db, "users"));
      const list: AppUser[] = [];
      snap.forEach((d) => {
        const data = d.data();
        list.push({
          uid: d.id,
          email: (data.email as string) || "",
          role: (data.role as "admin" | "staff") || "staff",
          active: data.active !== false,
          createdAt: data.createdAt as string,
        });
      });

      // Chỉ giữ lại 2 tài khoản chính thức: admin@gmail.com và post@gmail.com
      // Loại bỏ các tài khoản giả lập/cũ (@quanlycf.com) nếu có
      const filteredList = list.filter(
        (u) => !u.email.endsWith("@quanlycf.com")
      );

      const hasAdmin = filteredList.some((u) => u.email === "admin@gmail.com");
      const hasPos = filteredList.some((u) => u.email === "post@gmail.com");

      if (!hasAdmin) {
        filteredList.unshift({
          uid: "system_admin",
          email: "admin@gmail.com",
          role: "admin",
          active: true,
          createdAt: "Tài khoản Quản trị gốc",
        });
      }
      if (!hasPos) {
        filteredList.push({
          uid: "system_pos",
          email: "post@gmail.com",
          role: "staff",
          active: true,
          createdAt: "Tài khoản POS Ba Mẹ gốc",
        });
      }

      setUserList(filteredList);
    } catch (err) {
      console.error("Lỗi tải danh sách tài khoản:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Xử lý tạo user an toàn bằng Secondary Firebase App (Không đá Admin ra)
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim() || !password.trim()) {
      setErrorMsg("Vui lòng nhập đầy đủ Email và Mật khẩu!");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Mật khẩu phải có ít nhất 6 ký tự!");
      return;
    }

    let secondaryApp = null;
    try {
      setIsCreating(true);
      // Khởi tạo app phụ ngầm
      const appName = `SecondaryAuth_${Date.now()}`;
      secondaryApp = initializeApp(firebaseConfig, appName);
      const secondaryAuth = getAuth(secondaryApp);

      // Tạo user mới trên app phụ
      const cred = await createUserWithEmailAndPassword(secondaryAuth, email.trim(), password);
      const newUid = cred.user.uid;

      // Đăng xuất và dọn dẹp app phụ
      await signOut(secondaryAuth);
      await deleteApp(secondaryApp);
      secondaryApp = null;

      // Lưu hồ sơ vào Firestore bằng phiên Admin hiện tại
      await setDoc(doc(db, "users", newUid), {
        email: email.trim(),
        role: selectedRole,
        active: true,
        createdAt: new Date().toISOString(),
      });

      alert(`✔ Đã tạo thành công tài khoản "${email}" với vai trò ${selectedRole === "admin" ? "Quản Trị Viên" : "Thu Ngân POS"}!`);
      setModalOpen(false);
      setEmail("");
      setPassword("");
      await fetchUsers();
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === "auth/email-already-in-use") {
        setErrorMsg("Email này đã được sử dụng trên hệ thống!");
      } else {
        setErrorMsg((err as Error).message || "Lỗi tạo tài khoản!");
      }
    } finally {
      if (secondaryApp) {
        try {
          await deleteApp(secondaryApp);
        } catch {}
      }
      setIsCreating(false);
    }
  };

  // Khóa / Mở khóa tài khoản (active toggle)
  const handleToggleActive = async (user: AppUser) => {
    if (user.uid.startsWith("system_")) {
      alert("Không thể khóa tài khoản mặc định của hệ thống!");
      return;
    }

    const newActiveState = !user.active;
    const confirmText = newActiveState
      ? `Bạn có muốn MỞ KHÓA tài khoản ${user.email}?`
      : `Bạn có muốn KHÓA tài khoản ${user.email}? Tài khoản này sẽ không thể đăng nhập hoặc bán hàng.`;

    if (!confirm(confirmText)) return;

    try {
      await updateDoc(doc(db, "users", user.uid), {
        active: newActiveState,
      });
      await fetchUsers();
    } catch (err) {
      alert("Lỗi khi cập nhật trạng thái: " + (err as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Phân Quyền & Cấp Tài Khoản</h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium">
            Quản trị quyền truy cập Admin và cấp tài khoản Thu ngân POS cho Ba Mẹ
          </p>
        </div>

        <button
          onClick={() => {
            setErrorMsg(null);
            setModalOpen(true);
          }}
          className="flex items-center space-x-1.5 px-4 py-2.5 rounded-2xl bg-purple-600 text-white font-bold text-sm shadow-md shadow-purple-600/30 hover:bg-purple-700 transition-all self-start"
        >
          <UserPlus className="w-4 h-4" />
          <span>Cấp tài khoản mới</span>
        </button>
      </div>

      {/* Info notice */}
      <div className="p-4 rounded-3xl bg-indigo-50 border border-indigo-100 flex items-start space-x-3 text-xs text-indigo-900 leading-relaxed">
        <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block text-sm">Hệ thống phân quyền 2 tầng độc lập:</span>
          <span>
            • <strong>Quản Trị Viên (Admin):</strong> Toàn quyền trên Web Admin (sửa giá món, xem doanh thu, xuất CSV).
            <br />
            • <strong>Thu Ngân POS (Ba Mẹ):</strong> Chỉ có quyền bán hàng, cập nhật tồn kho và ghi phiếu chi trên app Android; tự động bị chặn nếu truy cập trang Web Admin.
          </span>
        </div>
      </div>

      {/* User list */}
      {loading ? (
        <div className="rounded-3xl bg-white p-12 text-center border border-slate-200/80">
          <div className="w-8 h-8 rounded-full border-2 border-purple-500/20 border-t-purple-600 animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-400">Đang tải danh sách tài khoản...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {userList.map((u) => {
            const isAdmin = u.role === "admin";

            return (
              <div
                key={u.uid}
                className="rounded-3xl bg-white p-4 md:p-5 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center space-x-3.5">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                      isAdmin ? "bg-indigo-50 text-indigo-600" : "bg-emerald-50 text-emerald-600"
                    }`}
                  >
                    {isAdmin ? <ShieldCheck className="w-6 h-6" /> : <Smartphone className="w-6 h-6" />}
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-sm md:text-base text-slate-900">{u.email}</span>
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-lg ${
                          isAdmin
                            ? "bg-indigo-100 text-indigo-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {isAdmin ? "Quản Trị (Admin)" : "Thu Ngân (POS)"}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 font-medium block mt-0.5">
                      {u.createdAt ? `Tạo: ${u.createdAt}` : "Tài khoản hệ thống"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-3 self-end sm:self-auto">
                  {u.active ? (
                    <span className="flex items-center space-x-1 text-emerald-600 text-xs font-bold bg-emerald-50 px-2.5 py-1 rounded-xl">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Hoạt động</span>
                    </span>
                  ) : (
                    <span className="flex items-center space-x-1 text-rose-500 text-xs font-bold bg-rose-50 px-2.5 py-1 rounded-xl">
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Đã khóa</span>
                    </span>
                  )}

                  {!u.uid.startsWith("system_") && (
                    <button
                      onClick={() => handleToggleActive(u)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-colors ${
                        u.active
                          ? "bg-rose-50 text-rose-600 hover:bg-rose-100"
                          : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                      }`}
                    >
                      {u.active ? "Khóa" : "Mở khóa"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Cấp Tài Khoản Mới */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-purple-600" />
                <h3 className="font-black text-base text-slate-900">Cấp Tài Khoản Mới</h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-2xl flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email đăng nhập *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ví dụ: bame@gmail.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mật khẩu (ít nhất 6 ký tự) *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPass ? "text" : "password"}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-purple-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phân quyền vai trò *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedRole("staff")}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all text-left ${
                      selectedRole === "staff"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span className="block font-black">Thu Ngân (POS)</span>
                    <span className="text-[10px] text-slate-500 font-normal">Chỉ bán hàng trên Android</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedRole("admin")}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all text-left ${
                      selectedRole === "admin"
                        ? "border-indigo-500 bg-indigo-50 text-indigo-800"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span className="block font-black">Quản Trị (Admin)</span>
                    <span className="text-[10px] text-slate-500 font-normal">Toàn quyền hệ thống</span>
                  </button>
                </div>
              </div>

              <div className="flex space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-2xl transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-sm rounded-2xl shadow-lg shadow-purple-600/30 flex items-center justify-center space-x-1.5 transition-colors"
                >
                  <Users className="w-4 h-4" />
                  <span>{isCreating ? "Đang tạo..." : "Xác nhận cấp"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffPage;
