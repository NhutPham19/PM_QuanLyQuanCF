import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthProvider";
import { RequireAdmin } from "./auth/RequireAdmin";
import { AdminLayout } from "./components/layout/AdminLayout";
import { Loader2 } from "lucide-react";

// Lazy-loaded routes for minimal initial load bundle (< 100KB gzip)
const DashboardPage = lazy(() =>
  import("./pages/DashboardPage").then((m) => ({ default: m.DashboardPage }))
);
const ProductsPage = lazy(() =>
  import("./pages/ProductsPage").then((m) => ({ default: m.ProductsPage }))
);
const CategoriesPage = lazy(() =>
  import("./pages/CategoriesPage").then((m) => ({ default: m.CategoriesPage }))
);
const OrdersPage = lazy(() =>
  import("./pages/OrdersPage").then((m) => ({ default: m.OrdersPage }))
);
const ExpensesPage = lazy(() =>
  import("./pages/ExpensesPage").then((m) => ({ default: m.ExpensesPage }))
);
const ReportsPage = lazy(() =>
  import("./pages/ReportsPage").then((m) => ({ default: m.ReportsPage }))
);
const ExportPage = lazy(() =>
  import("./pages/ExportPage").then((m) => ({ default: m.ExportPage }))
);
const StaffPage = lazy(() =>
  import("./pages/StaffPage").then((m) => ({ default: m.StaffPage }))
);
const PosPage = lazy(() =>
  import("./pages/PosPage").then((m) => ({ default: m.PosPage }))
);
const LoginPage = lazy(() =>
  import("./pages/LoginPage").then((m) => ({ default: m.LoginPage }))
);

const PageLoader: React.FC = () => (
  <div className="flex h-64 items-center justify-center">
    <div className="flex flex-col items-center gap-3 text-neutral-400">
      <Loader2 className="w-7 h-7 animate-spin text-indigo-600" />
      <span className="text-xs font-medium">Đang tải phân hệ...</span>
    </div>
  </div>
);

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
        <Suspense fallback={<PageLoader />}>
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

            {/* Máy Bán Hàng POS Trực Tuyến */}
            <Route
              path="/pos"
              element={
                <RequireAdmin>
                  <PosPage />
                </RequireAdmin>
              }
            />

            {/* Public Login Route */}
            <Route path="/login" element={<LoginPage />} />

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
