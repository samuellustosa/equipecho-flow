import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useEquipments } from '@/hooks/useEquipments';
import { useInventory } from '@/hooks/useInventory';
import { 
  Wrench, 
  Package, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp,
  Calendar,
  Users,
  Activity
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { data: equipments = [], isLoading: equipmentsLoading } = useEquipments();
  const { data: inventory = [], isLoading: inventoryLoading } = useInventory();

  const isLoading = equipmentsLoading || inventoryLoading;

  // Calculate real stats from data
  const stats = {
    totalEquipments: equipments.length,
    activeEquipments: equipments.filter(e => e.status === 'operacional').length,
    maintenanceNeeded: equipments.filter(e => e.status === 'manutencao').length,
    inventoryItems: inventory.length,
    lowStockItems: inventory.filter(i => i.status === 'baixo' || i.status === 'critico').length,
    pendingMaintenance: equipments.filter(e => {
      const nextCleaning = new Date(e.next_cleaning);
      const today = new Date();
      const diffDays = Math.ceil((nextCleaning.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays <= 7; // Due in 7 days or less
    }).length
  };

  // Recent cleanings (equipments that had recent next_cleaning updates)
  const recentMaintenances = equipments
    .filter(e => e.last_cleaning)
    .sort((a, b) => new Date(b.last_cleaning!).getTime() - new Date(a.last_cleaning!).getTime())
    .slice(0, 3)
    .map(equipment => ({
      id: equipment.id,
      equipment: equipment.name,
      type: 'Limpeza',
      status: equipment.status === 'operacional' ? 'Concluída' : 'Em andamento',
      date: equipment.last_cleaning!,
      technician: equipment.responsibles?.name || 'N/A'
    }));

  // Low stock items
  const lowStockItems = inventory
    .filter(i => i.status === 'baixo' || i.status === 'critico')
    .slice(0, 3)
    .map(item => ({
      name: item.name,
      current: item.current_quantity,
      minimum: item.minimum_quantity
    }));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Concluída': return 'bg-success text-success-foreground';
      case 'Em andamento': return 'bg-warning text-warning-foreground';
      case 'Pendente': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-card hover:shadow-card-hover transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Equipamentos
            </CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEquipments}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-success">+12%</span> em relação ao mês anterior
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-card-hover transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Equipamentos Ativos
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeEquipments}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.activeEquipments / stats.totalEquipments) * 100).toFixed(1)}% operacionais
            </p>
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
            <div className="text-2xl font-bold">{stats.pendingMaintenance}</div>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Maintenances */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Limpezas Recentes
            </CardTitle>
            <CardDescription>
              Últimas atividades de limpeza registradas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentMaintenances.map((maintenance) => (
                <div key={maintenance.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="space-y-1">
                    <p className="font-medium text-sm">{maintenance.equipment}</p>
                    <p className="text-xs text-muted-foreground">
                      {maintenance.type} • {maintenance.technician}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <Badge className={getStatusColor(maintenance.status)}>
                      {maintenance.status}
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      {new Date(maintenance.date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
              Ver Todas as Limpezas
            </Button>
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Alertas de Estoque
            </CardTitle>
            <CardDescription>
              Itens que necessitam reposição urgente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lowStockItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-warning/10 border border-warning/20">
                  <div>
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Mínimo: {item.minimum} unidades
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-warning">
                      {item.current} restantes
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.minimum - item.current} abaixo do mínimo
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
              Gerenciar Inventário
            </Button>
          </CardContent>
        </Card>
      </div>

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
            <Button className="h-20 flex-col gap-2" variant="outline">
              <Wrench className="h-6 w-6" />
              <span>Novo Equipamento</span>
            </Button>
            <Button className="h-20 flex-col gap-2" variant="outline">
              <Calendar className="h-6 w-6" />
              <span>Agendar Limpeza</span>
            </Button>
            <Button className="h-20 flex-col gap-2" variant="outline">
              <Package className="h-6 w-6" />
              <span>Adicionar Item</span>
            </Button>
            <Button className="h-20 flex-col gap-2" variant="outline">
              <TrendingUp className="h-6 w-6" />
              <span>Relatórios</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};