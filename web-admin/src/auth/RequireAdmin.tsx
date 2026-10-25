import React, { type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";

export const RequireAdmin: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl border-4 border-indigo-500/20 border-t-indigo-500 animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-400">Đang khởi động hệ thống...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Cho phép tất cả tài khoản đăng nhập đều có thể truy cập và kiểm thử theo yêu cầu
  return <>{children}</>;
};
