import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useEquipments, useCreateEquipment, useUpdateEquipment, useDeleteEquipment, Equipment, useEquipmentsCount } from '@/hooks/useEquipments';
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
  History,
  Filter,
  Search,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { useCreateMaintenance, useMaintenanceHistory } from '@/hooks/useMaintenances';
import { Database } from '@/integrations/supabase/types';
import { Label } from '@/components/ui/label';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

const maintenanceFormSchema = z.object({
  service_type: z.enum(['limpeza', 'reparo', 'substituicao', 'calibracao', 'inspecao', 'outro'], {
    required_error: "O tipo de serviço é obrigatório."
  }),
  performed_by_id: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
});

type MaintenanceFormValues = z.infer<typeof maintenanceFormSchema>;

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
const sectorFormSchema = z.object({
  name: z.string().min(2, "O nome do setor deve ter pelo menos 2 caracteres."),
});
type SectorFormValues = z.infer<typeof sectorFormSchema>;
const responsibleFormSchema = z.object({
  name: z.string().min(2, "O nome do responsável deve ter pelo menos 2 caracteres."),
});
type ResponsibleFormValues = z.infer<typeof responsibleFormSchema>;

const formatDateToISO = (date: Date | null | undefined): string | null => {
  if (!date) return null;

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
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;
  const offset = (page - 1) * itemsPerPage;

  const { data: equipments = [], isLoading, error } = useEquipments(itemsPerPage, offset);
  const { data: totalEquipments = 0, isLoading: countLoading } = useEquipmentsCount();

  const { data: responsibles = [] } = useResponsibles();
  const { data: sectors = [] } = useSectors();

  const { mutate: createMaintenance, isPending: isCreatingMaintenance } = useCreateMaintenance();

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
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [selectedEquipmentForMaintenance, setSelectedEquipmentForMaintenance] = useState<Equipment | null>(null);
  const [selectedEquipmentForHistory, setSelectedEquipmentForHistory] = useState<Equipment | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    status: 'all',
    sector_id: 'all',
    responsible_id: 'all',
  });

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

  const maintenanceForm = useForm<MaintenanceFormValues>({
    resolver: zodResolver(maintenanceFormSchema),
    defaultValues: {
      service_type: 'limpeza',
      performed_by_id: null,
      description: null,
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
      form.reset();
    }
    setIsModalOpen(true);
  };
  
  const handleCloseModal = (open: boolean) => {
    if (!open) {
      setEditingEquipment(null);
      form.reset();
      setIsModalOpen(false);
    }
  };
  
  const handleOpenHistoryModal = (equipment: Equipment) => {
      setSelectedEquipmentForHistory(equipment);
      setIsHistoryModalOpen(true);
  };

  const handleOpenMaintenanceModal = (equipment: Equipment) => {
    setSelectedEquipmentForMaintenance(equipment);
    maintenanceForm.reset({
      service_type: 'limpeza',
      performed_by_id: equipment.responsible_id || null,
      description: null,
    });
    setIsMaintenanceModalOpen(true);
  };

  const handleMaintenanceSubmit = (values: MaintenanceFormValues) => {
    if (!selectedEquipmentForMaintenance) return;
    
    const performedAt = new Date();

    createMaintenance({
      ...values,
      equipment_id: selectedEquipmentForMaintenance.id,
      performed_at: formatDateToISO(performedAt),
      service_type: values.service_type as Database['public']['Enums']['maintenance_service_type'],
      cost: null,
    }, {
      onSuccess: () => {
        toast({ title: "Registro de manutenção adicionado com sucesso!" });
        setIsMaintenanceModalOpen(false);
        if (values.service_type === 'limpeza') {
          const newNextCleaning = addDays(performedAt, selectedEquipmentForMaintenance.cleaning_frequency_days);
          updateEquipment({
            id: selectedEquipmentForMaintenance.id,
            last_cleaning: formatDateToISO(performedAt),
            next_cleaning: formatDateToISO(newNextCleaning),
          }, {
            onSuccess: () => {
              toast({ title: "Próxima limpeza atualizada!" });
            },
            onError: (err) => {
              toast({ title: "Erro ao atualizar próxima limpeza", description: err.message, variant: "destructive" });
            }
          });
        }
      },
      onError: (err) => {
        toast({ title: "Erro ao registrar manutenção", description: err.message, variant: "destructive" });
      }
    });
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
  
  const canEdit = authState.user?.role === 'admin' || authState.user?.role === 'manager';
  const isAdmin = authState.user?.role === 'admin';

  const filteredEquipments = equipments.filter(equipment => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = (
      equipment.name.toLowerCase().includes(term) ||
      equipment.model?.toLowerCase().includes(term) ||
      equipment.serial_number?.toLowerCase().includes(term) ||
      (equipment.sectors?.name.toLowerCase() || '').includes(term) ||
      (equipment.responsibles?.name.toLowerCase() || '').includes(term)
    );

    const matchesFilters = (
      (activeFilters.status === 'all' || equipment.status === activeFilters.status) &&
      (activeFilters.sector_id === 'all' || equipment.sector_id === activeFilters.sector_id) &&
      (activeFilters.responsible_id === 'all' || equipment.responsible_id === activeFilters.responsible_id)
    );
    
    return matchesSearch && matchesFilters;
  });

  const pageCount = Math.ceil(totalEquipments / itemsPerPage);
  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= pageCount) {
      setPage(newPage);
    }
  };

  const stats = {
    totalItems: totalEquipments,
    operacionalItems: equipments.filter(e => e.status === 'operacional').length,
    manutencaoItems: equipments.filter(e => e.status === 'manutencao').length,
    paradoItems: equipments.filter(e => e.status === 'parado').length,
    warningItems: equipments.filter(e => getDaysUntilNextCleaning(e.next_cleaning) === 0).length,
    overdueItems: equipments.filter(e => getDaysUntilNextCleaning(e.next_cleaning) < 0).length,
  };

  if (isLoading || countLoading) {
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Equipamentos</h1>
          <p className="text-muted-foreground">
            Gerencie todos os equipamentos do sistema
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
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
              <DialogContent className="max-w-full sm:max-w-[800px] flex flex-col max-h-[90vh]">
                <DialogHeader>
                  <DialogTitle>{editingEquipment ? "Editar Equipamento" : "Adicionar Novo Equipamento"}</DialogTitle>
                  <DialogDescription>
                    {editingEquipment ? "Atualize as informações do equipamento." : "Preencha os campos para adicionar um novo equipamento."}
                  </DialogDescription>
                </DialogHeader>
                <ScrollArea className="flex-1 p-4">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="sector_id"
                          render={({ field }) => (
                            <FormItem>
                              <div className="flex items-center justify-between">
                                <FormLabel>Setor</FormLabel>
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
                                        {responsibles.map((responsible) => (
                                          <div key={responsible.id} className="flex items-center justify-between p-2 border rounded-md">
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
                                          </div>
                                        ))}
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    </form>
                  </Form>
                </ScrollArea>
                <DialogFooter className="flex-shrink-0 mt-auto p-4">
                  <Button type="button" variant="outline" onClick={() => handleCloseModal(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isCreating || isUpdating} className="gradient-primary" onClick={form.handleSubmit(onSubmit)}>
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
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{totalEquipments}</p>
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
                  {stats.operacionalItems}
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
                  {stats.manutencaoItems}
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
                  {stats.paradoItems}
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
                  {stats.warningItems}
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
                  {stats.overdueItems}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="shadow-card">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar equipamentos..."
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
                  <DialogTitle>Filtrar Equipamentos</DialogTitle>
                  <DialogDescription>
                    Selecione as opções para filtrar a lista de equipamentos.
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
                        <SelectItem value="operacional">Operacional</SelectItem>
                        <SelectItem value="manutencao">Manutenção</SelectItem>
                        <SelectItem value="parado">Parado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Setor</Label>
                    <Select
                      onValueChange={(value) => setActiveFilters({ ...activeFilters, sector_id: value })}
                      value={activeFilters.sector_id}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os Setores" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {sectors.map(sector => (
                          <SelectItem key={sector.id} value={sector.id}>
                            {sector.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Responsável</Label>
                    <Select
                      onValueChange={(value) => setActiveFilters({ ...activeFilters, responsible_id: value })}
                      value={activeFilters.responsible_id}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os Responsáveis" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {responsibles.map(responsible => (
                          <SelectItem key={responsible.id} value={responsible.id}>
                            {responsible.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setActiveFilters({ status: 'all', sector_id: 'all', responsible_id: 'all' })}
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

      {selectedEquipmentForMaintenance && (
        <Dialog open={isMaintenanceModalOpen} onOpenChange={setIsMaintenanceModalOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Registrar Manutenção</DialogTitle>
              <DialogDescription>
                Registre uma nova manutenção para **{selectedEquipmentForMaintenance.name}**.
              </DialogDescription>
            </DialogHeader>
            <Form {...maintenanceForm}>
              <form onSubmit={maintenanceForm.handleSubmit(handleMaintenanceSubmit)} className="grid gap-4 py-4">
                <FormField
                  control={maintenanceForm.control}
                  name="service_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Serviço</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo de serviço" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="limpeza">Limpeza</SelectItem>
                          <SelectItem value="reparo">Reparo</SelectItem>
                          <SelectItem value="substituicao">Substituição</SelectItem>
                          <SelectItem value="calibracao">Calibração</SelectItem>
                          <SelectItem value="inspecao">Inspeção</SelectItem>
                          <SelectItem value="outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={maintenanceForm.control}
                  name="performed_by_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Responsável</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value ?? ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o responsável" />
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

                <FormField
                  control={maintenanceForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Detalhes da manutenção..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="submit" disabled={isCreatingMaintenance} className="gradient-primary">
                    {isCreatingMaintenance ? (
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
      
      {selectedEquipmentForHistory && (
          <HistoryMaintenanceModal
              equipment={selectedEquipmentForHistory}
              isOpen={isHistoryModalOpen}
              onClose={() => setIsHistoryModalOpen(false)}
          />
      )}

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Lista de Equipamentos</CardTitle>
          <p className="text-muted-foreground text-sm">
            Visualize e gerencie todos os equipamentos cadastrados
          </p>
        </CardHeader>
        <CardContent>
          <div className="relative w-full overflow-auto">
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
                {filteredEquipments.map((equipment) => {
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
                            
                          <Button variant="outline" size="sm" onClick={() => handleOpenMaintenanceModal(equipment)}>
                                <CalendarIcon className="h-3 w-3 mr-1" />
                                Manutenção
                            </Button>
                             <Button variant="outline" size="sm" onClick={() => handleOpenHistoryModal(equipment)}>
                               <History className="h-3 w-3 mr-1" />
                               Histórico
                             </Button>
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
          <Pagination className="mt-4">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => handlePageChange(page - 1)} 
                    className={cn(page === 1 && "pointer-events-none opacity-50")}
                  />
                </PaginationItem>
                {[...Array(pageCount)].map((_, index) => (
                  <PaginationItem key={index}>
                    <PaginationLink 
                      onClick={() => handlePageChange(index + 1)}
                      isActive={page === index + 1}
                    >
                      {index + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => handlePageChange(page + 1)} 
                    className={cn(page === pageCount && "pointer-events-none opacity-50")}
                  />
                </PaginationItem>
              </PaginationContent>
          </Pagination>
        </CardContent>
      </Card>
    </div>
  );
};

const HistoryMaintenanceModal = ({ equipment, isOpen, onClose }) => {
    const { data: maintenances = [], isLoading, error } = useMaintenanceHistory(equipment.id);
    
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[800px]">
                <DialogHeader>
                    <DialogTitle>Histórico de Manutenção</DialogTitle>
                    <DialogDescription>
                        Registros de manutenção para **{equipment.name}**.
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-72">
                    <div className="p-4">
                        {isLoading ? (
                            <p>Carregando histórico...</p>
                        ) : error ? (
                            <p className="text-destructive">Erro ao carregar histórico: {error.message}</p>
                        ) : maintenances.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Data</TableHead>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead>Responsável</TableHead>
                                        <TableHead>Descrição</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {maintenances.map((maintenance) => (
                                        <TableRow key={maintenance.id}>
                                            <TableCell>{format(new Date(maintenance.performed_at), 'dd/MM/yyyy')}</TableCell>
                                            <TableCell className="capitalize">{maintenance.service_type}</TableCell>
                                            <TableCell>{maintenance.responsibles?.name || 'N/A'}</TableCell>
                                            <TableCell>{maintenance.description || 'N/A'}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <p className="text-center text-muted-foreground">Nenhum registro de manutenção encontrado.</p>
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