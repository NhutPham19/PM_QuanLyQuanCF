import React from "react";
import { Coins } from "lucide-react";

export const ExpensesPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Sổ Tiền & Chi Phí</h1>
        <p className="text-xs md:text-sm text-slate-500 font-medium">
          Quản lý phiếu chi tiền nhập hàng (thùng/lon) và mua đồ dùng quán
        </p>
      </div>

      <div className="rounded-3xl bg-white p-8 border border-slate-200/80 shadow-sm text-center">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
          <Coins className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-slate-800 text-base">Phân hệ Sổ Chi Tiền</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Theo dõi các khoản chi tiền, phân loại RESTOCK và SUPPLIES.
        </p>
      </div>
    </div>
  );
};
