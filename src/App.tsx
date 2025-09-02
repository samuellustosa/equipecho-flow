import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar"; // <-- Importe o SidebarProvider

// Components
import { AuthProvider } from "@/components/AuthProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { MainLayout } from "@/components/MainLayout";

// Pages
import { Auth } from "./pages/Auth";
import { Dashboard } from "./pages/Dashboard";
import { Equipments } from "./pages/Equipments";
import { Inventory } from "./pages/Inventory";
import { Users } from "./pages/Users";
import { Settings } from "./pages/Settings";
import { Faqs } from "./pages/Faqs";
import { HelpCenter } from "./pages/HelpCenter";
import { Announcements } from "./pages/Announcements";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <SidebarProvider> {/* <-- Envolva o MainLayout com o SidebarProvider */}
            <Routes>
              {/* Public Routes */}
              <Route path="/auth" element={<Auth />} />
              
              {/* Protected Routes */}
              <Route path="/" element={
                <ProtectedRoute>
                  <MainLayout>
                    <Dashboard />
                  </MainLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/equipments" element={
                <ProtectedRoute>
                  <MainLayout>
                    <Equipments />
                  </MainLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/inventory" element={
                <ProtectedRoute allowedRoles={['admin', 'manager']}>
                  <MainLayout>
                    <Inventory />
                  </MainLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/users" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <MainLayout>
                    <Users />
                  </MainLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/settings" element={
                <ProtectedRoute>
                  <MainLayout>
                    <Settings />
                  </MainLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/faqs" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <MainLayout>
                    <Faqs />
                  </MainLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/announcements" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <MainLayout>
                    <Announcements />
                  </MainLayout>
                </ProtectedRoute>
              } />
              
              {/* Rota pública para a Central de Ajuda */}
              <Route path="/help-center" element={
                <MainLayout>
                  <HelpCenter />
                </MainLayout>
              } />
              
              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </SidebarProvider>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;