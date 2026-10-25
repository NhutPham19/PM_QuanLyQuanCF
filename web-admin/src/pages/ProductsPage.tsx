import React from "react";
import { Coffee, Plus } from "lucide-react";

export const ProductsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Món Ăn & Giá Bán</h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium">
            Quản lý thực đơn 2 mức giá (Tại quán / Mang về) & Tồn kho
          </p>
        </div>
        <button className="flex items-center space-x-1.5 px-4 py-2.5 rounded-2xl bg-indigo-600 text-white font-bold text-sm shadow-md shadow-indigo-600/30 hover:bg-indigo-700 transition-all">
          <Plus className="w-4 h-4" />
          <span>Thêm món</span>
        </button>
      </div>

      <div className="rounded-3xl bg-white p-8 border border-slate-200/80 shadow-sm text-center">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
          <Coffee className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-slate-800 text-base">Phân hệ Quản Lý Món Ăn</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Sẽ được kết nối đầy đủ Firestore CRUD, upload ảnh Cloudinary và 2 mức giá trong Phase 5.
        </p>
      </div>
    </div>
  );
};
