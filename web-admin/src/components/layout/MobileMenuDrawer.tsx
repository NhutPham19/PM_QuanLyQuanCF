import React from "react";
import { NavLink } from "react-router-dom";
import {
  X,
  LayoutDashboard,
  Coffee,
  FolderTree,
  Receipt,
  Coins,
  BarChart3,
  FileSpreadsheet,
  Users,
  LogOut,
} from "lucide-react";

interface MobileMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout?: () => void;
  userEmail?: string | null;
}

const allNavItems = [
  { to: "/", label: "Tổng Quan Doanh Thu", icon: LayoutDashboard },
  { to: "/products", label: "Quản Lý Món Ăn & Giá", icon: Coffee },
  { to: "/categories", label: "Danh Mục & Loại Chi", icon: FolderTree },
  { to: "/orders", label: "Lịch Sử Đơn Hàng", icon: Receipt },
  { to: "/expenses", label: "Sổ Tiền & Chi Phí", icon: Coins },
  { to: "/reports", label: "Báo Cáo Doanh Thu Tháng", icon: BarChart3 },
  { to: "/export", label: "Xuất Dữ Liệu CSV", icon: FileSpreadsheet },
  { to: "/staff", label: "Phân Quyền & Cấp Tài Khoản", icon: Users },
];

export const MobileMenuDrawer: React.FC<MobileMenuDrawerProps> = ({
  isOpen,
  onClose,
  onLogout,
  userEmail,
}) => {
  if (!isOpen) return null;

  return (
    <div className="md:hidden fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div className="relative w-4/5 max-w-xs bg-slate-900 text-white min-h-screen flex flex-col z-10 shadow-2xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-base text-white">Menu Quản Trị</h2>
            {userEmail && <p className="text-xs text-indigo-400 truncate max-w-[200px]">{userEmail}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {allNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-colors ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`
                }
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={() => {
              onClose();
              onLogout?.();
            }}
            className="w-full flex items-center justify-center space-x-2 px-3 py-3 rounded-xl text-sm font-semibold text-rose-400 hover:text-white hover:bg-rose-500/20 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng xuất tài khoản</span>
          </button>
        </div>
      </div>
    </div>
  );
};
