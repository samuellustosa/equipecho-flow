import React, { useMemo } from 'react';
import { Outlet } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, Package, Wrench, AlertTriangle, CalendarClock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth, useUpdateUserNotifications } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { useEquipmentAlerts, useInventoryAlerts } from '@/hooks/useNotifications';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AnnouncementBanner } from './AnnouncementBanner';
import { cn } from "@/lib/utils";
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { AppSidebar } from './AppSidebar';

const HEADER_HEIGHT_PX = 64;

export const MainLayout: React.FC = () => {
  const { authState } = useAuth();
  const isMobile = useIsMobile();
  const { data: equipmentAlerts = [] } = useEquipmentAlerts();
  const { data: inventoryAlerts = [] } = useInventoryAlerts();

  const readAlertsIdsFromProfile = authState.user?.read_notification_ids || [];
  
  const { mutate: updateUserNotifications } = useUpdateUserNotifications();

  const allAlerts = useMemo(() => {
    return [...equipmentAlerts, ...inventoryAlerts];
  }, [equipmentAlerts, inventoryAlerts]);

  const handleOpenChange = (newOpenState: boolean) => {
    if (!newOpenState) {
      const allAlertsIds = allAlerts.map(alert => alert.id);
      updateUserNotifications(allAlertsIds);
    }
  };
  
  const totalUnreadAlerts = useMemo(() => {
    return allAlerts.filter(alert => !readAlertsIdsFromProfile.includes(alert.id)).length;
  }, [allAlerts, readAlertsIdsFromProfile]);

  const unreadEquipmentAlerts = useMemo(() => {
    return equipmentAlerts.filter(alert => !readAlertsIdsFromProfile.includes(alert.id));
  }, [equipmentAlerts, readAlertsIdsFromProfile]);

  const unreadInventoryAlerts = useMemo(() => {
    return inventoryAlerts.filter(alert => !readAlertsIdsFromProfile.includes(alert.id));
  }, [inventoryAlerts, readAlertsIdsFromProfile]);
  

  const getUserInitials = (name: string) => {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const NotificationContent = () => (
    <>
      <CardHeader className="p-6 pb-2">
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
            {allAlerts.length > 0 ? (
              <>
                {equipmentAlerts.length > 0 && (
                  <>
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-destructive" />
                      Manutenções Vencidas
                    </h4>
                    {equipmentAlerts.map(alert => (
                      <div key={alert.id} className="flex items-start gap-2">
                        <CalendarClock className="h-4 w-4 mt-1 text-destructive" />
                        <div className="flex-1 text-sm">
                          <p className={`font-medium ${readAlertsIdsFromProfile.includes(alert.id) ? 'text-muted-foreground' : ''}`}>{alert.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {alert.type === 'overdue' ? `Atrasado há ${Math.abs(alert.daysUntilDue)} dias` : (alert.type === 'warning' ? `Aviso de limpeza` : 'Erro de status')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {equipmentAlerts.length > 0 && inventoryAlerts.length > 0 && <Separator className="my-2" />}

                {inventoryAlerts.length > 0 && (
                  <>
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <Package className="h-4 w-4 text-warning" />
                      Inventário
                    </h4>
                    {inventoryAlerts.map(alert => (
                      <div key={alert.id} className="flex items-start gap-2">
                        <AlertCircle className={`h-4 w-4 mt-1 ${alert.type === 'critical' ? 'text-destructive' : 'text-warning'}`} />
                        <div className="flex-1 text-sm">
                          <p className={`font-medium ${readAlertsIdsFromProfile.includes(alert.id) ? 'text-muted-foreground' : ''}`}>{alert.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {alert.type}
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
    </>
  );

  const NotificationComponent = isMobile ? (
    <Drawer onOpenChange={handleOpenChange}>
      <DrawerTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {totalUnreadAlerts > 0 && (
            <span className="absolute top-1 right-1 h-3 w-3 flex items-center justify-center bg-destructive text-destructive-foreground text-[8px] font-bold rounded-full">
              {totalUnreadAlerts}
            </span>
          )}
        </Button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="text-left">
          <DrawerTitle className="text-lg">Notificações</DrawerTitle>
          <DrawerDescription>
            Você tem {totalUnreadAlerts} alertas pendentes.
          </DrawerDescription>
        </DrawerHeader>
        <ScrollArea className="flex-1 px-4">
          <div className="flex flex-col gap-3 py-4">
            {allAlerts.length > 0 ? (
              <>
                {equipmentAlerts.length > 0 && (
                  <>
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-destructive" />
                      Manutenções Vencidas
                    </h4>
                    {equipmentAlerts.map(alert => (
                      <div key={alert.id} className="flex items-start gap-2">
                        <CalendarClock className="h-4 w-4 mt-1 text-destructive" />
                        <div className="flex-1 text-sm">
                          <p className={`font-medium ${readAlertsIdsFromProfile.includes(alert.id) ? 'text-muted-foreground' : ''}`}>{alert.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {alert.type === 'overdue' ? `Atrasado há ${Math.abs(alert.daysUntilDue)} dias` : (alert.type === 'warning' ? `Aviso de limpeza` : 'Erro de status')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </>
                )}
                {equipmentAlerts.length > 0 && inventoryAlerts.length > 0 && <Separator className="my-2" />}
                {inventoryAlerts.length > 0 && (
                  <>
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <Package className="h-4 w-4 text-warning" />
                      Inventário
                    </h4>
                    {inventoryAlerts.map(alert => (
                      <div key={alert.id} className="flex items-start gap-2">
                        <AlertCircle className={`h-4 w-4 mt-1 ${alert.type === 'critical' ? 'text-destructive' : 'text-warning'}`} />
                        <div className="flex-1 text-sm">
                          <p className={`font-medium ${readAlertsIdsFromProfile.includes(alert.id) ? 'text-muted-foreground' : ''}`}>{alert.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {alert.type}
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
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  ) : (
    <Popover onOpenChange={handleOpenChange}>
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
        <NotificationContent />
      </PopoverContent>
    </Popover>
  );

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
          
        <div className="flex-1 flex flex-col">
          {/* Header fixo no topo */}
          <header className="fixed top-0 right-0 z-50 w-full lg:w-[calc(100%-16rem)] h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-header lg:left-64">
            <div className="flex h-full items-center justify-between px-6">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="lg:hidden" />
              </div>

              <div className="flex items-center gap-4">
                {isMobile ? (
                  <Drawer onOpenChange={handleOpenChange}>
                    <DrawerTrigger asChild>
                      <Button variant="ghost" size="sm" className="relative">
                        <Bell className="h-4 w-4" />
                        {totalUnreadAlerts > 0 && (
                          <span className="absolute top-1 right-1 h-3 w-3 flex items-center justify-center bg-destructive text-destructive-foreground text-[8px] font-bold rounded-full">
                            {totalUnreadAlerts}
                          </span>
                        )}
                      </Button>
                    </DrawerTrigger>
                    <DrawerContent className="max-h-[90vh]">
                      <DrawerHeader className="text-left">
                        <DrawerTitle className="text-lg">Notificações</DrawerTitle>
                        <DrawerDescription>
                          Você tem {totalUnreadAlerts} alertas pendentes.
                        </DrawerDescription>
                      </DrawerHeader>
                      <ScrollArea className="flex-1 px-4">
                        <div className="flex flex-col gap-3 py-4">
                          {allAlerts.length > 0 ? (
                            <>
                              {equipmentAlerts.length > 0 && (
                                <>
                                  <h4 className="text-sm font-semibold flex items-center gap-2">
                                    <Wrench className="h-4 w-4 text-destructive" />
                                    Manutenções Vencidas
                                  </h4>
                                  {equipmentAlerts.map(alert => (
                                    <div key={alert.id} className="flex items-start gap-2">
                                      <CalendarClock className="h-4 w-4 mt-1 text-destructive" />
                                      <div className="flex-1 text-sm">
                                        <p className={`font-medium ${readAlertsIdsFromProfile.includes(alert.id) ? 'text-muted-foreground' : ''}`}>{alert.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                          {alert.type === 'overdue' ? `Atrasado há ${Math.abs(alert.daysUntilDue)} dias` : (alert.type === 'warning' ? `Aviso de limpeza` : 'Erro de status')}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </>
                              )}
                              {equipmentAlerts.length > 0 && inventoryAlerts.length > 0 && <Separator className="my-2" />}
                              {inventoryAlerts.length > 0 && (
                                <>
                                  <h4 className="text-sm font-semibold flex items-center gap-2">
                                    <Package className="h-4 w-4 text-warning" />
                                    Inventário
                                  </h4>
                                  {inventoryAlerts.map(alert => (
                                    <div key={alert.id} className="flex items-start gap-2">
                                      <AlertCircle className={`h-4 w-4 mt-1 ${alert.type === 'critical' ? 'text-destructive' : 'text-warning'}`} />
                                      <div className="flex-1 text-sm">
                                        <p className={`font-medium ${readAlertsIdsFromProfile.includes(alert.id) ? 'text-muted-foreground' : ''}`}>{alert.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                          {alert.type}
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
                      </ScrollArea>
                    </DrawerContent>
                  </Drawer>
                ) : (
                  <Popover onOpenChange={handleOpenChange}>
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
                      <NotificationContent />
                    </PopoverContent>
                  </Popover>
                )}
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

          <div className="mt-16">
            <AnnouncementBanner />
          </div>
          
          <main className="flex-1 overflow-auto max-w-full">
            <div className="max-w-full">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};