import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useEquipments, useCreateEquipment, useUpdateEquipment, useDeleteEquipment, Equipment } from '@/hooks/useEquipments';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Settings,
  Calendar,
  MapPin,
  Activity,
  Loader2,
  Calendar as CalendarIcon,
  Clock,
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
import { Label } from "@/components/ui/label";
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
import { useResponsibles } from '@/hooks/useResponsibles';
import { useSectors } from '@/hooks/useSectors';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, differenceInDays, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DayPicker } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';

// Definição do esquema de validação com Zod
const formSchema = z.object({
  name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres."),
  model: z.string().optional().nullable(),
  serial_number: z.string().optional().nullable().transform(e => e === "" ? null : e),
  sector_id: z.string().optional().nullable(),
  responsible_id: z.string().optional().nullable(),
  status: z.enum(['operacional', 'manutencao', 'parado']),
  last_cleaning: z.date().optional().nullable(),
  next_cleaning: z.date({
    required_error: "A data da próxima limpeza é obrigatória.",
  }),
  cleaning_frequency_days: z.coerce.number().min(1, "A frequência deve ser no mínimo 1."),
  notes: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

// Função utilitária para formatar a data para o banco de dados, ignorando o fuso horário
const formatDateToISO = (date: Date | null | undefined): string | null => {
  if (!date) return null;
  const d = new Date(date);
  return format(d, 'yyyy-MM-dd');
};

export const Equipments: React.FC = () => {
  const { authState } = useAuth();
  const { data: equipments = [], isLoading, error } = useEquipments();
  const { data: responsibles = [] } = useResponsibles();
  const { data: sectors = [] } = useSectors();

  const { mutate: createEquipment, isPending: isCreating } = useCreateEquipment();
  const { mutate: updateEquipment, isPending: isUpdating } = useUpdateEquipment();
  const { mutate: deleteEquipment, isPending: isDeleting } = useDeleteEquipment();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      model: "",
      serial_number: "",
      sector_id: "",
      responsible_id: "",
      status: "operacional",
      last_cleaning: null,
      next_cleaning: addDays(new Date(), 30),
      cleaning_frequency_days: 30,
      notes: "",
    },
  });

  const frequency = form.watch("cleaning_frequency_days");
  const lastCleaning = form.watch("last_cleaning");
  
  useEffect(() => {
    if (lastCleaning && frequency) {
      form.setValue("next_cleaning", addDays(lastCleaning, frequency));
    }
  }, [lastCleaning, frequency, form]);

  React.useEffect(() => {
    if (editingEquipment) {
      form.reset({
        name: editingEquipment.name,
        model: editingEquipment.model,
        serial_number: editingEquipment.serial_number,
        sector_id: editingEquipment.sector_id,
        responsible_id: editingEquipment.responsible_id,
        status: editingEquipment.status,
        last_cleaning: editingEquipment.last_cleaning ? new Date(editingEquipment.last_cleaning) : null,
        next_cleaning: new Date(editingEquipment.next_cleaning),
        cleaning_frequency_days: editingEquipment.cleaning_frequency_days,
        notes: editingEquipment.notes,
      });
    } else {
      form.reset();
    }
  }, [editingEquipment, form]);

  const handleOpenModal = (equipment: Equipment | null = null) => {
    setEditingEquipment(equipment);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingEquipment(null);
    setIsModalOpen(false);
  };

  const onSubmit = (values: FormValues) => {
    const commonData = {
      name: values.name,
      model: values.model,
      serial_number: values.serial_number,
      sector_id: values.sector_id || null,
      responsible_id: values.responsible_id || null,
      status: values.status,
      last_cleaning: formatDateToISO(values.last_cleaning),
      next_cleaning: formatDateToISO(values.next_cleaning),
      cleaning_frequency_days: values.cleaning_frequency_days,
      notes: values.notes || null,
    };

    if (editingEquipment) {
      updateEquipment({
        id: editingEquipment.id,
        ...commonData,
      }, {
        onSuccess: () => {
          toast({ title: "Equipamento atualizado com sucesso!" });
          handleCloseModal();
        },
        onError: (err) => {
          toast({ title: "Erro ao atualizar equipamento", description: err.message, variant: "destructive" });
        }
      });
    } else {
      createEquipment(commonData, {
        onSuccess: () => {
          toast({ title: "Equipamento criado com sucesso!" });
          handleCloseModal();
        },
        onError: (err) => {
          toast({ title: "Erro ao criar equipamento", description: err.message, variant: "destructive" });
        }
      });
    }
  };

  const handleDelete = (id: string) => {
    deleteEquipment(id, {
      onSuccess: () => {
        toast({ title: "Equipamento excluído com sucesso!" });
      },
      onError: (err) => {
        toast({ title: "Erro ao excluir equipamento", description: err.message, variant: "destructive" });
      }
    });
  };

  const handlePerformCleaning = (equipment: Equipment) => {
    const today = new Date();
    const newNextCleaning = addDays(today, equipment.cleaning_frequency_days);

    updateEquipment({
      id: equipment.id,
      last_cleaning: formatDateToISO(today),
      next_cleaning: formatDateToISO(newNextCleaning),
    }, {
      onSuccess: () => {
        toast({
          title: "Limpeza registrada com sucesso!",
          description: `A próxima limpeza de ${equipment.name} foi agendada para ${format(newNextCleaning, 'PPP', { locale: ptBR })}.`,
        });
      },
      onError: (err) => {
        toast({ title: "Erro ao registrar limpeza", description: err.message, variant: "destructive" });
      }
    });
  };

  const getDaysUntilNextCleaning = (nextCleaningDate: string) => {
    const today = new Date();
    const nextCleaning = new Date(nextCleaningDate);
    // Para garantir a precisão, comparamos as datas no mesmo fuso horário
    const todayWithoutTime = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const nextCleaningWithoutTime = new Date(nextCleaning.getFullYear(), nextCleaning.getMonth(), nextCleaning.getDate());
    return differenceInDays(nextCleaningWithoutTime, todayWithoutTime);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operacional': return 'bg-success text-success-foreground';
      case 'manutencao': return 'bg-warning text-warning-foreground';
      case 'parado': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'operacional': return 'Operacional';
      case 'manutencao': return 'Manutenção';
      case 'parado': return 'Parado';
      default: return status;
    }
  };

  const canEdit = authState.user?.role === 'admin' || authState.user?.role === 'manager';

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-32 bg-muted rounded"></div>
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
            <p className="text-destructive">Erro ao carregar equipamentos: {error.message}</p>
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
          <h1 className="text-3xl font-bold mb-2">Equipamentos</h1>
          <p className="text-muted-foreground">
            Gerencie todos os equipamentos do sistema
          </p>
        </div>
        {canEdit && (
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button
                className="gradient-primary text-primary-foreground transition-smooth"
                onClick={() => handleOpenModal()}
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Equipamento
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px]">
              <DialogHeader>
                <DialogTitle>{editingEquipment ? "Editar Equipamento" : "Adicionar Novo Equipamento"}</DialogTitle>
                <DialogDescription>
                  {editingEquipment ? "Atualize as informações do equipamento." : "Preencha os campos para adicionar um novo equipamento."}
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
                            <Input placeholder="Nome do equipamento" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="model"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Modelo</FormLabel>
                          <FormControl>
                            <Input placeholder="Modelo do equipamento" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="serial_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número de Série</FormLabel>
                        <FormControl>
                          <Input placeholder="Número de série (único)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="sector_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Setor</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value ?? ""}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um setor" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {sectors.map((sector) => (
                                <SelectItem key={sector.id} value={sector.id}>{sector.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="responsible_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Responsável</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value ?? ""}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um responsável" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {responsibles.map((responsible) => (
                                <SelectItem key={responsible.id} value={responsible.id}>{responsible.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="operacional">Operacional</SelectItem>
                              <SelectItem value="manutencao">Manutenção</SelectItem>
                              <SelectItem value="parado">Parado</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="cleaning_frequency_days"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Frequência de Limpeza (dias)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="30" {...field} onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="last_cleaning"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Última Limpeza</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP", { locale: ptBR })
                                ) : (
                                  <span>Escolha a última data de limpeza</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <DayPicker
                              locale={ptBR}
                              mode="single"
                              selected={field.value ?? undefined}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="next_cleaning"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Próxima Limpeza</FormLabel>
                        <div className="p-3 bg-muted rounded-md border text-sm font-medium">
                          {field.value ? format(field.value, "PPP", { locale: ptBR }) : 'Selecione a frequência e a última limpeza'}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Observações</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Observações importantes" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit" disabled={isCreating || isUpdating} className="gradient-primary">
                      {isCreating || isUpdating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {editingEquipment ? "Salvando..." : "Criando..."}
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
                  {equipments.filter(e => e.status === 'operacional').length}
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
                  {equipments.filter(e => e.status === 'manutencao').length}
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
                  {equipments.filter(e => e.status === 'parado').length}
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
                  <TableHead>Setor</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Última Limpeza</TableHead>
                  <TableHead>Próxima Limpeza</TableHead>
                  {canEdit && <TableHead className="text-right">Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {equipments.map((equipment) => {
                  const daysUntilNextCleaning = getDaysUntilNextCleaning(equipment.next_cleaning);
                  const isOverdue = daysUntilNextCleaning < 0;

                  return (
                    <TableRow key={equipment.id}>
                      <TableCell className="font-medium">
                        <div>
                          <p className="font-semibold">{equipment.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {equipment.model || 'N/A'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{equipment.sectors?.name || 'N/A'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {equipment.responsibles?.name || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(equipment.status)}>
                          {getStatusLabel(equipment.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {equipment.last_cleaning ? new Date(equipment.last_cleaning).toLocaleDateString('pt-BR') : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>
                            {new Date(equipment.next_cleaning).toLocaleDateString('pt-BR')}
                          </span>
                          <span className={cn(
                            "text-xs mt-1",
                            isOverdue ? "text-destructive" : "text-muted-foreground"
                          )}>
                            {isOverdue ? `(Em atraso)` : `(Faltam ${daysUntilNextCleaning} dias)`}
                          </span>
                        </div>
                      </TableCell>
                      {canEdit && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  Limpeza
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Registrar Limpeza?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Confirma que a limpeza do equipamento **{equipment.name}** foi realizada hoje? Isso irá atualizar a próxima data de limpeza automaticamente.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handlePerformCleaning(equipment)}
                                    disabled={isUpdating}
                                  >
                                    {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmar'}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenModal(equipment)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta ação não pode ser desfeita. Isso excluirá permanentemente o equipamento **{equipment.name}** do sistema.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(equipment.id)}
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