import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useEquipments, useCreateEquipment, useUpdateEquipment, useDeleteEquipment, Equipment } from '@/hooks/useEquipments';
import {
  Plus,
  Edit,
  Trash2,
  Settings,
  Calendar as CalendarIcon,
  Loader2,
  Activity,
  Wrench,
  MapPin,
  AlertCircle,
  Clock,
  ExternalLink,
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
import { useResponsibles, useCreateResponsible, useDeleteResponsible } from '@/hooks/useResponsibles';
import { useSectors, useCreateSector, useDeleteSector } from '@/hooks/useSectors';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, differenceInDays, addDays, parseISO } from 'date-fns';
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

const sectorFormSchema = z.object({
  name: z.string().min(2, "O nome do setor deve ter pelo menos 2 caracteres."),
});

const responsibleFormSchema = z.object({
  name: z.string().min(2, "O nome do responsável deve ter pelo menos 2 caracteres."),
});


type FormValues = z.infer<typeof formSchema>;
type SectorFormValues = z.infer<typeof sectorFormSchema>;
type ResponsibleFormValues = z.infer<typeof responsibleFormSchema>;

// Função utilitária para formatar a data para o banco de dados como uma string 'YYYY-MM-DD'
const formatDateToISO = (date: Date | null | undefined): string | null => {
  if (!date) return null;

  // Usamos a data local mas formatamos como YYYY-MM-DD sem conversão de timezone
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const statusConfig = {
  operacional: { label: 'Operacional', color: 'bg-success text-success-foreground' },
  manutencao: { label: 'Manutenção', color: 'bg-warning text-warning-foreground' },
  parado: { label: 'Parado', color: 'bg-destructive text-destructive-foreground' },
};

export const Equipments: React.FC = () => {
  const { authState } = useAuth();
  const { data: equipments = [], isLoading, error } = useEquipments();
  const { data: responsibles = [] } = useResponsibles();
  const { data: sectors = [] } = useSectors();

  const { mutate: createEquipment, isPending: isCreating } = useCreateEquipment();
  const { mutate: updateEquipment, isPending: isUpdating } = useUpdateEquipment();
  const { mutate: deleteEquipment, isPending: isDeleting } = useDeleteEquipment();
  const { mutate: createResponsible, isPending: isCreatingResponsible } = useCreateResponsible();
  const { mutate: createSector, isPending: isCreatingSector } = useCreateSector();
  const { mutate: deleteResponsible, isPending: isDeletingResponsible } = useDeleteResponsible();
  const { mutate: deleteSector, isPending: isDeletingSector } = useDeleteSector();


  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSectorModalOpen, setIsSectorModalOpen] = useState(false);
  const [isResponsibleModalOpen, setIsResponsibleModalOpen] = useState(false);
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

  const sectorForm = useForm<SectorFormValues>({
    resolver: zodResolver(sectorFormSchema),
    defaultValues: { name: "" },
  });

  const responsibleForm = useForm<ResponsibleFormValues>({
    resolver: zodResolver(responsibleFormSchema),
    defaultValues: { name: "" },
  });


  const frequency = form.watch("cleaning_frequency_days");
  const lastCleaning = form.watch("last_cleaning");

  useEffect(() => {
    if (lastCleaning && frequency) {
      form.setValue("next_cleaning", addDays(lastCleaning, frequency));
    }
  }, [lastCleaning, frequency, form]);

  const handleOpenModal = (equipment: Equipment | null = null) => {
    setEditingEquipment(equipment);
    if (equipment) {
      form.reset({
        name: equipment.name,
        model: equipment.model,
        serial_number: equipment.serial_number,
        sector_id: equipment.sector_id,
        responsible_id: equipment.responsible_id,
        status: equipment.status,
        last_cleaning: equipment.last_cleaning ? 
          new Date(equipment.last_cleaning + 'T00:00:00') : null,
        next_cleaning: new Date(equipment.next_cleaning + 'T00:00:00'),
        cleaning_frequency_days: equipment.cleaning_frequency_days,
        notes: equipment.notes,
      });
    } else {
      form.reset(); // Limpa o formulário imediatamente para um novo equipamento
    }
    setIsModalOpen(true);
  };
  
  const handleCloseModal = (open: boolean) => {
    if (!open) {
      setEditingEquipment(null);
      form.reset(); // Reinicia o formulário quando o modal é fechado
      setIsModalOpen(false);
    }
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
          setIsModalOpen(false);
        },
        onError: (err) => {
          toast({ title: "Erro ao atualizar equipamento", description: err.message, variant: "destructive" });
        }
      });
    } else {
      createEquipment(commonData, {
        onSuccess: () => {
          toast({ title: "Equipamento criado com sucesso!" });
          setIsModalOpen(false);
        },
        onError: (err) => {
          toast({ title: "Erro ao criar equipamento", description: err.message, variant: "destructive" });
        }
      });
    }
  };

  const onSectorSubmit = (values: SectorFormValues) => {
    createSector(values as { name: string }, {
      onSuccess: () => {
        toast({ title: "Setor criado com sucesso!" });
        setIsSectorModalOpen(false);
        sectorForm.reset();
      },
      onError: (err) => {
        toast({ title: "Erro ao criar setor", description: err.message, variant: "destructive" });
      }
    });
  };

  const onResponsibleSubmit = (values: ResponsibleFormValues) => {
    createResponsible(values as { name: string }, {
      onSuccess: () => {
        toast({ title: "Responsável criado com sucesso!" });
        setIsResponsibleModalOpen(false);
        responsibleForm.reset();
      },
      onError: (err) => {
        toast({ title: "Erro ao criar responsável", description: err.message, variant: "destructive" });
      }
    });
  };
  
  const handleDeleteSector = (id: string) => {
    deleteSector(id, {
      onSuccess: () => {
        toast({ title: "Setor excluído com sucesso!" });
      },
      onError: (err) => {
        toast({ title: "Erro ao excluir setor", description: err.message, variant: "destructive" });
      }
    });
  };

  const handleDeleteResponsible = (id: string) => {
    deleteResponsible(id, {
      onSuccess: () => {
        toast({ title: "Responsável excluído com sucesso!" });
      },
      onError: (err) => {
        toast({ title: "Erro ao excluir responsável", description: err.message, variant: "destructive" });
      }
    });
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
    today.setHours(0, 0, 0, 0);

    const newNextCleaning = addDays(today, equipment.cleaning_frequency_days);

    updateEquipment({
      id: equipment.id,
      last_cleaning: formatDateToISO(today),
      next_cleaning: formatDateToISO(newNextCleaning),
    }, {
      onSuccess: () => {
        toast({
          title: "Limpeza registrada com sucesso!",
          description: `A próxima limpeza de ${equipment.name} foi agendada para ${format(newNextCleaning, 'dd/MM/yyyy')}.`,
        });
      },
      onError: (err) => {
        toast({ title: "Erro ao registrar limpeza", description: err.message, variant: "destructive" });
      }
    });
  };

  const getDaysUntilNextCleaning = (nextCleaningDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextCleaning = parseISO(nextCleaningDate);
    return differenceInDays(nextCleaning, today);
  };
  
  // Variáveis para controle de permissões
  const canEdit = authState.user?.role === 'admin' || authState.user?.role === 'manager';
  const isAdmin = authState.user?.role === 'admin';

  const overdueCount = equipments.filter(e => getDaysUntilNextCleaning(e.next_cleaning) < 0).length;
  const warningCount = equipments.filter(e => getDaysUntilNextCleaning(e.next_cleaning) === 0).length;

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
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Botão de Novo Responsável, visível apenas para Admin */}
          {isAdmin && (
            <Dialog open={isResponsibleModalOpen} onOpenChange={setIsResponsibleModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="transition-smooth">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Responsável
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Novo Responsável</DialogTitle>
                  <DialogDescription>
                    Adicione um novo responsável ao sistema.
                  </DialogDescription>
                </DialogHeader>
                <Form {...responsibleForm}>
                  <form onSubmit={responsibleForm.handleSubmit(onResponsibleSubmit)} className="space-y-4">
                    <FormField
                      control={responsibleForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome do responsável" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="submit" disabled={isCreatingResponsible}>
                        {isCreatingResponsible ? (
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

          {/* Botão de Novo Setor, visível apenas para Admin */}
          {isAdmin && (
            <Dialog open={isSectorModalOpen} onOpenChange={setIsSectorModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="transition-smooth">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Setor
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Novo Setor</DialogTitle>
                  <DialogDescription>
                    Adicione um novo setor ao sistema.
                  </DialogDescription>
                </DialogHeader>
                <Form {...sectorForm}>
                  <form onSubmit={sectorForm.handleSubmit(onSectorSubmit)} className="space-y-4">
                    <FormField
                      control={sectorForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome do setor" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="submit" disabled={isCreatingSector}>
                        {isCreatingSector ? (
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
          
          {canEdit && (
            <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
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
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="sector_id"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center justify-between">
                              <FormLabel>Setor</FormLabel>
                              {/* Modal de gerenciamento de setores, visível apenas para Admin */}
                              {isAdmin && (
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="link" size="sm" className="h-4 p-0 text-xs">
                                      Gerenciar <ExternalLink className="ml-1 h-3 w-3" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="sm:max-w-[425px]">
                                    <DialogHeader>
                                      <DialogTitle>Gerenciar Setores</DialogTitle>
                                      <DialogDescription>
                                        Exclua setores existentes.
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="max-h-[300px] overflow-y-auto">
                                      {sectors.length > 0 ? (
                                        <ul className="space-y-2">
                                          {sectors.map(sector => (
                                            <li key={sector.id} className="flex items-center justify-between p-2 border rounded-md">
                                              <span>{sector.name}</span>
                                              <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                  <Button variant="ghost" size="sm">
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                  </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                  <AlertDialogHeader>
                                                    <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                      Esta ação não pode ser desfeita. Isso excluirá permanentemente o setor <strong className="text-destructive">{sector.name}</strong>.
                                                    </AlertDialogDescription>
                                                  </AlertDialogHeader>
                                                  <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction
                                                      onClick={() => handleDeleteSector(sector.id)}
                                                      disabled={isDeletingSector}
                                                    >
                                                      {isDeletingSector ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Continuar'}
                                                    </AlertDialogAction>
                                                  </AlertDialogFooter>
                                                </AlertDialogContent>
                                              </AlertDialog>
                                            </li>
                                          ))}
                                        </ul>
                                      ) : (
                                        <p className="text-center text-muted-foreground">Nenhum setor encontrado.</p>
                                      )}
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              )}
                            </div>
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
                            <div className="flex items-center justify-between">
                              <FormLabel>Responsável</FormLabel>
                              {/* Modal de gerenciamento de responsáveis, visível apenas para Admin */}
                              {isAdmin && (
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="link" size="sm" className="h-4 p-0 text-xs">
                                      Gerenciar <ExternalLink className="ml-1 h-3 w-3" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="sm:max-w-[425px]">
                                    <DialogHeader>
                                      <DialogTitle>Gerenciar Responsáveis</DialogTitle>
                                      <DialogDescription>
                                        Exclua responsáveis existentes.
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="max-h-[300px] overflow-y-auto">
                                      {responsibles.length > 0 ? (
                                        <ul className="space-y-2">
                                          {responsibles.map(responsible => (
                                            <li key={responsible.id} className="flex items-center justify-between p-2 border rounded-md">
                                              <span>{responsible.name}</span>
                                              <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                  <Button variant="ghost" size="sm">
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                  </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                  <AlertDialogHeader>
                                                    <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                      Esta ação não pode ser desfeita. Isso excluirá permanentemente o responsável <strong className="text-destructive">{responsible.name}</strong>.
                                                    </AlertDialogDescription>
                                                  </AlertDialogHeader>
                                                  <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction
                                                      onClick={() => handleDeleteResponsible(responsible.id)}
                                                      disabled={isDeletingResponsible}
                                                    >
                                                      {isDeletingResponsible ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Continuar'}
                                                    </AlertDialogAction>
                                                  </AlertDialogFooter>
                                                </AlertDialogContent>
                                              </AlertDialog>
                                            </li>
                                          ))}
                                        </ul>
                                      ) : (
                                        <p className="text-center text-muted-foreground">Nenhum responsável encontrado.</p>
                                      )}
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              )}
                            </div>
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
                                    format(field.value, "dd/MM/yyyy", { locale: ptBR })
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
                                onSelect={(date) => {
                                  if (date) {
                                    const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                                    field.onChange(localDate);
                                  } else {
                                    field.onChange(null);
                                  }
                                }}
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
                            {field.value ? format(field.value, "dd/MM/yyyy", { locale: ptBR }) : 'Selecione a frequência e a última limpeza'}
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
      </div>

      ---

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
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
              <Wrench className="h-8 w-8 text-warning" />
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

        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Em Aviso</p>
                <p className="text-2xl font-bold text-warning">
                  {warningCount}
                </p>
              </div>
              <Clock className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Atrasados</p>
                <p className="text-2xl font-bold text-destructive">
                  {overdueCount}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
      </div>

      ---

      {/* Equipments Table */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Lista de Equipamentos</CardTitle>
          <p className="text-muted-foreground text-sm">
            Visualize e gerencie todos os equipamentos cadastrados
          </p>
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
                  const isDueToday = daysUntilNextCleaning === 0;
                  const statusInfo = statusConfig[equipment.status as keyof typeof statusConfig] || { label: equipment.status, color: 'bg-muted text-muted-foreground' };

                  return (
                    <TableRow 
                      key={equipment.id}
                      className={cn({
                        'bg-destructive/10 hover:bg-destructive/20': isOverdue,
                        'bg-warning/10 hover:bg-warning/20': isDueToday,
                      })}
                    >
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
                        <Badge className={statusInfo.color}>
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {equipment.last_cleaning ?
                          format(new Date(equipment.last_cleaning + 'T00:00:00'), 'dd/MM/yyyy') :
                          'N/A'
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>
                            {format(new Date(equipment.next_cleaning + 'T00:00:00'), 'dd/MM/yyyy')}
                          </span>
                          <span className={cn(
                            "text-xs mt-1",
                            isOverdue ? "text-destructive font-bold" : (isDueToday ? "text-warning font-bold" : "text-muted-foreground")
                          )}>
                            {isOverdue ? `(Em atraso há ${Math.abs(daysUntilNextCleaning)} dias)` : (isDueToday ? `(Aviso)` : `(Faltam ${daysUntilNextCleaning} dias)`)}
                          </span>
                        </div>
                      </TableCell>
                      {canEdit && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <CalendarIcon className="h-3 w-3 mr-1" />
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
                                    Esta ação não pode ser desfeita. Isso excluirá permanentemente o equipamento <strong style={{ color: 'red' }}>{equipment.name}</strong> do sistema.
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