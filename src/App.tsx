import { Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./components/ThemeProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/sonner";
import { AuthProvider } from "./components/AuthProvider";
import { Auth } from "./pages/Auth";
import { RedirectAfterAuth } from "./pages/RedirectAfterAuth";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { MainLayout } from "./components/MainLayout";
import { Dashboard } from "./pages/Dashboard";
import { Equipments } from "./pages/Equipments";
import { Inventory } from "./pages/Inventory";
import { Users } from "./pages/Users";
import { AuditLogs } from "./pages/AuditLogs";
import { WaitingForApproval } from "./pages/WaitingForApproval";
import { Settings } from "./pages/Settings";
import { Faqs } from "./pages/Faqs";
import { HelpCenter } from "./pages/HelpCenter";
import { Announcements } from "./pages/Announcements";
import NotFound from "./pages/NotFound";
import { EmailConfirmation } from './pages/EmailConfirmation';
import { useAuth } from './hooks/useAuth';
import { UpdatePassword } from "./pages/UpdatePassword";


const queryClient = new QueryClient();

export default function App() {
  const { authState } = useAuth();
  const { isAuthenticated, isPending } = authState;

  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
            <Routes>
              {/* Rotas públicas (sem necessidade de autenticação) */}
              <Route path="/auth" element={<Auth />} />
              <Route path="/auth/callback" element={<RedirectAfterAuth />} />
              <Route path="/auth/update-password" element={<UpdatePassword />} />
              <Route path="/email-confirmation" element={<EmailConfirmation />} />
              <Route path="/waiting-for-approval" element={<WaitingForApproval />} />

              {/* Rota protegida: garante que o usuário esteja logado e com aprovação */}
              <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="equipments" element={<Equipments />} />
                <Route path="inventory" element={<Inventory />} />
                <Route path="users" element={<Users />} />
                <Route path="audit-logs" element={<AuditLogs />} />
                <Route path="settings" element={<Settings />} />
                <Route path="announcements" element={<Announcements />} />
                <Route path="faqs" element={<Faqs />} />
                <Route path="help-center" element={<HelpCenter />} />
              </Route>
              
              {/* Rota para lidar com URLs não encontradas */}
              <Route path="*" element={<NotFound />} />
            </Routes>
        </AuthProvider>
      </QueryClientProvider>
      <Toaster />
    </ThemeProvider>
  );
}