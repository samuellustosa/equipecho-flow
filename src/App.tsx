// src/App.tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { Inventory } from './pages/Inventory';
import { Equipments } from './pages/Equipments';
import { Auth } from './pages/Auth';
import { ProtectedRoute } from './components/ProtectedRoute';
import { MainLayout } from './components/MainLayout';
import { Settings } from './pages/Settings';
import { Users } from './pages/Users';
import { Faqs } from './pages/Faqs';
import { Announcements } from './pages/Announcements';
import { HelpCenter } from './pages/HelpCenter';
import NotFound from './pages/NotFound';
import { WaitingForApproval } from './pages/WaitingForApproval';
import { EmailConfirmation } from './pages/EmailConfirmation';
import TestNotifications from './pages/TestNotifications';
import { useAuth } from './hooks/useAuth';
import { RedirectAfterAuth } from './pages/RedirectAfterAuth';

function App() {
  const { authState } = useAuth();
  const { isAuthenticated, isPending } = authState;

  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route path="/email-confirmation" element={<EmailConfirmation />} />
      <Route path="/pending-approval" element={<WaitingForApproval />} />
      <Route path="/auth/callback" element={<RedirectAfterAuth />} />

      <Route
        path="/"
        element={
          !isAuthenticated ? (
            <Navigate to="/auth" replace />
          ) : isPending ? (
            <Navigate to="/pending-approval" replace />
          ) : (
            <MainLayout />
          )
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="inventory" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><Inventory /></ProtectedRoute>} />
        <Route path="equipments" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><Equipments /></ProtectedRoute>} />
        <Route path="settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="users" element={<ProtectedRoute allowedRoles={['admin']}><Users /></ProtectedRoute>} />
        <Route path="faqs" element={<ProtectedRoute><Faqs /></ProtectedRoute>} />
        <Route path="announcements" element={<ProtectedRoute><Announcements /></ProtectedRoute>} />
        <Route path="help-center" element={<ProtectedRoute><HelpCenter /></ProtectedRoute>} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;