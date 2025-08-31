import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { 
  Plus, 
  Search, 
  Filter,
  Edit,
  Trash2,
  Settings,
  Calendar,
  MapPin,
  Activity
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Equipments: React.FC = () => {
  const { authState } = useAuth();
  
  // Mock data - replace with real data from Supabase
  const equipments = [
    {
      id: 1,
      name: 'Compressor AC-001',
      type: 'Compressor de Ar',
      location: 'Setor A - Sala 101',
      status: 'Operacional',
      lastMaintenance: '2024-01-10',
      nextMaintenance: '2024-04-10',
      model: 'Atlas Copco GA22',
      serialNumber: 'AC2024001'
    },
    {
      id: 2,
      name: 'Gerador GE-205',
      type: 'Gerador Diesel',
      location: 'Área Externa - Bloco B',
      status: 'Manutenção',
      lastMaintenance: '2024-01-14',
      nextMaintenance: '2024-07-14',
      model: 'Caterpillar C9',
      serialNumber: 'GE2024002'
    },
    {
      id: 3,
      name: 'Bomba BP-103',
      type: 'Bomba Centrífuga',
      location: 'Casa de Máquinas',
      status: 'Parado',
      lastMaintenance: '2023-12-20',
      nextMaintenance: '2024-03-20',
      model: 'KSB Etanorm',
      serialNumber: 'BP2024003'
    },
    {
      id: 4,
      name: 'Ponte Rolante PR-301',
      type: 'Ponte Rolante',
      location: 'Galpão Principal',
      status: 'Operacional',
      lastMaintenance: '2024-01-05',
      nextMaintenance: '2024-04-05',
      model: 'Munck MK-500',
      serialNumber: 'PR2024004'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Operacional': return 'bg-success text-success-foreground';
      case 'Manutenção': return 'bg-warning text-warning-foreground';
      case 'Parado': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const canEdit = authState.user?.role === 'Admin' || authState.user?.role === 'Manager';

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Equipamentos</h1>
          <p className="text-muted-foreground">
            Gerencie todos os equipamentos do sistema
          </p>
        </div>
        {canEdit && (
          <Button className="gradient-primary text-primary-foreground transition-smooth">
            <Plus className="h-4 w-4 mr-2" />
            Novo Equipamento
          </Button>
        )}
      </div>

      {/* Filters and Search */}
      <Card className="shadow-card">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar equipamentos..."
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{equipments.length}</p>
              </div>
              <Settings className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Operacionais</p>
                <p className="text-2xl font-bold text-success">
                  {equipments.filter(e => e.status === 'Operacional').length}
                </p>
              </div>
              <Activity className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Em Manutenção</p>
                <p className="text-2xl font-bold text-warning">
                  {equipments.filter(e => e.status === 'Manutenção').length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Parados</p>
                <p className="text-2xl font-bold text-destructive">
                  {equipments.filter(e => e.status === 'Parado').length}
                </p>
              </div>
              <MapPin className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Equipments Table */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Lista de Equipamentos</CardTitle>
          <CardDescription>
            Visualize e gerencie todos os equipamentos cadastrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Localização</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Última Manutenção</TableHead>
                  <TableHead>Próxima Manutenção</TableHead>
                  {canEdit && <TableHead className="text-right">Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {equipments.map((equipment) => (
                  <TableRow key={equipment.id}>
                    <TableCell className="font-medium">
                      <div>
                        <p className="font-semibold">{equipment.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {equipment.model}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{equipment.type}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        {equipment.location}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(equipment.status)}>
                        {equipment.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(equipment.lastMaintenance).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      {new Date(equipment.nextMaintenance).toLocaleDateString('pt-BR')}
                    </TableCell>
                    {canEdit && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm">
                            <Calendar className="h-3 w-3 mr-1" />
                            Manutenção
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};