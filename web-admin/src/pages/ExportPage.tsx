import React from "react";
import { FileSpreadsheet } from "lucide-react";

export const ExportPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Xuất Dữ Liệu CSV / Excel</h1>
        <p className="text-xs md:text-sm text-slate-500 font-medium">
          Tải file CSV danh sách đơn hàng và phiếu chi hỗ trợ mở bằng Microsoft Excel tiếng Việt
        </p>
      </div>

      <div className="rounded-3xl bg-white p-8 border border-slate-200/80 shadow-sm text-center">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
          <FileSpreadsheet className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-slate-800 text-base">Phân hệ Xuất Báo Cáo CSV</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Xuất dữ liệu theo tháng có kèm mã BOM UTF-8 chống lỗi font tiếng Việt.
        </p>
      </div>
    </div>
  );
};
