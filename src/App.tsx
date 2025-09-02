import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

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
          <Routes>
            {/* Rota pública para a tela de login */}
            <Route path="/auth" element={<Auth />} />
            
            {/* Rota aninhada que usa o MainLayout e o Sidebar */}
            <Route element={<MainLayout />}>
              <Route path="/" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/equipments" element={
                <ProtectedRoute>
                  <Equipments />
                </ProtectedRoute>
              } />
              
              <Route path="/inventory" element={
                <ProtectedRoute allowedRoles={['admin', 'manager']}>
                  <Inventory />
                </ProtectedRoute>
              } />
              
              <Route path="/users" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Users />
                </ProtectedRoute>
              } />
              
              <Route path="/settings" element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } />
              
              <Route path="/faqs" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Faqs />
                </ProtectedRoute>
              } />
              
              <Route path="/announcements" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Announcements />
                </ProtectedRoute>
              } />
              
              {/* Rota pública que utiliza o layout, mas não a proteção */}
              <Route path="/help-center" element={<HelpCenter />} />
            </Route>
            
            {/* Rota para páginas não encontradas */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;