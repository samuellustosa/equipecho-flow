import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { RefreshCw, LogIn } from "lucide-react";
import { useAuth } from '@/hooks/useAuth';

interface SessionExpiredDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onReload?: () => void;
}

export const SessionExpiredDialog: React.FC<SessionExpiredDialogProps> = ({
  isOpen,
  onClose,
  onReload
}) => {
  const navigate = useNavigate();
  const { logout, setShowSessionExpiredDialog } = useAuth();

  const handleLogoutAndRedirect = async () => {
    onClose();
    setShowSessionExpiredDialog(false);
    await logout();
    navigate('/auth');
  };

  const handleReload = () => {
    if (onReload) {
      onReload();
    } else {
      window.location.reload();
    }
    onClose();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src="/expirada.png" alt="Sessão Expirada" className="h-20 w-20 object-contain" />
          </div>
          <AlertDialogTitle className="text-xl text-center">
            Sessão Expirada
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-muted-foreground">
            Sua sessão expirou por inatividade ou devido a problemas de conexão.
            Para sua segurança, você foi desconectado automaticamente.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter className="flex-col gap-2 sm:flex-row sm:justify-center mt-4">
          <AlertDialogAction 
            onClick={handleLogoutAndRedirect}
            className="w-full sm:w-auto"
          >
            <LogIn className="mr-2 h-4 w-4" />
            Fazer Login
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};