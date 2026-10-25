import React, { type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { ShieldAlert, LogOut } from "lucide-react";

export const RequireAdmin: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, role, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl border-4 border-indigo-500/20 border-t-indigo-500 animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-400">Đang kiểm tra quyền quản trị...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role !== "admin") {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-800/90 backdrop-blur-xl border border-rose-500/30 rounded-3xl p-8 text-center text-white shadow-2xl">
          <div className="w-16 h-16 rounded-3xl bg-rose-500/15 border border-rose-500/40 flex items-center justify-center mx-auto mb-5 text-rose-400">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-white">Truy Cập Bị Từ Chối</h2>
          <p className="text-xs text-slate-300 mt-2 leading-relaxed">
            Tài khoản <span className="font-bold text-indigo-300">{user.email}</span> được phân quyền là Thu Ngân (POS) dành cho Ba Mẹ bán hàng trên máy Android.
          </p>
          <p className="text-xs text-slate-400 mt-2">
            Chỉ tài khoản Quản Trị Viên mới có quyền truy cập Bảng Quản Trị Web này.
          </p>

          <button
            onClick={logout}
            className="mt-6 w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-2xl shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Đổi tài khoản khác</span>
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
