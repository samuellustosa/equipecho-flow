import React, { useMemo } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useEquipmentsCount, useAllEquipments, useEquipmentGrowth } from '@/hooks/useEquipments';
import { useInventoryCount, useAllInventory } from '@/hooks/useInventory';
import { useEquipmentAlerts, useInventoryAlerts } from '@/hooks/useNotifications';
import { useSectors } from '@/hooks/useSectors';
import { useCategories } from '@/hooks/useCategories';
import { useAuth } from '@/hooks/useAuth';
import { useAuditLogs } from '@/hooks/useAuditLogs';
import {
  Wrench,
  Package,
  AlertTriangle,
  Users,
  TrendingUp,
  Clock,
  ArrowRight,
  Loader2,
  FileClock,
  PieChartIcon,
  BarChartIcon,
  Circle,
  AlertCircle,
  ChevronRight,
  Settings,
  ArrowUpCircle,
  ArrowDownCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { format, differenceInDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

export const Dashboard: React.FC = () => {
  const { authState } = useAuth();
  const isAdmin = authState.user?.role === 'admin';

  const { data: totalEquipments = 0, isLoading: equipmentsCountLoading } = useEquipmentsCount();
  const { data: allEquipments = [], isLoading: allEquipmentsLoading } = useAllEquipments();
  const { data: allInventoryItems = [], isLoading: allInventoryLoading } = useAllInventory();
  const { data: equipmentAlerts = [], isLoading: equipmentAlertsLoading } = useEquipmentAlerts();
  const { data: inventoryAlerts = [], isLoading: inventoryAlertsLoading } = useInventoryAlerts();
  const { data: equipmentGrowth, isLoading: growthLoading } = useEquipmentGrowth(7);
  const { data: latestAuditLogs = [], isLoading: auditLogsLoading } = useAuditLogs();

  const isLoading =
    equipmentsCountLoading ||
    equipmentAlertsLoading ||
    inventoryAlertsLoading ||
    allEquipmentsLoading ||
    allInventoryLoading ||
    auditLogsLoading ||
    growthLoading;

  const maintenanceStatusData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const counts = { vencido: 0, aviso: 0, emDia: 0 };
    allEquipments.forEach((eq) => {
      const daysUntilDue = differenceInDays(parseISO(eq.next_cleaning), today);
      if (daysUntilDue < 0) {
        counts.vencido++;
      } else if (daysUntilDue <= 7) {
        counts.aviso++;
      } else {
        counts.emDia++;
      }
    });

    return [
      { name: 'Em Dia', value: counts.emDia, color: 'hsl(var(--success))' },
      { name: 'Aviso', value: counts.aviso, color: 'hsl(var(--warning))' },
      { name: 'Vencido', value: counts.vencido, color: 'hsl(var(--destructive))' },
    ];
  }, [allEquipments]);

  const inventoryByCategoryData = useMemo(() => {
    const counts = allInventoryItems.reduce((acc, item) => {
      const categoryName = item.categories?.name || 'Sem Categoria';
      acc[categoryName] = (acc[categoryName] || 0) + 1;
      return acc;
    }, {});
    return Object.keys(counts).map((name) => ({
      name,
      items: counts[name],
    }));
  }, [allInventoryItems]);

  const upcomingMaintenances = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return allEquipments
      .filter((eq) => {
        const nextCleaningDate = parseISO(eq.next_cleaning);
        const daysUntilDue = differenceInDays(nextCleaningDate, today);
        return daysUntilDue >= 0 && daysUntilDue <= 30;
      })
      .sort((a, b) => {
        const daysA = differenceInDays(parseISO(a.next_cleaning), today);
        const daysB = differenceInDays(parseISO(b.next_cleaning), today);
        return daysA - daysB;
      })
      .slice(0, 5);
  }, [allEquipments]);
  
  const getDaysLabel = (daysUntilDue) => {
    if (daysUntilDue === 0) return 'Hoje';
    if (daysUntilDue === 1) return 'Amanhã';
    return `Em ${daysUntilDue} dias`;
  };
  
  const getDaysBadgeVariant = (daysUntilDue) => {
    if (daysUntilDue < 0) return 'destructive';
    if (daysUntilDue < 7) return 'warning';
    return 'default';
  };

  const stats = {
    totalEquipments,
    maintenanceNeeded: equipmentAlerts.length,
    lowStockItems: inventoryAlerts.length,
  };

  const getLogColor = (action: string) => {
    switch (action) {
      case 'INSERT': return 'text-green-500 fill-current';
      case 'UPDATE': return 'text-yellow-500 fill-current';
      case 'DELETE': return 'text-red-500 fill-current';
      default: return 'text-gray-500 fill-current';
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
        <h1 className="text-3xl font-bold mb-2">Dashboard Profissional</h1>
        <p className="text-muted-foreground">
          Visão geral completa e detalhada do sistema de gestão de equipamentos
        </p>
      </div>

      {/* Stats Cards (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Equipamentos</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEquipments}</div>
            <p className="text-xs text-muted-foreground">
              <span className={cn(
                equipmentGrowth?.isPositive ? 'text-success' : 'text-destructive',
                'font-semibold'
              )}>
                {equipmentGrowth?.isPositive ? '+' : ''}
                {equipmentGrowth?.percentage?.toFixed(1)}%
              </span>{' '}
              em 7 dias
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Manutenções Pendentes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.maintenanceNeeded}</div>
            <p className="text-xs text-muted-foreground">Atenção imediata</p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Itens com Estoque Baixo</CardTitle>
            <Package className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.lowStockItems}</div>
            <p className="text-xs text-muted-foreground">Necessita reposição</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Painel de Manutenção: Gráfico e Lista */}
        <Card className="col-span-1 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Visão Geral de Manutenção
            </CardTitle>
            <CardDescription>
              Acompanhe o status e as próximas manutenções.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4">
            {/* Gráfico */}
            {/* Correção do gráfico: usar uma altura fixa para que ele apareça no PC */}
            <div className="h-72 w-full md:w-1/2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={maintenanceStatusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    label
                  >
                    {maintenanceStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Lista */}
            <div className="h-full w-full md:w-1/2">
                <h4 className="text-sm font-semibold mb-2">Próximas Manutenções</h4>
                <ScrollArea className="h-44 pr-4">
                    <div className="space-y-3">
                        {upcomingMaintenances.length > 0 ? (
                            upcomingMaintenances.map((eq) => {
                                const daysUntilDue = differenceInDays(parseISO(eq.next_cleaning), new Date());
                                const daysBadgeVariant = getDaysBadgeVariant(daysUntilDue);
                                return (
                                    <div key={eq.id} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 w-2 rounded-full bg-primary" />
                                            <div className="space-y-0.5">
                                                <p className="font-medium text-sm">{eq.name}</p>
                                                <p className="text-xs text-muted-foreground">{eq.sectors?.name || 'Sem setor'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={daysBadgeVariant} className="font-semibold text-xs">
                                                {getDaysLabel(daysUntilDue)}
                                            </Badge>
                                            <Link to={`/equipments?id=${eq.id}`} className="text-muted-foreground hover:text-primary transition-colors">
                                                <ChevronRight className="h-4 w-4" />
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="text-muted-foreground text-sm">Nenhuma manutenção agendada nos próximos 30 dias.</p>
                        )}
                    </div>
                </ScrollArea>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de Inventário por Categoria */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Inventário por Categoria</CardTitle>
            <CardDescription>
              Distribuição de itens do inventário por categoria.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={inventoryByCategoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="items" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Botões de Ações Rápidas */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
          <CardDescription>
            Acesso rápido às principais funcionalidades.
          </CardDescription>
          </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link to="/equipments/new">
              <Button className="h-20 flex-col gap-2 w-full" variant="outline">
                <Wrench className="h-6 w-6" />
                <span>Novo Equipamento</span>
              </Button>
            </Link>
            <Link to="/inventory">
              <Button className="h-20 flex-col gap-2 w-full" variant="outline">
                <Package className="h-6 w-6" />
                <span>Adicionar Item</span>
              </Button>
            </Link>
            <Link to="/users">
              <Button className="h-20 flex-col gap-2 w-full" variant="outline">
                <Users className="h-6 w-6" />
                <span>Gerenciar Usuários</span>
              </Button>
            </Link>
            <Link to="/settings">
              <Button className="h-20 flex-col gap-2 w-full" variant="outline">
                <Settings className="h-6 w-6" />
                <span>Configurações</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Atividade Recente (Somente para Admin) */}
      {isAdmin && (
        <Card className="col-span-1 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileClock className="h-5 w-5" />
              Atividade Recente
            </CardTitle>
            <CardDescription>
              Últimas 5 ações de auditoria no sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-56">
              <div className="flex flex-col gap-4">
                {latestAuditLogs.length > 0 ? (
                  latestAuditLogs.slice(0, 5).map((log) => (
                    <div key={log.id} className="flex items-start gap-3">
                      <div className="mt-1">
                        <Circle className={cn("h-2.5 w-2.5", getLogColor(log.action_type))} />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          <span className="font-bold">{log.profiles?.name || 'Usuário Desconhecido'}</span> {log.action_type.toLowerCase()} o registro de {log.table_name}.
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(log.created_at), 'dd MMM, HH:mm', { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">Nenhuma atividade recente.</p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};