// src/components/ProtectedRoute.tsx
import { useAuth } from '@/hooks/useAuth';
import { Navigate, useLocation } from 'react-router-dom';
import React from 'react';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('admin' | 'manager' | 'user' | 'pending')[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles = ['admin', 'manager', 'user'] 
}) => {
  const { authState } = useAuth();
  const location = useLocation();
  const { isAuthenticated, isLoading, user, isPending, showSessionExpiredDialog } = authState;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Carregando...
        </div>
      </div>
    );
  }
  
  // A LÓGICA DE PROTEÇÃO DE ROTA FOI AJUSTADA AQUI
  // Só redireciona para a autenticação se a sessão não estiver autenticada
  // E o diálogo de sessão expirada não estiver ativo.
  if (!isAuthenticated && !showSessionExpiredDialog) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }
  
  if (isPending && !allowedRoles.includes('pending')) {
    return <Navigate to="/waiting-for-approval" replace />;
  }

  if (user && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Acesso Negado</h1>
          <p className="text-muted-foreground">
            Você não tem permissão para acessar esta página.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};