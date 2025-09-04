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
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";

export const Dashboard: React.FC = () => {
  const isMobile = useIsMobile();
  const { data: totalEquipments = 0, isLoading: equipmentsCountLoading } = useEquipmentsCount();
  const { data: totalInventoryItems = 0, isLoading: inventoryCountLoading } = useInventoryCount();
  const { data: equipmentAlerts = [], isLoading: equipmentAlertsLoading } = useEquipmentAlerts();
  const { data: inventoryAlerts = [], isLoading: inventoryAlertsLoading } = useInventoryAlerts();

  // NOVO: Usar o hook para o crescimento, passando 7 dias como parâmetro
  const { data: equipmentGrowth, isLoading: growthLoading } = useEquipmentGrowth(7);

  // Combine os estados de carregamento de todos os hooks
  const isLoading = equipmentsCountLoading || inventoryCountLoading || equipmentAlertsLoading || inventoryAlertsLoading || growthLoading;

  const stats = {
    totalEquipments,
    // A contagem de equipamentos ativos precisa ser feita em um novo hook ou buscar todos os equipamentos
    // Para simplificar, estamos usando a contagem de alertas de manutenção, que já busca todos.
    // Em uma implementação ideal, você criaria um novo hook para contar equipamentos por status.
    // Mas a melhoria a seguir já resolve.
    // Para este caso, vamos usar o total de alertas como uma indicação.
    maintenanceNeeded: equipmentAlerts.length,
    lowStockItems: inventoryAlerts.length,
  };
  
  // Condicionalmente renderiza o esqueleto de carregamento
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

      {/* Stats Cards - Mobile Flexbox / Desktop Grid */}
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
              {/* MODIFICADO: A porcentagem agora é dinâmica */}
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
              {/* MODIFICADO: A porcentagem agora é dinâmica */}
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
            <Button className="h-20 flex-col gap-2 w-full" variant="outline">
              <TrendingUp className="h-6 w-6" />
              <span>Relatórios - (EM BREVE...)</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};