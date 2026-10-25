import React from "react";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, Coffee, Receipt, BarChart3, MoreHorizontal } from "lucide-react";

interface BottomNavProps {
  onOpenMobileMenu: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ onOpenMobileMenu }) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-2 py-1 pb-[max(env(safe-area-inset-bottom),8px)] shadow-lg shadow-black/5">
      <div className="flex items-center justify-around">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 rounded-xl text-[11px] font-semibold transition-colors ${
              isActive ? "text-indigo-600" : "text-slate-500 hover:text-slate-900"
            }`
          }
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span>Tổng quan</span>
        </NavLink>

        <NavLink
          to="/products"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 rounded-xl text-[11px] font-semibold transition-colors ${
              isActive ? "text-indigo-600" : "text-slate-500 hover:text-slate-900"
            }`
          }
        >
          <Coffee className="w-5 h-5 mb-0.5" />
          <span>Món ăn</span>
        </NavLink>

        <NavLink
          to="/orders"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 rounded-xl text-[11px] font-semibold transition-colors ${
              isActive ? "text-indigo-600" : "text-slate-500 hover:text-slate-900"
            }`
          }
        >
          <Receipt className="w-5 h-5 mb-0.5" />
          <span>Đơn hàng</span>
        </NavLink>

        <NavLink
          to="/reports"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 rounded-xl text-[11px] font-semibold transition-colors ${
              isActive ? "text-indigo-600" : "text-slate-500 hover:text-slate-900"
            }`
          }
        >
          <BarChart3 className="w-5 h-5 mb-0.5" />
          <span>Báo cáo</span>
        </NavLink>

        <button
          onClick={onOpenMobileMenu}
          className="flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 rounded-xl text-[11px] font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <MoreHorizontal className="w-5 h-5 mb-0.5" />
          <span>Khác</span>
        </button>
      </div>
    </nav>
  );
};
