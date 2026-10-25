import React from "react";
import { Users } from "lucide-react";

export const StaffPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Phân Quyền & Cấp Tài Khoản</h1>
        <p className="text-xs md:text-sm text-slate-500 font-medium">
          Quản lý tài khoản Admin và tạo tài khoản Thu ngân POS cho Ba Mẹ
        </p>
      </div>

      <div className="rounded-3xl bg-white p-8 border border-slate-200/80 shadow-sm text-center">
        <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-3">
          <Users className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-slate-800 text-base">Phân hệ Cấp Tài Khoản Nhân Viên</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Tạo user an toàn bằng Firebase App phụ không làm mất phiên đăng nhập Admin trong Phase 7.
        </p>
      </div>
    </div>
  );
};
