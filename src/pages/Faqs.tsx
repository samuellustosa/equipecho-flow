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
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { useFaqs, useCreateFaq, useUpdateFaq, useDeleteFaq } from '@/hooks/useFaqs'; // <-- Use o novo hook

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

// Definição do esquema de validação com Zod
const formSchema = z.object({
  question: z.string().min(10, "A pergunta deve ter pelo menos 10 caracteres."),
  answer: z.string().min(20, "A resposta deve ter pelo menos 20 caracteres."),
});

type FormValues = z.infer<typeof formSchema>;

export const Faqs: React.FC = () => {
  const { authState } = useAuth();
  const { data: faqs = [], isLoading, error } = useFaqs(); // <-- Use o hook para buscar dados
  const { mutate: createFaq, isPending: isCreating } = useCreateFaq();
  const { mutate: updateFaq, isPending: isUpdating } = useUpdateFaq();
  const { mutate: deleteFaq, isPending: isDeleting } = useDeleteFaq();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FaqItem | null>(null);

  const isProcessing = isCreating || isUpdating || isDeleting;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      question: "",
      answer: "",
    },
  });

  const handleOpenModal = (faq: FaqItem | null = null) => {
    setEditingFaq(faq);
    if (faq) {
      form.reset({
        question: faq.question,
        answer: faq.answer,
      });
    } else {
      form.reset();
    }
    setIsModalOpen(true);
  };
  
  const handleCloseModal = (open: boolean) => {
    if (!open) {
      setEditingFaq(null);
      form.reset();
      setIsModalOpen(false);
    }
  };

  const onSubmit = (values: FormValues) => {
    if (editingFaq) {
      updateFaq({ id: editingFaq.id, ...values }, {
        onSuccess: () => {
          toast({ title: "FAQ atualizada com sucesso!" });
          setIsModalOpen(false);
        },
        onError: (err) => {
          toast({ title: "Erro ao atualizar FAQ", description: err.message, variant: "destructive" });
        }
      });
    } else {
      createFaq(values as Omit<FaqItem, 'id'>, {
        onSuccess: () => {
          toast({ title: "FAQ criada com sucesso!" });
          setIsModalOpen(false);
        },
        onError: (err) => {
          toast({ title: "Erro ao criar FAQ", description: err.message, variant: "destructive" });
        }
      });
    }
  };

  const handleDelete = (id: string) => {
    deleteFaq(id, {
      onSuccess: () => {
        toast({ title: "FAQ excluída com sucesso!" });
      },
      onError: (err) => {
        toast({ title: "Erro ao excluir FAQ", description: err.message, variant: "destructive" });
      }
    });
  };

  // Apenas administradores podem acessar esta página
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
          <h1 className="text-3xl font-bold mb-2">Gestão de FAQs</h1>
          <p className="text-muted-foreground">
            Adicione, edite ou remova perguntas frequentes do sistema.
          </p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
          <DialogTrigger asChild>
            <Button
              className="gradient-primary text-primary-foreground transition-smooth"
              onClick={() => handleOpenModal()}
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar FAQ
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[800px]">
            <DialogHeader>
              <DialogTitle>{editingFaq ? "Editar FAQ" : "Adicionar Nova FAQ"}</DialogTitle>
              <DialogDescription>
                {editingFaq ? "Atualize a pergunta e a resposta." : "Preencha os campos para adicionar uma nova pergunta frequente."}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
                <FormField
                  control={form.control}
                  name="question"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pergunta</FormLabel>
                      <FormControl>
                        <Input placeholder="Qual a sua dúvida?" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="answer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Resposta</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Descreva a resposta..." {...field} rows={5} />
                      </FormControl>
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

      {/* Tabela de FAQs */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Lista de Perguntas Frequentes</CardTitle>
          <CardDescription>
            Visualize e gerencie todas as FAQs do sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Pergunta</TableHead>
                  <TableHead className="w-[50%]">Resposta</TableHead>
                  <TableHead className="w-[10%] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {faqs.map((faq) => (
                  <TableRow key={faq.id}>
                    <TableCell className="font-medium">
                      {faq.question}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {faq.answer.substring(0, 100)}...
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenModal(faq)}
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
                                Esta ação não pode ser desfeita. Isso excluirá permanentemente a FAQ selecionada.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(faq.id)}
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
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};