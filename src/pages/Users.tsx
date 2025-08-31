import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Plus, 
  Search, 
  Filter,
  Edit,
  Trash2,
  Users as UsersIcon,
  Crown,
  Shield,
  User
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Users: React.FC = () => {
  // Mock data - replace with real data from Supabase
  const users = [
    {
      id: 1,
      name: 'João Silva',
      email: 'joao.silva@equipecho.com',
      role: 'Admin',
      status: 'Ativo',
      lastLogin: '2024-01-15T10:30:00Z',
      createdAt: '2023-06-15T00:00:00Z',
      department: 'TI'
    },
    {
      id: 2,
      name: 'Maria Santos',
      email: 'maria.santos@equipecho.com',
      role: 'Manager',
      status: 'Ativo',
      lastLogin: '2024-01-15T09:15:00Z',
      createdAt: '2023-08-20T00:00:00Z',
      department: 'Manutenção'
    },
    {
      id: 3,
      name: 'Carlos Lima',
      email: 'carlos.lima@equipecho.com',
      role: 'User',
      status: 'Ativo',
      lastLogin: '2024-01-14T16:45:00Z',
      createdAt: '2023-09-10T00:00:00Z',
      department: 'Operações'
    },
    {
      id: 4,
      name: 'Ana Costa',
      email: 'ana.costa@equipecho.com',
      role: 'Manager',
      status: 'Inativo',
      lastLogin: '2024-01-10T14:20:00Z',
      createdAt: '2023-07-05T00:00:00Z',
      department: 'Qualidade'
    },
    {
      id: 5,
      name: 'Roberto Oliveira',
      email: 'roberto.oliveira@equipecho.com',
      role: 'User',
      status: 'Ativo',
      lastLogin: '2024-01-15T11:00:00Z',
      createdAt: '2023-10-01T00:00:00Z',
      department: 'Manutenção'
    }
  ];

  const getRoleInfo = (role: string) => {
    switch (role) {
      case 'Admin':
        return { 
          color: 'bg-destructive text-destructive-foreground', 
          icon: Crown,
          description: 'Administrador'
        };
      case 'Manager':
        return { 
          color: 'bg-warning text-warning-foreground', 
          icon: Shield,
          description: 'Gerente'
        };
      case 'User':
        return { 
          color: 'bg-success text-success-foreground', 
          icon: User,
          description: 'Usuário'
        };
      default:
        return { 
          color: 'bg-muted text-muted-foreground', 
          icon: User,
          description: 'Usuário'
        };
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'Ativo' 
      ? 'bg-success text-success-foreground' 
      : 'bg-muted text-muted-foreground';
  };

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatLastLogin = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return `Há ${Math.floor(diffInHours)} horas`;
    } else {
      return date.toLocaleDateString('pt-BR');
    }
  };

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.status === 'Ativo').length,
    admins: users.filter(u => u.role === 'Admin').length,
    managers: users.filter(u => u.role === 'Manager').length
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Usuários</h1>
          <p className="text-muted-foreground">
            Gerencie usuários e permissões do sistema
          </p>
        </div>
        <Button className="gradient-primary text-primary-foreground transition-smooth">
          <Plus className="h-4 w-4 mr-2" />
          Novo Usuário
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Usuários</p>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
              </div>
              <UsersIcon className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Usuários Ativos</p>
                <p className="text-2xl font-bold text-success">{stats.activeUsers}</p>
              </div>
              <User className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Administradores</p>
                <p className="text-2xl font-bold text-destructive">{stats.admins}</p>
              </div>
              <Crown className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Gerentes</p>
                <p className="text-2xl font-bold text-warning">{stats.managers}</p>
              </div>
              <Shield className="h-8 w-8 text-warning" />
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
                placeholder="Buscar usuários..."
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

      {/* Users Table */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Lista de Usuários</CardTitle>
          <CardDescription>
            Visualize e gerencie todos os usuários do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Último Acesso</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => {
                  const roleInfo = getRoleInfo(user.role);
                  const RoleIcon = roleInfo.icon;
                  
                  return (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {getUserInitials(user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">{user.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Desde {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge className={roleInfo.color}>
                          <RoleIcon className="h-3 w-3 mr-1" />
                          {roleInfo.description}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.department}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(user.status)}>
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatLastLogin(user.lastLogin)}
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