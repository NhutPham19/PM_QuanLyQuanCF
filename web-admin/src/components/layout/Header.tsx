import React from "react";
import { Menu, Coffee, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";

interface HeaderProps {
  userEmail?: string | null;
  onOpenMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ userEmail, onOpenMobileMenu }) => {
  return (
    <header
      className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 md:px-8 pb-3 flex items-center justify-between transition-all"
      style={{ paddingTop: "max(env(safe-area-inset-top, 0px), 14px)" }}
    >
      {/* Mobile Brand / Title */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          aria-label="Mở menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center md:hidden shadow-sm">
            <Coffee className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-extrabold text-sm md:text-base text-slate-900 block leading-tight">
              Quản Trị Viên
            </span>
            <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
              Cà Phê Gia Đình
            </span>
          </div>
        </div>
      </div>

      {/* Nút Chuyển Sang Máy Bán Hàng & Online Status */}
      <div className="flex items-center space-x-2.5">
        <Link
          to="/pos"
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-sm transition-all active:scale-95"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Máy Bán Hàng</span>
        </Link>

        <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200/60">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Trực tuyến</span>
        </div>

        {userEmail && (
          <span className="hidden md:inline-block text-xs font-semibold text-slate-600 max-w-[160px] truncate">
            {userEmail}
          </span>
        )}
      </div>
    </header>
  );
};
