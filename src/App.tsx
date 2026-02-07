import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuthContext } from "@/contexts/AuthContext";
import Login from "./pages/Login";
import SimpleLayout from "./components/layout/SimpleLayout";
import Dashboard from "./pages/Dashboard";
import POS from "./pages/POS";
import KDS from "./pages/KDS";
import Orders from "./pages/Orders";
import MenuManagement from "./pages/MenuManagement";
import Tables from "./pages/Tables";
import WarehouseManagement from "./pages/WarehouseManagement";
import Inventory from "./pages/Inventory";
import DishManagement from "./pages/DishManagement";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import UserManagement from "./pages/UserManagement";
import FinancialManagement from "./pages/FinancialManagement";
import CRM from "./pages/CRM";
import Suppliers from "./pages/Suppliers";
import OnlineMenu from "./pages/OnlineMenu";
import PublicMenu from "./pages/PublicMenu";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

import Unauthorized from "./pages/Unauthorized";
import { AppRole } from "./hooks/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: AppRole[];
  requiredPermission?: string;
}

const ProtectedRoute = ({ children, allowedRoles, requiredPermission }: ProtectedRouteProps) => {
  const { isAuthenticated, loading, hasRole, hasPermission } = useAuthContext();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.some(role => hasRole(role))) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <SimpleLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="pos" element={
            <ProtectedRoute requiredPermission="pos">
              <POS />
            </ProtectedRoute>
          } />
          <Route path="orders" element={
            <ProtectedRoute requiredPermission="orders">
              <Orders />
            </ProtectedRoute>
          } />
          <Route path="kds" element={
            <ProtectedRoute requiredPermission="kds">
              <KDS />
            </ProtectedRoute>
          } />
          <Route path="menu" element={
            <ProtectedRoute requiredPermission="menu">
              <MenuManagement />
            </ProtectedRoute>
          } />
          <Route path="tables" element={
            <ProtectedRoute requiredPermission="tables">
              <Tables />
            </ProtectedRoute>
          } />
          <Route path="inventory" element={
            <ProtectedRoute requiredPermission="inventory">
              <Inventory />
            </ProtectedRoute>
          } />
          <Route path="dishes" element={
            <ProtectedRoute requiredPermission="inventory">
              <DishManagement />
            </ProtectedRoute>
          } />
          <Route path="warehouse" element={
            <ProtectedRoute requiredPermission="inventory">
              <WarehouseManagement />
            </ProtectedRoute>
          } />
          <Route path="finance" element={
            <ProtectedRoute requiredPermission="finance">
              <FinancialManagement />
            </ProtectedRoute>
          } />
          <Route path="crm" element={
            <ProtectedRoute requiredPermission="crm">
              <CRM />
            </ProtectedRoute>
          } />
          <Route path="suppliers" element={
            <ProtectedRoute requiredPermission="suppliers">
              <Suppliers />
            </ProtectedRoute>
          } />
          <Route path="online-menu" element={
            <ProtectedRoute requiredPermission="menu">
              <OnlineMenu />
            </ProtectedRoute>
          } />
          <Route path="reports" element={
            <ProtectedRoute requiredPermission="reports">
              <Reports />
            </ProtectedRoute>
          } />
          <Route path="settings" element={
            <ProtectedRoute requiredPermission="settings">
              <Settings />
            </ProtectedRoute>
          } />
          <Route path="users" element={
            <ProtectedRoute requiredPermission="users">
              <UserManagement />
            </ProtectedRoute>
          } />
        </Route>
        <Route path="/menu/:slug" element={<PublicMenu />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter >
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppRoutes />
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
