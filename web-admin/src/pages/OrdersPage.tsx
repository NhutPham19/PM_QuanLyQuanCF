import React from "react";
import { Receipt } from "lucide-react";

export const OrdersPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Lịch Sử Đơn Hàng</h1>
        <p className="text-xs md:text-sm text-slate-500 font-medium">
          Xem đơn hàng bán ra theo ngày & Thao tác Hủy / Khôi phục đơn hàng nguyên tử
        </p>
      </div>

      <div className="rounded-3xl bg-white p-8 border border-slate-200/80 shadow-sm text-center">
        <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mx-auto mb-3">
          <Receipt className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-slate-800 text-base">Phân hệ Lịch Sử Đơn Hàng</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Bộ lọc theo ngày, trạng thái ACTIVE/VOIDED, và logic hủy đơn hoàn tồn kho trong Phase 4 & Phase 6.
        </p>
      </div>
    </div>
  );
};
