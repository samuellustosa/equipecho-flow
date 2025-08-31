import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  // Mock data - replace with real data from Supabase
  const stats = {
    totalEquipments: 156,
    activeEquipments: 142,
    maintenanceNeeded: 8,
    inventoryItems: 89,
    lowStockItems: 12,
    pendingMaintenance: 5
  };

  const recentMaintenances = [
    {
      id: 1,
      equipment: 'Compressor AC-001',
      type: 'Preventiva',
      status: 'Concluída',
      date: '2024-01-15',
      technician: 'João Silva'
    },
    {
      id: 2,
      equipment: 'Gerador GE-205',
      type: 'Corretiva',
      status: 'Em andamento',
      date: '2024-01-14',
      technician: 'Maria Santos'
    },
    {
      id: 3,
      equipment: 'Bomba BP-103',
      type: 'Preventiva',
      status: 'Pendente',
      date: '2024-01-16',
      technician: 'Carlos Lima'
    }
  ];

  const lowStockItems = [
    { name: 'Filtro de Ar', current: 5, minimum: 10 },
    { name: 'Óleo Lubrificante', current: 3, minimum: 8 },
    { name: 'Correias', current: 2, minimum: 5 }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Concluída': return 'bg-success text-success-foreground';
      case 'Em andamento': return 'bg-warning text-warning-foreground';
      case 'Pendente': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

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
              Manutenções Recentes
            </CardTitle>
            <CardDescription>
              Últimas atividades de manutenção registradas
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
              Ver Todas as Manutenções
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
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-warning-light border border-warning/20">
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
              <span>Agendar Manutenção</span>
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