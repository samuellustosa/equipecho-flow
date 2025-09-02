import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import {
  Plus,
  Edit,
  Trash2,
  HelpCircle,
  Loader2,
  Info,
  AlertTriangle,
  XCircle,
  CheckCircle,
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import {
  useAnnouncements,
  useCreateAnnouncement,
  useUpdateAnnouncement,
  useDeleteAnnouncement,
  Announcement,
} from '@/hooks/useAnnouncements';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const formSchema = z.object({
  message: z.string().min(10, "A mensagem deve ter pelo menos 10 caracteres."),
  type: z.enum(['info', 'warning', 'danger', 'success'], {
    required_error: "Selecione um tipo de aviso."
  }),
  is_active: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

const typeColors = {
  info: 'text-blue-500',
  warning: 'text-yellow-500',
  danger: 'text-red-500',
  success: 'text-green-500',
};

const typeIcons = {
  info: <Info className="h-4 w-4" />,
  warning: <AlertTriangle className="h-4 w-4" />,
  danger: <XCircle className="h-4 w-4" />,
  success: <CheckCircle className="h-4 w-4" />,
};

export const Announcements: React.FC = () => {
  const { authState } = useAuth();
  const { data: allAnnouncements = [], isLoading, error } = useAnnouncements(); // Buscar todos os avisos
  const { mutate: createAnnouncement, isPending: isCreating } = useCreateAnnouncement();
  const { mutate: updateAnnouncement, isPending: isUpdating } = useUpdateAnnouncement();
  const { mutate: deleteAnnouncement, isPending: isDeleting } = useDeleteAnnouncement();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [showAll, setShowAll] = useState(true); // Novo estado para controlar o filtro

  const isProcessing = isCreating || isUpdating || isDeleting;
  
  // Lógica para filtrar a lista de avisos
  const announcements = showAll ? allAnnouncements : allAnnouncements.filter(a => a.is_active);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: "",
      type: "info",
      is_active: true,
    },
  });

  const handleOpenModal = (announcement: Announcement | null = null) => {
    setEditingAnnouncement(announcement);
    if (announcement) {
      form.reset({
        message: announcement.message,
        type: announcement.type as "info" | "warning" | "danger" | "success",
        is_active: announcement.is_active,
      });
    } else {
      form.reset();
    }
    setIsModalOpen(true);
  };
  
  const handleCloseModal = (open: boolean) => {
    if (!open) {
      setEditingAnnouncement(null);
      form.reset();
      setIsModalOpen(false);
    }
  };

  const onSubmit = (values: FormValues) => {
    if (editingAnnouncement) {
      updateAnnouncement({ id: editingAnnouncement.id, ...values }, {
        onSuccess: () => {
          toast({ title: "Aviso atualizado com sucesso!" });
          setIsModalOpen(false);
        },
        onError: (err) => {
          toast({ title: "Erro ao atualizar aviso", description: err.message, variant: "destructive" });
        }
      });
    } else {
      createAnnouncement(values as Omit<Announcement, 'id' | 'created_at' | 'updated_at'>, {
        onSuccess: () => {
          toast({ title: "Aviso criado com sucesso!" });
          setIsModalOpen(false);
        },
        onError: (err) => {
          toast({ title: "Erro ao criar aviso", description: err.message, variant: "destructive" });
        }
      });
    }
  };

  const handleDelete = (id: string) => {
    deleteAnnouncement(id, {
      onSuccess: () => {
        toast({ title: "Aviso excluído com sucesso!" });
      },
      onError: (err) => {
        toast({ title: "Erro ao excluir aviso", description: err.message, variant: "destructive" });
      }
    });
  };

  const handleToggleActive = (announcement: Announcement, newStatus: boolean) => {
    updateAnnouncement({ id: announcement.id, is_active: newStatus }, {
      onSuccess: () => {
        toast({ title: `Aviso ${newStatus ? 'ativado' : 'desativado'} com sucesso!` });
      },
      onError: (err) => {
        toast({ title: "Erro ao atualizar aviso", description: err.message, variant: "destructive" });
      }
    });
  };

  if (authState.isLoading || authState.user?.role !== 'admin') {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <h1 className="text-2xl font-bold mb-2">Acesso Negado</h1>
            <p className="text-muted-foreground">
              Você não tem permissão para acessar esta página.
            </p>
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
          <h1 className="text-3xl font-bold mb-2">Gestão de Avisos</h1>
          <p className="text-muted-foreground">
            Adicione, edite ou remova avisos para os usuários do sistema.
          </p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
          <DialogTrigger asChild>
            <Button
              className="gradient-primary text-primary-foreground transition-smooth"
              onClick={() => handleOpenModal()}
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Aviso
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[800px]">
            <DialogHeader>
              <DialogTitle>{editingAnnouncement ? "Editar Aviso" : "Adicionar Novo Aviso"}</DialogTitle>
              <DialogDescription>
                {editingAnnouncement ? "Atualize as informações do aviso." : "Preencha os campos para adicionar um novo aviso."}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mensagem</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Digite a mensagem do aviso..." {...field} rows={4} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo de aviso" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="info">Info</SelectItem>
                          <SelectItem value="warning">Aviso</SelectItem>
                          <SelectItem value="danger">Perigo</SelectItem>
                          <SelectItem value="success">Sucesso</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Aviso Ativo
                        </FormLabel>
                        <FormDescription>
                          Habilite para mostrar o aviso a todos os usuários.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">
                      Cancelar
                    </Button>
                  </DialogClose>
                  <Button type="submit" disabled={isProcessing} className="gradient-primary">
                    {isProcessing ? (
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
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>
            Lista de Avisos
          </CardTitle>
          <CardDescription>
            Visualize e gerencie todos os avisos do sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end mb-4">
            <Button
              variant="outline"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? 'Mostrar Apenas Ativos' : 'Mostrar Todos'}
            </Button>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mensagem</TableHead>
                  <TableHead className="w-[100px]">Tipo</TableHead>
                  <TableHead className="w-[100px]">Ativo</TableHead>
                  <TableHead className="w-[100px] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : announcements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-4">
                      Nenhum aviso encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  announcements.map((announcement) => (
                    <TableRow key={announcement.id}>
                      <TableCell className="font-medium max-w-[300px] truncate">
                        {announcement.message}
                      </TableCell>
                      <TableCell>
                        <span className={cn(typeColors[announcement.type as keyof typeof typeColors], 'flex items-center gap-1')}>
                          {typeIcons[announcement.type as keyof typeof typeIcons]}
                          {announcement.type}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={announcement.is_active}
                          onCheckedChange={(newStatus) => handleToggleActive(announcement, newStatus)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenModal(announcement)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta ação não pode ser desfeita. Isso excluirá permanentemente o aviso selecionado.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(announcement.id)}
                                  disabled={isProcessing}
                                >
                                  {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Continuar'}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};