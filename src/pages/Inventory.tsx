import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  Search, 
  Filter,
  Edit,
  Trash2,
  Package,
  AlertTriangle,
  TrendingDown,
  CheckCircle
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Inventory: React.FC = () => {
  // Mock data - replace with real data from Supabase
  const inventoryItems = [
    {
      id: 1,
      name: 'Filtro de Ar Industrial',
      category: 'Filtros',
      currentStock: 15,
      minimumStock: 10,
      unit: 'unidades',
      supplier: 'FilterPro Ltda',
      lastPurchase: '2024-01-10',
      unitPrice: 125.50
    },
    {
      id: 2,
      name: 'Óleo Lubrificante SAE 30',
      category: 'Lubrificantes',
      currentStock: 3,
      minimumStock: 8,
      unit: 'litros',
      supplier: 'LubriMax',
      lastPurchase: '2023-12-15',
      unitPrice: 45.90
    },
    {
      id: 3,
      name: 'Correia V A-47',
      category: 'Correias',
      currentStock: 2,
      minimumStock: 5,
      unit: 'unidades',
      supplier: 'Correias Brasil',
      lastPurchase: '2023-11-30',
      unitPrice: 89.75
    },
    {
      id: 4,
      name: 'Rolamento 6205-2RS',
      category: 'Rolamentos',
      currentStock: 25,
      minimumStock: 15,
      unit: 'unidades',
      supplier: 'SKF do Brasil',
      lastPurchase: '2024-01-08',
      unitPrice: 78.90
    },
    {
      id: 5,
      name: 'Graxa Multipropósito',
      category: 'Lubrificantes',
      currentStock: 8,
      minimumStock: 6,
      unit: 'kg',
      supplier: 'Petrobras',
      lastPurchase: '2024-01-12',
      unitPrice: 32.15
    }
  ];

  const getStockStatus = (current: number, minimum: number) => {
    if (current <= minimum * 0.5) {
      return { status: 'Crítico', color: 'bg-destructive text-destructive-foreground', icon: AlertTriangle };
    } else if (current <= minimum) {
      return { status: 'Baixo', color: 'bg-warning text-warning-foreground', icon: TrendingDown };
    } else {
      return { status: 'Normal', color: 'bg-success text-success-foreground', icon: CheckCircle };
    }
  };

  const stats = {
    totalItems: inventoryItems.length,
    lowStockItems: inventoryItems.filter(item => item.currentStock <= item.minimumStock).length,
    criticalItems: inventoryItems.filter(item => item.currentStock <= item.minimumStock * 0.5).length,
    totalValue: inventoryItems.reduce((sum, item) => sum + (item.currentStock * item.unitPrice), 0)
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Inventário</h1>
          <p className="text-muted-foreground">
            Controle de estoque e materiais de manutenção
          </p>
        </div>
        <Button className="gradient-primary text-primary-foreground transition-smooth">
          <Plus className="h-4 w-4 mr-2" />
          Novo Item
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Itens</p>
                <p className="text-2xl font-bold">{stats.totalItems}</p>
              </div>
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Valor Total</p>
                <p className="text-2xl font-bold">
                  R$ {stats.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Estoque Baixo</p>
                <p className="text-2xl font-bold text-warning">{stats.lowStockItems}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Críticos</p>
                <p className="text-2xl font-bold text-destructive">{stats.criticalItems}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="shadow-card">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar itens do inventário..."
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Critical Items Alert */}
      {stats.criticalItems > 0 && (
        <Card className="shadow-card border-destructive/50 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Alerta de Estoque Crítico
            </CardTitle>
            <CardDescription>
              {stats.criticalItems} {stats.criticalItems === 1 ? 'item possui' : 'itens possuem'} estoque em nível crítico
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Inventory Table */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Itens do Inventário</CardTitle>
          <CardDescription>
            Visualize e gerencie todos os itens em estoque
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Estoque Atual</TableHead>
                  <TableHead>Estoque Mínimo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Preço Unitário</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventoryItems.map((item) => {
                  const stockInfo = getStockStatus(item.currentStock, item.minimumStock);
                  const StatusIcon = stockInfo.icon;
                  
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        <div>
                          <p className="font-semibold">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Última compra: {new Date(item.lastPurchase).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {item.currentStock} {item.unit}
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.minimumStock} {item.unit}
                      </TableCell>
                      <TableCell>
                        <Badge className={stockInfo.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {stockInfo.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.supplier}</TableCell>
                      <TableCell>
                        R$ {item.unitPrice.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};