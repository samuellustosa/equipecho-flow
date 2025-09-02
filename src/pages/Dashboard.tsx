import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useEquipments } from '@/hooks/useEquipments';
import { useInventory } from '@/hooks/useInventory';
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
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { data: equipments = [], isLoading: equipmentsLoading } = useEquipments();
  const { data: inventory = [], isLoading: inventoryLoading } = useInventory();
  const { data: equipmentAlerts = [], isLoading: equipmentAlertsLoading } = useEquipmentAlerts();
  const { data: inventoryAlerts = [], isLoading: inventoryAlertsLoading } = useInventoryAlerts();

  const isLoading = equipmentsLoading || inventoryLoading || equipmentAlertsLoading || inventoryAlertsLoading;

  const stats = {
    totalEquipments: equipments.length,
    activeEquipments: equipments.filter(e => e.status === 'operacional').length,
    maintenanceNeeded: equipmentAlerts.length,
    inventoryItems: inventory.length,
    lowStockItems: inventoryAlerts.length,
  };

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Maintenances */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Limpezas Vencidas
            </CardTitle>
            <CardDescription>
              Atenção para equipamentos com limpeza em atraso.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {equipmentAlerts.slice(0, 3).length > 0 ? (
                equipmentAlerts.slice(0, 3).map((alert) => (
                  <div key={alert.id} className="flex items-start justify-between p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{alert.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {alert.type === 'overdue' ? 'Em atraso' : 'Aviso de limpeza'}
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      <Badge className={alert.type === 'overdue' ? 'bg-destructive text-destructive-foreground' : 'bg-warning text-warning-foreground'}>
                        {alert.type === 'overdue' ? 'Atrasado' : 'Aviso'}
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        Próxima limpeza: {new Date(alert.next_cleaning).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground text-sm py-4">Nenhum alerta de manutenção vencida.</p>
              )}
            </div>
            <Link to="/equipments">
              <Button variant="outline" className="w-full mt-4">
                Ver todos os equipamentos
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
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
              {inventoryAlerts.slice(0, 3).length > 0 ? (
                inventoryAlerts.slice(0, 3).map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-warning/10 border border-warning/20">
                    <div>
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Mínimo: {item.minimum_quantity} unidades
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-${item.type === 'critical' ? 'destructive' : 'warning'}`}>
                        {item.current_quantity} restantes
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.minimum_quantity - item.current_quantity} abaixo do mínimo
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground text-sm py-4">Nenhum alerta de estoque pendente.</p>
              )}
            </div>
            <Link to="/inventory">
              <Button variant="outline" className="w-full mt-4">
                Gerenciar Inventário
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
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
            <Link to="/equipments">
              <Button className="h-20 flex-col gap-2 w-full" variant="outline">
                <Wrench className="h-6 w-6" />
                <span>Novo Equipamento</span>
              </Button>
            </Link>
            <Link to="/equipments">
              <Button className="h-20 flex-col gap-2 w-full" variant="outline">
                <Calendar className="h-6 w-6" />
                <span>Agendar Limpeza</span>
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
              <span>Relatórios</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};