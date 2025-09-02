import React from 'react';
import { AppSidebar } from "./AppSidebar";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"; // Importe o SidebarTrigger
import { AnnouncementBanner } from './AnnouncementBanner';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { authState } = useAuth();
  
  const getUserInitials = (name: string) => {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="min-h-screen flex w-full">
      {/* O componente SidebarProvider foi movido para App.tsx */}
      <AppSidebar />
        
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-header sticky top-0 z-50">
          <div className="flex h-full items-center justify-between px-6">
            <div className="flex items-center gap-4">
              {/* SidebarTrigger agora renderiza o botão do menu lateral no modo móvel */}
              <SidebarTrigger className="lg:hidden" />
            </div>

            <div className="flex items-center gap-4">
              {/* Notifications */}
              <Button variant="ghost" size="sm">
                <Bell className="h-4 w-4" />
              </Button>

              {/* User Info */}
              {authState.user && (
                <div className="flex items-center gap-3">
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-medium">
                      {authState.user.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {authState.user.role}
                    </p>
                  </div>
                  <Avatar className="h-8 w-8">
                    {authState.user.avatar_url ? (
                      <AvatarImage src={authState.user.avatar_url} />
                    ) : (
                      <AvatarFallback className="text-xs">
                        {getUserInitials(authState.user.name)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Adicione o banner de avisos aqui */}
        <AnnouncementBanner />
        
        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};