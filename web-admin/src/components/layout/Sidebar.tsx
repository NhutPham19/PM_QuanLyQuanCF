import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Coffee,
  FolderTree,
  Receipt,
  Coins,
  BarChart3,
  FileSpreadsheet,
  Users,
  LogOut,
  Coffee as CoffeeIcon,
} from "lucide-react";

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { to: "/", label: "Tổng Quan", icon: LayoutDashboard },
  { to: "/products", label: "Món Ăn & Giá", icon: Coffee },
  { to: "/categories", label: "Danh Mục & Chi", icon: FolderTree },
  { to: "/orders", label: "Lịch Sử Đơn", icon: Receipt },
  { to: "/expenses", label: "Sổ Chi Phí", icon: Coins },
  { to: "/reports", label: "Báo Cáo Tháng", icon: BarChart3 },
  { to: "/export", label: "Xuất Dữ Liệu", icon: FileSpreadsheet },
  { to: "/staff", label: "Phân Quyền", icon: Users },
];

interface SidebarProps {
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onLogout }) => {
  return (
    <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white min-h-screen border-r border-slate-800 shrink-0">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <CoffeeIcon className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-base tracking-tight text-white">Cà Phê Gia Đình</h1>
          <p className="text-xs text-indigo-400 font-medium">Bảng Quản Trị Admin</p>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all duration-150 ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User Footer & Logout */}
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center space-x-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-rose-400 hover:text-white hover:bg-rose-500/20 transition-all duration-150"
        >
          <LogOut className="w-4 h-4" />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
};
