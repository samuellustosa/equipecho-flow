import React, { useEffect, useMemo, useState } from 'react';
import { Outlet } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, Package, Wrench, AlertTriangle, CalendarClock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { useEquipmentAlerts, useInventoryAlerts } from '@/hooks/useNotifications';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AnnouncementBanner } from './AnnouncementBanner';

export const MainLayout: React.FC = () => {
  const { authState } = useAuth();
  const { data: equipmentAlerts = [] } = useEquipmentAlerts();
  const { data: inventoryAlerts = [] } = useInventoryAlerts();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [readAlertsIds, setReadAlertsIds] = useState<string[]>([]);
  
  const allAlerts = useMemo(() => {
    return [...equipmentAlerts, ...inventoryAlerts];
  }, [equipmentAlerts, inventoryAlerts]);

  // Atualiza a lista de IDs de alertas lidos quando o popover é aberto.
  const handleOpenChange = (newOpenState: boolean) => {
    setIsPopoverOpen(newOpenState);
    if (newOpenState) {
      setReadAlertsIds(allAlerts.map(alert => alert.id));
    }
  };
  
  // Calcula o número de alertas não lidos
  const totalUnreadAlerts = useMemo(() => {
    return allAlerts.filter(alert => !readAlertsIds.includes(alert.id)).length;
  }, [allAlerts, readAlertsIds]);

  const unreadEquipmentAlerts = useMemo(() => {
    return equipmentAlerts.filter(alert => !readAlertsIds.includes(alert.id));
  }, [equipmentAlerts, readAlertsIds]);

  const unreadInventoryAlerts = useMemo(() => {
    return inventoryAlerts.filter(alert => !readAlertsIds.includes(alert.id));
  }, [inventoryAlerts, readAlertsIds]);
  

  const getUserInitials = (name: string) => {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
          
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-header sticky top-0 z-50">
            <div className="flex h-full items-center justify-between px-6">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="lg:hidden" />
              </div>

              <div className="flex items-center gap-4">
                {/* Notifications */}
                <Popover open={isPopoverOpen} onOpenChange={handleOpenChange}>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="relative">
                      <Bell className="h-4 w-4" />
                      {totalUnreadAlerts > 0 && (
                        <span className="absolute top-1 right-1 h-3 w-3 flex items-center justify-center bg-destructive text-destructive-foreground text-[8px] font-bold rounded-full">
                          {totalUnreadAlerts}
                        </span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0" align="end">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Notificações
                      </CardTitle>
                      <CardDescription>
                        Você tem {totalUnreadAlerts} alertas pendentes.
                      </CardDescription>
                    </CardHeader>
                    <Separator />
                    <ScrollArea className="h-72">
                      <CardContent className="p-4">
                        <div className="flex flex-col gap-3">
                          {totalUnreadAlerts > 0 ? (
                            <>
                              {unreadEquipmentAlerts.length > 0 && (
                                <>
                                  <h4 className="text-sm font-semibold flex items-center gap-2">
                                    <Wrench className="h-4 w-4 text-destructive" />
                                    Manutenções Vencidas
                                  </h4>
                                  {unreadEquipmentAlerts.map(alert => (
                                    <div key={alert.id} className="flex items-start gap-2">
                                      <CalendarClock className="h-4 w-4 mt-1 text-destructive" />
                                      <div className="flex-1 text-sm">
                                        <p className="font-medium">{alert.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                          Atrasado há {Math.abs(alert.daysUntilDue)} dias
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </>
                              )}
                              {unreadInventoryAlerts.length > 0 && (
                                <>
                                  {unreadEquipmentAlerts.length > 0 && <Separator className="my-2" />}
                                  <h4 className="text-sm font-semibold flex items-center gap-2">
                                    <Package className="h-4 w-4 text-warning" />
                                    Inventário
                                  </h4>
                                  {unreadInventoryAlerts.map(alert => (
                                    <div key={alert.id} className="flex items-start gap-2">
                                      <AlertCircle className={`h-4 w-4 mt-1 ${alert.type === 'critical' ? 'text-destructive' : 'text-warning'}`} />
                                      <div className="flex-1 text-sm">
                                        <p className="font-medium">{alert.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                          {alert.type === 'critical' ? 'Estoque crítico' : 'Estoque baixo'}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          {alert.current_quantity} de {alert.minimum_quantity} disponíveis
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </>
                              )}
                            </>
                          ) : (
                            <p className="text-center text-muted-foreground text-sm py-4">
                              Nenhum alerta pendente.
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </ScrollArea>
                  </PopoverContent>
                </Popover>

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

          <AnnouncementBanner />
          
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};