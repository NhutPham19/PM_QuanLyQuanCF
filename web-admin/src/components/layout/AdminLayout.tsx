import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";
import { MobileMenuDrawer } from "./MobileMenuDrawer";

interface AdminLayoutProps {
  userEmail?: string | null;
  onLogout?: () => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ userEmail, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      {/* Desktop Sidebar */}
      <Sidebar onLogout={onLogout} />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          userEmail={userEmail}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        />

        <main className="flex-1 p-4 md:p-8 pb-24 md:pb-10 max-w-5xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />

      {/* Mobile Sliding Drawer */}
      <MobileMenuDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        onLogout={onLogout}
        userEmail={userEmail}
      />
    </div>
  );
};
