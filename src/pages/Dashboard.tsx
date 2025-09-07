import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useEquipments, useEquipmentGrowth, useEquipmentsCount } from '@/hooks/useEquipments';
import { useInventory, useInventoryCount } from '@/hooks/useInventory';
import { useEquipmentAlerts, useInventoryAlerts } from '@/hooks/useNotifications';
import {
  Wrench,
  Package,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Calendar,
  Activity,
  ArrowRight,
  Loader2,
  ChartBar,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { EquipmentStatusGrid } from '@/components/EquipmentStatusGrid';

export const Dashboard: React.FC = () => {
  const isMobile = useIsMobile();
  const { data: totalEquipments = 0, isLoading: equipmentsCountLoading } = useEquipmentsCount();
  const { data: totalInventoryItems = 0, isLoading: inventoryCountLoading } = useInventoryCount();
  const { data: equipmentAlerts = [], isLoading: equipmentAlertsLoading } = useEquipmentAlerts();
  const { data: inventoryAlerts = [], isLoading: inventoryAlertsLoading } = useInventoryAlerts();

  const { data: equipmentGrowth, isLoading: growthLoading } = useEquipmentGrowth(7);

  const isLoading = equipmentsCountLoading || inventoryCountLoading || equipmentAlertsLoading || inventoryAlertsLoading || growthLoading;

  const stats = {
    totalEquipments,
    maintenanceNeeded: equipmentAlerts.length,
    lowStockItems: inventoryAlerts.length,
  };
  
  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral do sistema de gestão de equipamentos
        </p>
      </div>

      {isMobile ? (
        <div className="flex flex-col gap-4">
          <Card className="shadow-card hover:shadow-card-hover transition-smooth">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Equipamentos
              </CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEquipments}</div>
              {equipmentGrowth && (
                <p className="text-xs text-muted-foreground">
                  <span className={equipmentGrowth.isPositive ? 'text-success' : 'text-destructive'}>
                    {equipmentGrowth.isPositive ? '+' : ''}{equipmentGrowth.percentage?.toFixed(1)}%
                  </span>{" "}
                  em relação à semana anterior
                </p>
              )}
            </CardContent>
          </Card>
          <Card className="shadow-card hover:shadow-card-hover transition-smooth">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Manutenções Pendentes
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.maintenanceNeeded}</div>
              <p className="text-xs text-muted-foreground">
                Requer atenção imediata
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-card hover:shadow-card-hover transition-smooth">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Itens com Estoque Baixo
              </CardTitle>
              <Package className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.lowStockItems}</div>
              <p className="text-xs text-muted-foreground">
                Necessita reposição
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="shadow-card hover:shadow-card-hover transition-smooth">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Equipamentos
              </CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEquipments}</div>
              {equipmentGrowth && (
                <p className="text-xs text-muted-foreground">
                  <span className={equipmentGrowth.isPositive ? 'text-success' : 'text-destructive'}>
                    {equipmentGrowth.isPositive ? '+' : ''}{equipmentGrowth.percentage?.toFixed(1)}%
                  </span>{" "}
                  em relação à semana anterior
                </p>
              )}
            </CardContent>
          </Card>
          <Card className="shadow-card hover:shadow-card-hover transition-smooth">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Manutenções Pendentes
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.maintenanceNeeded}</div>
              <p className="text-xs text-muted-foreground">
                Requer atenção imediata
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-card hover:shadow-card-hover transition-smooth">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Itens com Estoque Baixo
              </CardTitle>
              <Package className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.lowStockItems}</div>
              <p className="text-xs text-muted-foreground">
                Necessita reposição
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
          <CardDescription>
            Acesso rápido às principais funcionalidades
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link to="/equipments">
              <Button className="h-20 flex-col gap-2 w-full" variant="outline">
                <Wrench className="h-6 w-6" />
                <span>Novo Equipamento</span>
              </Button>
            </Link>
            <Link to="/equipments">
              <Button className="h-20 flex-col gap-2 w-full" variant="outline">
                <Calendar className="h-6 w-6" />
                <span>Fazer Limpeza</span>
              </Button>
            </Link>
            <Link to="/inventory">
              <Button className="h-20 flex-col gap-2 w-full" variant="outline">
                <Package className="h-6 w-6" />
                <span>Adicionar Item</span>
              </Button>
            </Link>
            {/* NOVO BOTÃO */}
            <Dialog>
                <DialogTrigger asChild>
                <Button className="h-20 flex-col gap-2 w-full" variant="outline">
                    <ChartBar className="h-6 w-6" />
                    <span>Ver Quadro de Status</span>
                </Button>
                </DialogTrigger>
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
};