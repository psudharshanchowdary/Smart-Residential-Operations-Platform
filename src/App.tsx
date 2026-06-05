import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { SocketProvider } from "@/contexts/SocketContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import NewMaintenanceRequest from "./pages/NewMaintenanceRequest";
import MaintenanceStatus from "./pages/MaintenanceStatus";
import PaymentPage from "./pages/PaymentPage";
import PaymentSuccess from "./pages/PaymentSuccess";
import AdminDashboard from "./pages/AdminDashboard";
import CommunityPage from "./pages/CommunityPage";
import ProfilePage from "./pages/ProfilePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

const ProtectedRoute = ({ children, role }: { children: React.ReactNode; role?: string }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground text-sm animate-pulse">Loading…</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;
  if (role && user.role !== role)
    return <Navigate to={user.role === "admin" ? "/admin" : "/dashboard"} replace />;
  return <>{children}</>;
};

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground text-sm animate-pulse">Loading…</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to={user.role === "admin" ? "/admin" : "/dashboard"} replace /> : <Login />} />
      <Route path="/dashboard" element={<ProtectedRoute role="resident"><Dashboard /></ProtectedRoute>} />
      <Route path="/maintenance" element={<ProtectedRoute role="resident"><MaintenanceStatus /></ProtectedRoute>} />
      <Route path="/maintenance/new" element={<ProtectedRoute role="resident"><NewMaintenanceRequest /></ProtectedRoute>} />
      <Route path="/payment" element={<ProtectedRoute role="resident"><PaymentPage /></ProtectedRoute>} />
      <Route path="/payment/success" element={<ProtectedRoute role="resident"><PaymentSuccess /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/community" element={<ProtectedRoute><CommunityPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <SocketProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </SocketProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
