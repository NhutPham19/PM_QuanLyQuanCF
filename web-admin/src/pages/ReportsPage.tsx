import React from "react";
import { BarChart3 } from "lucide-react";

export const ReportsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Báo Cáo Doanh Thu Tháng</h1>
        <p className="text-xs md:text-sm text-slate-500 font-medium">
          Thống kê doanh thu, chi phí, lợi nhuận ròng và sao kê từng ngày
        </p>
      </div>

      <div className="rounded-3xl bg-white p-8 border border-slate-200/80 shadow-sm text-center">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
          <BarChart3 className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-slate-800 text-base">Phân hệ Báo Cáo & Đối Soát</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Bộ chọn tháng, bảng sao kê ngày và nút recalculateDay đối soát dữ liệu.
        </p>
      </div>
    </div>
  );
};
