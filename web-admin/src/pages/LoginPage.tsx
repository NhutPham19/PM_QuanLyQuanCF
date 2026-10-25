import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Coffee, Lock, Mail, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../auth/AuthProvider";

export const LoginPage: React.FC = () => {
  const { login, user, role } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Nếu đã đăng nhập với quyền admin thì chuyển thẳng về trang chủ
  React.useEffect(() => {
    if (user && role === "admin") {
      navigate("/", { replace: true });
    }
  }, [user, role, navigate]);

  const parseFirebaseError = (err: unknown): string => {
    const code = (err as { code?: string })?.code;
    switch (code) {
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
        return "Email hoặc mật khẩu không chính xác!";
      case "auth/invalid-email":
        return "Định dạng email không hợp lệ!";
      case "auth/too-many-requests":
        return "Quá nhiều lần thử thất bại. Vui lòng thử lại sau ít phút!";
      case "auth/network-request-failed":
        return "Lỗi kết nối mạng. Vui lòng kiểm tra lại đường truyền internet!";
      default:
        return (err as Error)?.message || "Đăng nhập thất bại. Vui lòng thử lại!";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError("Vui lòng nhập đầy đủ Email và Mật khẩu!");
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
      navigate("/", { replace: true });
    } catch (err: unknown) {
      setError(parseFirebaseError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-800/90 backdrop-blur-xl border border-slate-700/80 rounded-3xl p-8 shadow-2xl text-white">
        {/* Brand Icon */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-4">
            <Coffee className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">Cà Phê Gia Đình</h1>
          <p className="text-xs text-indigo-300 font-semibold mt-1 uppercase tracking-wider">
            Bảng Quản Trị Viên (Admin)
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
              Email Quản Trị
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@quanlycf.com"
                className="w-full pl-11 pr-4 py-3 bg-slate-900/80 border border-slate-700 rounded-2xl text-sm font-medium text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
              Mật Khẩu
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-11 py-3 bg-slate-900/80 border border-slate-700 rounded-2xl text-sm font-medium text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm rounded-2xl shadow-lg shadow-indigo-600/30 transition-all duration-150"
          >
            {loading ? "Đang xác thực..." : "Đăng Nhập Quản Trị"}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 mt-6 font-medium">
          Hệ thống nội bộ khép kín • Dành riêng cho Quản trị viên
        </p>
      </div>
    </div>
  );
};
