import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser, UserProfile } from '@/hooks/useUsers';
import { useAuth } from '@/hooks/useAuth';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Users as UsersIcon,
  Crown,
  Shield,
  User,
  Loader2,
  ExternalLink
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';

// Definição do esquema de validação com Zod
const formSchema = z.object({
  name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres."),
  email: z.string().email("Por favor, insira um email válido."),
  role: z.enum(['admin', 'manager', 'user'], {
    required_error: "A função é obrigatória."
  }),
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres.").optional(),
});

type FormValues = z.infer<typeof formSchema>;

export const Users: React.FC = () => {
  const { data: users = [], isLoading, error } = useUsers();
  const { authState } = useAuth();
  const { mutate: createUser, isPending: isCreating } = useCreateUser();
  const { mutate: updateUser, isPending: isUpdating } = useUpdateUser();
  const { mutate: deleteUser, isPending: isDeleting } = useDeleteUser();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    role: 'all',
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      role: 'user',
      password: '',
    },
  });

  const getRoleInfo = (role: string) => {
    switch (role) {
      case 'admin':
        return {
          color: 'bg-destructive text-destructive-foreground',
          icon: Crown,
          description: 'Administrador'
        };
      case 'manager':
        return {
          color: 'bg-warning text-warning-foreground',
          icon: Shield,
          description: 'Gerente'
        };
      case 'user':
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

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };
  
  const filteredUsers = users.filter(user => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = (
      user.name.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term)
    );
    const matchesFilters = (
      activeFilters.role === 'all' || user.role === activeFilters.role
    );
    return matchesSearch && matchesFilters;
  });

  const stats = {
    totalUsers: filteredUsers.length,
    activeUsers: filteredUsers.length,
    admins: filteredUsers.filter(u => u.role === 'admin').length,
    managers: filteredUsers.filter(u => u.role === 'manager').length
  };

  const handleOpenModal = (user: UserProfile | null = null) => {
    setEditingUser(user);
    if (user) {
      form.reset({
        name: user.name,
        email: user.email,
        role: user.role,
        password: '',
      });
    } else {
      form.reset({
        name: "",
        email: "",
        role: 'user',
        password: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = (open: boolean) => {
    if (!open) {
      setEditingUser(null);
      form.reset();
      setIsModalOpen(false);
    }
  };

  const onSubmit = (values: FormValues) => {
    if (editingUser) {
      // Cria uma cópia dos valores e remove a senha antes de enviar para a API
      const updatedValues = { ...values };
      delete updatedValues.password;

      updateUser({ id: editingUser.id, ...updatedValues }, {
        onSuccess: () => {
          toast({ title: "Usuário atualizado com sucesso!" });
          setIsModalOpen(false);
        },
        onError: (err) => {
          toast({ title: "Erro ao atualizar usuário", description: err.message, variant: "destructive" });
        }
      });
    } else {
      // Lógica para criar um novo usuário (a senha é obrigatória neste caso)
      createUser(values as { email: string; password: string; name: string; role: 'admin' | 'manager' | 'user' }, {
        onSuccess: () => {
          toast({ title: "Usuário criado com sucesso!" });
          setIsModalOpen(false);
        },
        onError: (err) => {
          toast({ title: "Erro ao criar usuário", description: err.message, variant: "destructive" });
        }
      });
    }
  };

  const handleDelete = (id: string) => {
    deleteUser(id, {
      onSuccess: () => {
        toast({ title: "Usuário excluído com sucesso!" });
      },
      onError: (err) => {
        toast({ title: "Erro ao excluir usuário", description: err.message, variant: "destructive" });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">Erro ao carregar usuários: {error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

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
        {authState.user?.role === 'admin' && (
          <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
            <DialogTrigger asChild>
              <Button
                className="gradient-primary text-primary-foreground transition-smooth"
                onClick={() => handleOpenModal()}
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{editingUser ? "Editar Usuário" : "Adicionar Novo Usuário"}</DialogTitle>
                <DialogDescription>
                  {editingUser ? "Atualize as informações do usuário." : "Preencha os campos para adicionar um novo usuário."}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome completo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="email@exemplo.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Função</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione uma função" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="user">Usuário</SelectItem>
                            <SelectItem value="manager">Gerente</SelectItem>
                            <SelectItem value="admin">Administrador</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {!editingUser && (
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Senha</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="********" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="outline">
                        Cancelar
                      </Button>
                    </DialogClose>
                    <Button type="submit" disabled={isCreating || isUpdating} className="gradient-primary">
                      {isCreating || isUpdating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        "Salvar"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
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
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Dialog open={isFilterModalOpen} onOpenChange={setIsFilterModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Filtrar Usuários</DialogTitle>
                  <DialogDescription>
                    Selecione as opções para filtrar a lista de usuários.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label>Função</Label>
                    <Select
                      onValueChange={(value) => setActiveFilters({ ...activeFilters, role: value })}
                      value={activeFilters.role}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todas as Funções" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="manager">Gerente</SelectItem>
                        <SelectItem value="user">Usuário</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setActiveFilters({ role: 'all' })}
                  >
                    Limpar Filtros
                  </Button>
                  <Button onClick={() => setIsFilterModalOpen(false)}>
                    Aplicar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
                  <TableHead>Criado em</TableHead>
                  {authState.user?.role === 'admin' && <TableHead className="text-right">Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => {
                  const roleInfo = getRoleInfo(user.role);
                  const RoleIcon = roleInfo.icon;
                  const isCurrentUser = authState.user?.id === user.id;
                  
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
                              ID: {user.id.slice(0, 8)}...
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
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      {authState.user?.role === 'admin' && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenModal(user)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={isCurrentUser}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta ação não pode ser desfeita. Isso excluirá permanentemente o usuário <strong style={{ color: 'red' }}>{user.name}</strong>.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(user.id)}
                                    disabled={isDeleting}
                                  >
                                    {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Continuar'}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      )}
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