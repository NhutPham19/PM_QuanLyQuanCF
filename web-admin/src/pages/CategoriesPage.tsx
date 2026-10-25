import React from "react";
import { FolderTree } from "lucide-react";

export const CategoriesPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Danh Mục & Loại Chi Phí</h1>
        <p className="text-xs md:text-sm text-slate-500 font-medium">
          Quản lý các nhóm đồ uống và nút danh mục chi tiền nhanh của quán
        </p>
      </div>

      <div className="rounded-3xl bg-white p-8 border border-slate-200/80 shadow-sm text-center">
        <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-3">
          <FolderTree className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-slate-800 text-base">Phân hệ Danh Mục & Chi Phí</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Hỗ trợ 2 Tab: Danh mục đồ uống (`categories`) và Danh mục chi (`expense_categories`).
        </p>
      </div>
    </div>
  );
};
