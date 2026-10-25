import React from "react";
import { Link } from "react-router-dom";
import {
  Coffee,
  FolderTree,
  Receipt,
  Coins,
  BarChart3,
  FileSpreadsheet,
  Users,
  TrendingUp,
  ArrowRight,
} from "lucide-react";

export const DashboardPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
          Tổng Quan Doanh Thu
        </h1>
        <p className="text-sm text-slate-500 font-medium">
          Dữ liệu thời gian thực được đồng bộ trực tiếp từ máy bán hàng POS
        </p>
      </div>

      {/* Hero Bento Card - Doanh thu hôm nay (Placeholder for Phase 3) */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-indigo-900 p-6 md:p-8 text-white shadow-xl shadow-indigo-950/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-extrabold text-indigo-300 flex items-center space-x-1.5">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              <span>Doanh Thu Hôm Nay</span>
            </span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-sm text-slate-200 font-medium">
              Realtime
            </span>
          </div>

          <div className="mt-3 text-4xl md:text-5xl font-black tracking-tight text-white">
            0 ₫
          </div>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            (Đang nạp kết nối Firestore trong Phase 3)
          </p>

          <div className="grid grid-cols-3 gap-2 md:gap-4 mt-6 pt-5 border-t border-white/10 text-center">
            <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-2.5 md:p-3">
              <p className="text-[11px] text-orange-300 font-bold">Tiền đã chi</p>
              <p className="text-sm md:text-base font-extrabold text-white mt-0.5">0 ₫</p>
            </div>
            <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-2.5 md:p-3">
              <p className="text-[11px] text-emerald-300 font-bold">Còn lại (Bán - Chi)</p>
              <p className="text-sm md:text-base font-extrabold text-white mt-0.5">0 ₫</p>
            </div>
            <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-2.5 md:p-3">
              <p className="text-[11px] text-indigo-300 font-bold">Số đơn bán</p>
              <p className="text-sm md:text-base font-extrabold text-white mt-0.5">0 đơn</p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Quick Navigation Bento Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Link
          to="/products"
          className="group rounded-3xl bg-white p-5 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all duration-200 flex flex-col justify-between"
        >
          <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Coffee className="w-5 h-5" />
          </div>
          <div className="mt-4">
            <h3 className="font-bold text-sm text-slate-900">Món Ăn & Giá</h3>
            <p className="text-xs text-slate-500 mt-0.5">2 mức giá Tại quán / Mang về</p>
          </div>
          <div className="mt-3 flex items-center text-xs font-bold text-sky-600">
            <span>Chi tiết</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link
          to="/categories"
          className="group rounded-3xl bg-white p-5 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all duration-200 flex flex-col justify-between"
        >
          <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <FolderTree className="w-5 h-5" />
          </div>
          <div className="mt-4">
            <h3 className="font-bold text-sm text-slate-900">Danh Mục & Chi</h3>
            <p className="text-xs text-slate-500 mt-0.5">Nhóm đồ uống & loại chi</p>
          </div>
          <div className="mt-3 flex items-center text-xs font-bold text-teal-600">
            <span>Chi tiết</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link
          to="/orders"
          className="group rounded-3xl bg-white p-5 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all duration-200 flex flex-col justify-between"
        >
          <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Receipt className="w-5 h-5" />
          </div>
          <div className="mt-4">
            <h3 className="font-bold text-sm text-slate-900">Lịch Sử Đơn</h3>
            <p className="text-xs text-slate-500 mt-0.5">Xem đơn & nút Hủy/Khôi phục</p>
          </div>
          <div className="mt-3 flex items-center text-xs font-bold text-orange-600">
            <span>Chi tiết</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link
          to="/expenses"
          className="group rounded-3xl bg-white p-5 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all duration-200 flex flex-col justify-between"
        >
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Coins className="w-5 h-5" />
          </div>
          <div className="mt-4">
            <h3 className="font-bold text-sm text-slate-900">Sổ Chi Tiền</h3>
            <p className="text-xs text-slate-500 mt-0.5">Nhập hàng & mua đồ dùng</p>
          </div>
          <div className="mt-3 flex items-center text-xs font-bold text-amber-600">
            <span>Chi tiết</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link
          to="/reports"
          className="group rounded-3xl bg-white p-5 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all duration-200 flex flex-col justify-between"
        >
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div className="mt-4">
            <h3 className="font-bold text-sm text-slate-900">Báo Cáo Tháng</h3>
            <p className="text-xs text-slate-500 mt-0.5">Lợi nhuận & sao kê từng ngày</p>
          </div>
          <div className="mt-3 flex items-center text-xs font-bold text-emerald-600">
            <span>Chi tiết</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link
          to="/staff"
          className="group rounded-3xl bg-white p-5 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all duration-200 flex flex-col justify-between"
        >
          <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Users className="w-5 h-5" />
          </div>
          <div className="mt-4">
            <h3 className="font-bold text-sm text-slate-900">Cấp Tài Khoản</h3>
            <p className="text-xs text-slate-500 mt-0.5">Phân quyền Admin & POS</p>
          </div>
          <div className="mt-3 flex items-center text-xs font-bold text-purple-600">
            <span>Chi tiết</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link
          to="/export"
          className="group rounded-3xl bg-white p-5 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all duration-200 flex flex-col justify-between"
        >
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div className="mt-4">
            <h3 className="font-bold text-sm text-slate-900">Xuất Báo Cáo CSV</h3>
            <p className="text-xs text-slate-500 mt-0.5">Xuất file Excel tiếng Việt</p>
          </div>
          <div className="mt-3 flex items-center text-xs font-bold text-indigo-600">
            <span>Chi tiết</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>
    </div>
  );
};
