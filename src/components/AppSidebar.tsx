import { useState } from "react";
import { 
  LayoutDashboard, 
  Wrench, 
  Package, 
  Users, 
  Settings,
  LogOut,
  ChevronRight,
  HelpCircle,
  Megaphone,
  Bell,
  ChartBar, // NOVO: Ícone para o quadro de status
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog'; // NOVO: Componentes do Dialog
import { EquipmentStatusGrid } from "./EquipmentStatusGrid"; // NOVO: Componente do Quadro de Status
import { ScrollArea } from "./ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

const navigationItems = [
  { 
    title: "Dashboard", 
    url: "/", 
    icon: LayoutDashboard,
    allowedRoles: ['admin', 'manager', 'user']
  },
  { 
    title: "Equipamentos", 
    url: "/equipments", 
    icon: Wrench,
    allowedRoles: ['admin', 'manager', 'user']
  },
  { 
    title: "Inventário", 
    url: "/inventory", 
    icon: Package,
    allowedRoles: ['admin', 'manager']
  },
  { 
    title: "Usuários", 
    url: "/users", 
    icon: Users,
    allowedRoles: ['admin']
  },
  { 
    title: "Configurações", 
    url: "/settings", 
    icon: Settings,
    allowedRoles: ['admin', 'manager', 'user']
  },
  { 
    title: "FAQs", 
    url: "/faqs", 
    icon: HelpCircle,
    allowedRoles: ['admin']
  },
  { 
    title: "Avisos", 
    url: "/announcements", 
    icon: Megaphone,
    allowedRoles: ['admin']
  },
  { 
    title: "Teste Push", 
    url: "/test-notifications", 
    icon: Bell,
    allowedRoles: ['admin']
  },
];

export function AppSidebar() {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const location = useLocation();
  const { authState, logout } = useAuth();
  const currentPath = location.pathname;
  
  const isCollapsed = state === "collapsed";

  const filteredItems = navigationItems.filter(item => 
    authState.user && item.allowedRoles.includes(authState.user.role)
  );

  const isActive = (path: string) => {
    if (path === "/") {
      return currentPath === "/";
    }
    return currentPath.startsWith(path);
  };

  const getNavClassName = (path: string) => {
    const baseClasses = "w-full justify-start transition-smooth";
    return isActive(path) 
      ? `${baseClasses} bg-accent text-accent-foreground font-medium`
      : `${baseClasses} hover:bg-accent/50`;
  };

  const getUserInitials = (name: string) => {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <Sidebar
      className="transition-smooth border-r"
      collapsible="offcanvas"
    >
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center">
            <img src="/appstore.png" alt="EquipCPD Logo" className="h-8 w-10" />
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="font-bold text-lg">EquipCPD</h1>
              <p className="text-xs text-muted-foreground">
                Gestão de Equipamentos
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-4 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className={isCollapsed ? "sr-only" : ""}>
            Navegação
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={getNavClassName(item.url)}
                      onClick={() => isMobile && setOpenMobile(false)}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {!isCollapsed && (
                        <>
                          <span className="ml-3">{item.title}</span>
                          {isActive(item.url) && (
                            <ChevronRight className="h-4 w-4 ml-auto" />
                          )}
                        </>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {/* NOVO ITEM PARA O QUADRO DE STATUS */}
              <Dialog>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild className="w-full justify-start transition-smooth">
                    <DialogTrigger className="flex w-full items-center gap-2 p-2 rounded-md hover:bg-accent/50 text-sm font-medium">
                      <ChartBar className="h-4 w-4 flex-shrink-0" />
                      {!isCollapsed && (
                        <span className="ml-3">Quadro de Status</span>
                      )}
                    </DialogTrigger>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <DialogContent className="max-w-full sm:max-w-7xl max-h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Quadro de Status dos Equipamentos</DialogTitle>
                        <DialogDescription>
                            Visualize o status de manutenção de todos os equipamentos de forma rápida.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="overflow-y-auto">
                        <EquipmentStatusGrid />
                    </div>
                </DialogContent>
              </Dialog>

            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        {authState.user && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                {authState.user.avatar_url ? (
                  <AvatarImage src={authState.user.avatar_url} />
                ) : (
                  <AvatarFallback className="text-xs">
                    {getUserInitials(authState.user.name)}
                  </AvatarFallback>
                )}
              </Avatar>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {authState.user.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {authState.user.role}
                  </p>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <ThemeToggle />
              {!isCollapsed && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={logout}
                  className="flex-1 justify-start"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </Button>
              )}
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}