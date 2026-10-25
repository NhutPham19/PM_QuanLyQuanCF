import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthProvider";
import { RequireAdmin } from "./auth/RequireAdmin";
import { AdminLayout } from "./components/layout/AdminLayout";
import { DashboardPage } from "./pages/DashboardPage";
import { ProductsPage } from "./pages/ProductsPage";
import { CategoriesPage } from "./pages/CategoriesPage";
import { OrdersPage } from "./pages/OrdersPage";
import { ExpensesPage } from "./pages/ExpensesPage";
import { ReportsPage } from "./pages/ReportsPage";
import { ExportPage } from "./pages/ExportPage";
import { StaffPage } from "./pages/StaffPage";
import { LoginPage } from "./pages/LoginPage";

const ProtectedAdminApp: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <RequireAdmin>
      <AdminLayout userEmail={user?.email} onLogout={logout} />
    </RequireAdmin>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Main Admin Protected Routes */}
          <Route path="/" element={<ProtectedAdminApp />}>
            <Route index element={<DashboardPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="expenses" element={<ExpensesPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="export" element={<ExportPage />} />
            <Route path="staff" element={<StaffPage />} />
          </Route>

          {/* Public Login Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
