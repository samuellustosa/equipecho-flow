import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useInventory, useCreateInventoryItem, useUpdateInventoryItem, useDeleteInventoryItem, InventoryItem } from '@/hooks/useInventory';
import { useCategories, useCreateCategory, useDeleteCategory } from '@/hooks/useCategories';
import { useLocations, useCreateLocation, useDeleteLocation } from '@/hooks/useLocations';
import { useCreateInventoryMovement, useInventoryMovementHistory, InventoryMovement } from '@/hooks/useInventoryMovements';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Package,
  AlertTriangle,
  CheckCircle,
  Loader2,
  ExternalLink,
  History,
  PlusCircle,
  MinusCircle,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ScrollArea } from '@/components/ui/scroll-area';

// Esquema de validação para o formulário de inventário
const formSchema = z.object({
  name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres."),
  description: z.string().optional().nullable(),
  category_id: z.string().optional().nullable(),
  location_id: z.string().optional().nullable(),
  minimum_quantity: z.coerce.number().min(0, "A quantidade mínima não pode ser negativa."),
  unit: z.string().min(1, "A unidade é obrigatória."),
});
type FormValues = z.infer<typeof formSchema>;

// Esquema de validação para o formulário de movimentação de estoque
const movementFormSchema = z.object({
  quantity: z.coerce.number().min(1, "A quantidade deve ser no mínimo 1."),
  type: z.enum(['entrada', 'saida'], {
    required_error: "O tipo de movimento é obrigatório."
  }),
  reason: z.string().optional().nullable(),
});
type MovementFormValues = z.infer<typeof movementFormSchema>;

// Componente para o modal de histórico
interface InventoryMovementHistoryModalProps {
  item: InventoryItem;
  isOpen: boolean;
  onClose: () => void;
}

const InventoryMovementHistoryModal: React.FC<InventoryMovementHistoryModalProps> = ({ item, isOpen, onClose }) => {
  const { data: movements = [], isLoading, error } = useInventoryMovementHistory(item.id);

  const getMovementIcon = (type: string) => {
    return type === 'entrada'
      ? <PlusCircle className="h-4 w-4 text-success" />
      : <MinusCircle className="h-4 w-4 text-destructive" />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Histórico de Estoque - {item.name}</DialogTitle>
          <DialogDescription>
            Movimentações do item: **{item.name}**.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-72">
          <div className="p-4">
            {isLoading ? (
              <p>Carregando histórico...</p>
            ) : error ? (
              <p className="text-destructive">Erro ao carregar histórico: {error.message}</p>
            ) : movements.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Razão</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.map((movement) => (
                    <TableRow key={movement.id} className="transition-all hover:bg-muted/50">
                      <TableCell className="text-sm font-medium">
                        <div className="flex items-center gap-2">
                          {getMovementIcon(movement.type)}
                          {format(new Date(movement.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </div>
                      </TableCell>
                      <TableCell className="capitalize text-muted-foreground">
                        {movement.type}
                      </TableCell>
                      <TableCell className={cn(
                        "font-bold",
                        movement.type === 'entrada' ? 'text-success' : 'text-destructive'
                      )}>
                        {movement.type === 'entrada' ? '+' : '-'} {movement.quantity}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {movement.reason || 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground">Nenhum registro de movimentação encontrado.</p>
            )}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const Inventory: React.FC = () => {
  const { authState } = useAuth();
  const { data: inventoryItems = [], isLoading, error } = useInventory();
  const { mutate: createItem, isPending: isCreating } = useCreateInventoryItem();
  const { mutate: updateItem, isPending: isUpdating } = useUpdateInventoryItem();
  const { mutate: deleteItem, isPending: isDeleting } = useDeleteInventoryItem();

  const { data: categories = [] } = useCategories();
  const { data: locations = [] } = useLocations();
  const { mutate: createCategory, isPending: isCreatingCategory } = useCreateCategory();
  const { mutate: deleteCategory, isPending: isDeletingCategory } = useDeleteCategory();
  const { mutate: createLocation, isPending: isCreatingLocation } = useCreateLocation();
  const { mutate: deleteLocation, isPending: isDeletingLocation } = useDeleteLocation();
  const { mutate: createInventoryMovement, isPending: isCreatingMovement } = useCreateInventoryMovement();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newLocationName, setNewLocationName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    status: 'all',
    category_id: 'all',
    location_id: 'all',
  });
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [selectedItemForMovement, setSelectedItemForMovement] = useState<InventoryItem | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedItemForHistory, setSelectedItemForHistory] = useState<InventoryItem | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      category_id: null,
      location_id: null,
      minimum_quantity: 0,
      unit: "un",
    },
  });

  const movementForm = useForm<MovementFormValues>({
    resolver: zodResolver(movementFormSchema),
    defaultValues: {
      quantity: 1,
      type: 'entrada',
      reason: null,
    },
  });

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'normal': return 'Normal';
      case 'baixo': return 'Baixo';
      case 'critico': return 'Crítico';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'bg-success text-success-foreground';
      case 'baixo': return 'bg-warning text-warning-foreground';
      case 'critico': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const calculateStatus = (current: number, minimum: number): 'normal' | 'baixo' | 'critico' => {
    if (current <= minimum * 0.5) {
      return 'critico';
    } else if (current <= minimum) {
      return 'baixo';
    } else {
      return 'normal';
    }
  };

  const filteredItems = inventoryItems.filter(item => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = (
      item.name.toLowerCase().includes(term) ||
      item.description?.toLowerCase().includes(term) ||
      (item.categories?.name.toLowerCase() || '').includes(term) ||
      (item.locations?.name.toLowerCase() || '').includes(term)
    );

    const matchesFilters = (
      (activeFilters.status === 'all' || item.status === activeFilters.status) &&
      (activeFilters.category_id === 'all' || item.category_id === activeFilters.category_id) &&
      (activeFilters.location_id === 'all' || item.location_id === activeFilters.location_id)
    );
    
    return matchesSearch && matchesFilters;
  });

  const stats = {
    totalItems: filteredItems.length,
    lowStockItems: filteredItems.filter(item => item.status === 'baixo' || item.status === 'critico').length,
    criticalItems: filteredItems.filter(item => item.status === 'critico').length,
    normalItems: filteredItems.filter(item => item.status === 'normal').length
  };

  const canEdit = authState.user?.role === 'admin' || authState.user?.role === 'manager';
  const isAdmin = authState.user?.role === 'admin';

  const handleOpenModal = (item: InventoryItem | null = null) => {
    setEditingItem(item);
    if (item) {
      form.reset({
        name: item.name,
        description: item.description,
        category_id: item.category_id,
        location_id: item.location_id,
        minimum_quantity: item.minimum_quantity,
        unit: item.unit,
      });
    } else {
      form.reset({
        name: "",
        description: "",
        category_id: null,
        location_id: null,
        minimum_quantity: 0,
        unit: "un",
      });
    }
    setIsModalOpen(true);
  };

  const handleOpenMovementModal = (item: InventoryItem) => {
    setSelectedItemForMovement(item);
    movementForm.reset({
      quantity: 1,
      type: 'entrada',
      reason: null,
    });
    setIsMovementModalOpen(true);
  };
  
  const handleOpenHistoryModal = (item: InventoryItem) => {
    setSelectedItemForHistory(item);
    setIsHistoryModalOpen(true);
  };


  const handleCloseModal = (open: boolean) => {
    if (!open) {
      setEditingItem(null);
      form.reset();
      setIsModalOpen(false);
    }
  };

  const onMovementSubmit = (values: MovementFormValues) => {
    if (!selectedItemForMovement) return;

    // Garante que a quantidade não se torne negativa em caso de saída
    if (values.type === 'saida' && values.quantity > selectedItemForMovement.current_quantity) {
      toast({
        title: "Erro de estoque",
        description: "A quantidade de saída não pode ser maior que o estoque atual.",
        variant: "destructive",
      });
      return;
    }

    createInventoryMovement({
      inventory_item_id: selectedItemForMovement.id,
      quantity: values.quantity,
      type: values.type,
      reason: values.reason,
    }, {
      onSuccess: () => {
        toast({ title: `Movimentação de ${values.type} registrada com sucesso!` });
        setIsMovementModalOpen(false);
      },
      onError: (err) => {
        toast({ title: "Erro ao registrar movimentação", description: err.message, variant: "destructive" });
      }
    });
  };

  const onSubmit = (values: FormValues) => {
    const itemData = {
      name: values.name,
      description: values.description,
      category_id: values.category_id,
      location_id: values.location_id,
      minimum_quantity: values.minimum_quantity,
      unit: values.unit,
    };

    if (editingItem) {
      updateItem({ id: editingItem.id, ...itemData as any }, {
        onSuccess: () => {
          toast({ title: "Item do inventário atualizado com sucesso!" });
          setIsModalOpen(false);
        },
        onError: (err) => {
          toast({ title: "Erro ao atualizar item", description: err.message, variant: "destructive" });
        }
      });
    } else {
      createItem({ ...itemData, current_quantity: 0, status: 'normal' }, {
        onSuccess: () => {
          toast({ title: "Item do inventário criado com sucesso!" });
          setIsModalOpen(false);
        },
        onError: (err) => {
          toast({ title: "Erro ao criar item", description: err.message, variant: "destructive" });
        }
      });
    }
  };

  const handleDelete = (id: string) => {
    deleteItem(id, {
      onSuccess: () => {
        toast({ title: "Item do inventário excluído com sucesso!" });
      },
      onError: (err) => {
        toast({ title: "Erro ao excluir item", description: err.message, variant: "destructive" });
      }
    });
  };

  const handleCreateCategory = () => {
    if (newCategoryName.trim()) {
      createCategory({ name: newCategoryName }, {
        onSuccess: () => {
          setNewCategoryName('');
          toast({ title: "Categoria criada com sucesso!" });
        },
        onError: (err) => {
          toast({ title: "Erro ao criar categoria", description: err.message, variant: "destructive" });
        }
      });
    }
  };

  const handleDeleteCategory = (id: string) => {
    deleteCategory(id, {
      onSuccess: () => {
        toast({ title: "Categoria excluída com sucesso!" });
      },
      onError: (err) => {
        toast({ title: "Erro ao excluir categoria", description: err.message, variant: "destructive" });
        }
      });
  };

  const handleCreateLocation = () => {
    if (newLocationName.trim()) {
      createLocation({ name: newLocationName }, {
        onSuccess: () => {
          setNewLocationName('');
          toast({ title: "Localização criada com sucesso!" });
        },
        onError: (err) => {
          toast({ title: "Erro ao criar localização", description: err.message, variant: "destructive" });
        }
      });
    }
  };

  const handleDeleteLocation = (id: string) => {
    deleteLocation(id, {
      onSuccess: () => {
        toast({ title: "Localização excluída com sucesso!" });
      },
      onError: (err) => {
        toast({ title: "Erro ao excluir localização", description: err.message, variant: "destructive" });
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
            <p className="text-destructive">Erro ao carregar inventário: {error.message}</p>
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
          <h1 className="text-3xl font-bold mb-2">Inventário</h1>
          <p className="text-muted-foreground">
            Controle de estoque e materiais de manutenção
          </p>
        </div>
        {canEdit && (
          <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
            <DialogTrigger asChild>
              <Button
                className="gradient-primary text-primary-foreground transition-smooth"
                onClick={() => handleOpenModal()}
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Item
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px]">
              <DialogHeader>
                <DialogTitle>{editingItem ? "Editar Item" : "Adicionar Novo Item"}</DialogTitle>
                <DialogDescription>
                  {editingItem ? "Atualize as informações do item do inventário." : "Preencha os campos para adicionar um novo item ao inventário."}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome do item" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="category_id"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between">
                            <FormLabel>Categoria</FormLabel>
                            {isAdmin && (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="link" size="sm" className="h-4 p-0 text-xs">
                                    Gerenciar <ExternalLink className="ml-1 h-3 w-3" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[425px]">
                                  <DialogHeader>
                                    <DialogTitle>Gerenciar Categorias</DialogTitle>
                                    <DialogDescription>
                                      Crie ou exclua categorias para o inventário.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="flex gap-2 mb-4">
                                    <Input
                                      placeholder="Nova categoria"
                                      value={newCategoryName}
                                      onChange={(e) => setNewCategoryName(e.target.value)}
                                    />
                                    <Button
                                      onClick={handleCreateCategory}
                                      disabled={!newCategoryName || isCreatingCategory}
                                    >
                                      {isCreatingCategory ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                    </Button>
                                  </div>
                                  <div className="max-h-[300px] overflow-y-auto">
                                    {categories.length > 0 ? (
                                      <ul className="space-y-2">
                                        {categories.map((category) => (
                                          <li key={category.id} className="flex items-center justify-between p-2 border rounded-md">
                                            <span>{category.name}</span>
                                            <AlertDialog>
                                              <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="sm" className="text-destructive">
                                                  <Trash2 className="h-4 w-4" />
                                                </Button>
                                              </AlertDialogTrigger>
                                              <AlertDialogContent>
                                                <AlertDialogHeader>
                                                  <AlertDialogTitle>Excluir Categoria?</AlertDialogTitle>
                                                  <AlertDialogDescription>
                                                    Esta ação é irreversível. Todos os itens de inventário associados a esta categoria terão seu campo de categoria removido.
                                                  </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                  <AlertDialogAction
                                                    onClick={() => handleDeleteCategory(category.id)}
                                                    disabled={isDeletingCategory}
                                                  >
                                                    {isDeletingCategory ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Excluir'}
                                                  </AlertDialogAction>
                                                </AlertDialogFooter>
                                              </AlertDialogContent>
                                            </AlertDialog>
                                          </li>
                                        ))}
                                      </ul>
                                    ) : (
                                      <p className="text-center text-muted-foreground">Nenhuma categoria encontrada.</p>
                                    )}
                                  </div>
                                  <DialogFooter>
                                    <DialogClose asChild>
                                      <Button type="button" variant="outline">Fechar</Button>
                                    </DialogClose>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            )}
                          </div>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione uma categoria" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem key={category.id} value={category.id}>
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Descrição detalhada do item" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="minimum_quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estoque Mínimo</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="unit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unidade</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: un, kg, litros" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="location_id"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel>Localização</FormLabel>
                          {isAdmin && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="link" size="sm" className="h-4 p-0 text-xs">
                                  Gerenciar <ExternalLink className="ml-1 h-3 w-3" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                  <DialogTitle>Gerenciar Localizações</DialogTitle>
                                  <DialogDescription>
                                    Crie ou exclua localizações para o inventário.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="flex gap-2 mb-4">
                                  <Input
                                    placeholder="Nova localização"
                                    value={newLocationName}
                                    onChange={(e) => setNewLocationName(e.target.value)}
                                  />
                                  <Button
                                    onClick={handleCreateLocation}
                                    disabled={!newLocationName || isCreatingLocation}
                                  >
                                    {isCreatingLocation ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                  </Button>
                                </div>
                                <div className="max-h-[300px] overflow-y-auto">
                                  {locations.length > 0 ? (
                                    <ul className="space-y-2">
                                      {locations.map((location) => (
                                        <li key={location.id} className="flex items-center justify-between p-2 border rounded-md">
                                          <span>{location.name}</span>
                                          <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                              <Button variant="ghost" size="sm" className="text-destructive">
                                                <Trash2 className="h-4 w-4" />
                                              </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                              <AlertDialogHeader>
                                                <AlertDialogTitle>Excluir Localização?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                  Esta ação é irreversível. Todos os itens de inventário associados a esta localização terão seu campo de localização removido.
                                                </AlertDialogDescription>
                                              </AlertDialogHeader>
                                              <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction
                                                  onClick={() => handleDeleteLocation(location.id)}
                                                  disabled={isDeletingLocation}
                                                >
                                                  {isDeletingLocation ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Excluir'}
                                                </AlertDialogAction>
                                              </AlertDialogFooter>
                                            </AlertDialogContent>
                                          </AlertDialog>
                                        </li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <p className="text-center text-muted-foreground">Nenhuma localização encontrada.</p>
                                  )}
                                </div>
                                <DialogFooter>
                                  <DialogClose asChild>
                                    <Button type="button" variant="outline">Fechar</Button>
                                  </DialogClose>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione uma localização" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {locations.map((location) => (
                              <SelectItem key={location.id} value={location.id}>
                                {location.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                <p className="text-sm text-muted-foreground">Estoque Normal</p>
                <p className="text-2xl font-bold text-success">{stats.normalItems}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-success" />
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
                  <DialogTitle>Filtrar Itens</DialogTitle>
                  <DialogDescription>
                    Selecione as opções para filtrar a lista de itens.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      onValueChange={(value) => setActiveFilters({ ...activeFilters, status: value })}
                      value={activeFilters.status}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="baixo">Baixo</SelectItem>
                        <SelectItem value="critico">Crítico</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Categoria</Label>
                    <Select
                      onValueChange={(value) => setActiveFilters({ ...activeFilters, category_id: value })}
                      value={activeFilters.category_id}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todas as Categorias" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Localização</Label>
                    <Select
                      onValueChange={(value) => setActiveFilters({ ...activeFilters, location_id: value })}
                      value={activeFilters.location_id}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todas as Localizações" />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map(location => (
                          <SelectItem key={location.id} value={location.id}>
                            {location.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setActiveFilters({ status: 'all', category_id: 'all', location_id: 'all' })}
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
                  <TableHead>Localização</TableHead>
                  {canEdit && <TableHead className="text-right">Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => {
                  const category = categories.find(c => c.id === item.category_id);
                  const location = locations.find(l => l.id === item.location_id);
                  const itemStatus = calculateStatus(item.current_quantity, item.minimum_quantity);
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        <div>
                          <p className="font-semibold">{item.name}</p>
                          {item.description && (
                            <p className="text-xs text-muted-foreground">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{category?.name || 'N/A'}</TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {item.current_quantity} {item.unit}
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.minimum_quantity} {item.unit}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(itemStatus)}>
                          {getStatusLabel(itemStatus)}
                        </Badge>
                      </TableCell>
                      <TableCell>{location?.name || 'N/A'}</TableCell>
                      {canEdit && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                          <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <PlusCircle className="h-3 w-3 mr-1" />
                                    Ações
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleOpenModal(item)}>
                                  <Edit className="h-3 w-3 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleOpenMovementModal(item)}>
                                  <PlusCircle className="h-3 w-3 mr-2" />
                                  Adicionar/Remover Estoque
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleOpenHistoryModal(item)}>
                                  <History className="h-3 w-3 mr-2" />
                                  Ver Histórico
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                                      <Trash2 className="h-3 w-3 mr-2" />
                                      Excluir
                                    </DropdownMenuItem>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Esta ação não pode ser desfeita. Isso excluirá permanentemente o item <strong style={{ color: 'red' }}>{item.name}</strong> do inventário.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDelete(item.id)}
                                        disabled={isDeleting}
                                      >
                                        {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Continuar'}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </DropdownMenuContent>
                            </DropdownMenu>
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
      
      {/* Modal para Adicionar/Remover Estoque */}
      {selectedItemForMovement && (
        <Dialog open={isMovementModalOpen} onOpenChange={setIsMovementModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Mover Estoque - {selectedItemForMovement.name}</DialogTitle>
              <DialogDescription>
                Quantidade atual: {selectedItemForMovement.current_quantity} {selectedItemForMovement.unit}
              </DialogDescription>
            </DialogHeader>
            <Form {...movementForm}>
              <form onSubmit={movementForm.handleSubmit(onMovementSubmit)} className="space-y-4">
                <FormField
                  control={movementForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Movimento</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="entrada">Entrada</SelectItem>
                          <SelectItem value="saida">Saída</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={movementForm.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantidade</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={movementForm.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Razão (Opcional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Motivo da movimentação" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={isCreatingMovement} className="gradient-primary">
                    {isCreatingMovement ? (
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

      {/* Modal para Histórico de Movimentações */}
      {selectedItemForHistory && (
        <InventoryMovementHistoryModal 
          item={selectedItemForHistory}
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
        />
      )}
    </div>
  );
};