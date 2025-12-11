import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Layout from "@/components/ca/Layout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Clients from "@/pages/Clients";
import Tasks from "@/pages/Tasks";
import TaskDetail from "@/pages/TaskDetail";
import Employees from "@/pages/Employees";
import Help from "@/pages/Help";
import Invoices from "@/pages/Invoices";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => {
  const { user, loading, signOut } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      
      <Route element={
        <ProtectedRoute>
          <Layout user={user} onLogout={signOut} />
        </ProtectedRoute>
      }>
        <Route path="/" element={<Dashboard user={user!} />} />
        <Route path="/clients" element={<Clients user={user!} />} />
        <Route path="/tasks" element={<Tasks user={user!} />} />
        <Route path="/tasks/:id" element={<TaskDetail user={user!} />} />
        <Route path="/employees" element={<Employees user={user!} />} />
        <Route path="/invoices" element={<Invoices user={user!} />} />
        <Route path="/help" element={<Help user={user!} />} />
      </Route>
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
