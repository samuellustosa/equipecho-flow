import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { Separator } from '@/components/ui/separator';
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
import { useUpdateUser } from '@/hooks/useUsers';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  User,
  Bell,
  Shield,
  Monitor,
  Save,
  Mail,
  Loader2,
  Phone,
  MessageSquare,
  Package,
  AlertTriangle,
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Link } from 'react-router-dom';
import packageJson from '../../package.json';
import { useFaqs } from '@/hooks/useFaqs';
import { useQueryClient } from '@tanstack/react-query';
import { usePushNotificationSubscription } from '@/hooks/usePushNotifications';

const profileFormSchema = z.object({
  firstName: z.string().min(2, "O nome deve ter pelo menos 2 caracteres."),
  lastName: z.string().min(2, "O sobrenome deve ter pelo menos 2 caracteres."),
  email: z.string().email("Por favor, insira um email válido."),
});

const passwordFormSchema = z.object({
  currentPassword: z.string().min(6, "A senha atual deve ter pelo menos 6 caracteres."),
  newPassword: z.string().min(6, "A nova senha deve ter pelo menos 6 caracteres."),
  confirmPassword: z.string().min(6, "A confirmação da senha deve ter pelo menos 6 caracteres."),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "As senhas não coincidem.",
  path: ["confirmPassword"],
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type PasswordFormValues = z.infer<typeof passwordFormSchema>;

export const Settings: React.FC = () => {
  const { authState, setAuthUser } = useAuth();
  // Busca apenas as primeiras 5 FAQs para a página de configurações
  const { data: faqs = [], isLoading: faqsLoading } = useFaqs(5);
  const { mutate: updateUserProfile, isPending: isUpdatingProfile } = useUpdateUser();
  const [isUpdatingPassword, setIsUpdatingPassword] = React.useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { mutate: subscribeToPush, isPending: isSubscribing } = usePushNotificationSubscription();


  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    if (authState.user) {
      profileForm.reset({
        firstName: authState.user.name.split(' ')[0] || '',
        lastName: authState.user.name.split(' ').slice(1).join(' ') || '',
        email: authState.user.email || '',
      });
    }
  }, [authState.user, profileForm]);

  const getUserInitials = (name: string) => {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const onProfileSubmit = (values: ProfileFormValues) => {
    if (!authState.user) return;

    const newName = `${values.firstName} ${values.lastName}`;
    const updatedData = {
      id: authState.user.id,
      name: newName,
      email: values.email,
    };
    
    // Remove o email da atualização se o usuário não for admin
    if (authState.user.role !== 'admin') {
      delete updatedData.email;
    }

    updateUserProfile(updatedData as any, {
      onSuccess: () => {
        toast({ title: "Perfil atualizado com sucesso!" });
        setAuthUser(updatedData);
      },
      onError: (err: any) => {
        toast({ title: "Erro ao atualizar perfil", description: err.message, variant: "destructive" });
      }
    });
  };

  const onPasswordSubmit = async (values: PasswordFormValues) => {
      setIsUpdatingPassword(true);
      try {
        if (!authState.user?.email) {
          throw new Error('Email do usuário não disponível.');
        }

        // Tenta reautenticar o usuário com a senha atual para validação
        const { error: loginError } = await supabase.auth.signInWithPassword({
            email: authState.user.email,
            password: values.currentPassword,
        });

        if (loginError) {
            throw new Error('A senha atual está incorreta.');
        }

        // Se a reautenticação for bem-sucedida, atualiza a senha
        const { error: updateError } = await supabase.auth.updateUser({ password: values.newPassword });

        if (updateError) {
            throw new Error(updateError.message);
        }

        toast({ title: "Senha alterada com sucesso!" });
        passwordForm.reset();

      } catch (error: any) {
        toast({
            title: "Erro ao alterar senha",
            description: error.message,
            variant: "destructive"
        });
      } finally {
        setIsUpdatingPassword(false);
      }
  };
  
  const handleWhatsappSupport = () => {
    const phoneNumber = "5586988582431";
    const userName = authState.user?.name || "Usuário não identificado";
    const userEmail = authState.user?.email || "Email não disponível";
    
    const message = `Olá, sou ${userName} (${userEmail}) e preciso de ajuda com o EquipEcho.`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !authState.user) return;

    const acceptedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!acceptedTypes.includes(file.type)) {
      toast({
        title: "Erro de upload",
        description: "Apenas arquivos JPG, GIF ou PNG são permitidos.",
        variant: "destructive"
      });
      return;
    }

    const maxSize = 1048576;
    if (file.size > maxSize) {
      toast({
        title: "Erro de upload",
        description: "O tamanho máximo do arquivo é 1MB.",
        variant: "destructive"
      });
      return;
    }
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${authState.user.id}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;
    
    try {
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }
      
      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      if (publicUrlData) {
        const newAvatarUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;
        
        updateUserProfile({ id: authState.user.id, avatar_url: newAvatarUrl }, {
          onSuccess: () => {
            setAuthUser({ avatar_url: newAvatarUrl });
            toast({ title: "Foto de perfil atualizada com sucesso!" });
          },
          onError: (err: any) => {
            toast({ title: "Erro ao atualizar perfil", description: err.message, variant: "destructive" });
          }
        });
      }
    } catch (error: any) {
      toast({ title: "Erro ao fazer upload da foto", description: error.message, variant: "destructive" });
    }
  };

  const handleToggleNotification = (field: 'low_stock_alerts_enabled' | 'overdue_maintenance_alerts_enabled', checked: boolean) => {
    if (!authState.user) return;

    const updates = { [field]: checked };
    
    updateUserProfile({ id: authState.user.id, ...updates }, {
      onSuccess: () => {
        setAuthUser(updates);
        toast({ title: "Preferência de notificação atualizada com sucesso!" });
        // Adiciona a invalidação da query para forçar o recarregamento
        queryClient.invalidateQueries({ queryKey: ['equipmentAlerts'] });
        queryClient.invalidateQueries({ queryKey: ['inventoryAlerts'] });
      },
      onError: (err: any) => {
        toast({ title: "Erro ao atualizar preferência", description: err.message, variant: "destructive" });
      }
    });
  };
  
  const handleSubscribe = () => {
    subscribeToPush();
  };

  if (authState.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Carregando configurações...
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie suas preferências e configurações do sistema
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Settings */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Perfil do Usuário
              </CardTitle>
              <CardDescription>
                Atualize suas informações pessoais
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={authState.user?.avatar_url || undefined} />
                  <AvatarFallback className="text-lg">
                    {authState.user && getUserInitials(authState.user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                    Alterar Foto
                  </Button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/jpeg,image/gif,image/png"
                    style={{ display: 'none' }}
                  />
                  <p className="text-sm text-muted-foreground">
                    JPG, GIF ou PNG. Máximo 1MB.
                  </p>
                </div>
              </div>

              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={profileForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sobrenome</FormLabel>
                          <FormControl>
                            <Input placeholder="Sobrenome" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={profileForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                              type="email" 
                              placeholder="seu@email.com" 
                              className="pl-10" 
                              disabled={authState.user?.role !== 'admin'}
                              {...field} />
                          </div>
                        </FormControl>
                        {authState.user?.role !== 'admin' && (
                          <FormDescription>
                            Seu email é controlado pelo seu administrador. Caso haja dúvidas, contate o suporte.
                          </FormDescription>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={isUpdatingProfile} className="gradient-primary text-primary-foreground">
                    {isUpdatingProfile ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Salvar Alterações
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notificações
              </CardTitle>
              <CardDescription>
                Configure suas preferências de notificação
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Alertas de Estoque</Label>
                    <p className="text-sm text-muted-foreground">
                      Notificar quando itens estiverem com estoque baixo ou crítico
                    </p>
                  </div>
                  <Switch
                    checked={authState.user?.low_stock_alerts_enabled}
                    onCheckedChange={(checked) => handleToggleNotification('low_stock_alerts_enabled', checked)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Manutenções Vencidas</Label>
                    <p className="text-sm text-muted-foreground">
                      Alertas sobre manutenções em atraso
                    </p>
                  </div>
                  <Switch
                    checked={authState.user?.overdue_maintenance_alerts_enabled}
                    onCheckedChange={(checked) => handleToggleNotification('overdue_maintenance_alerts_enabled', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Push Notifications */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notificações Push
              </CardTitle>
              <CardDescription>
                Receba alertas mesmo com o aplicativo fechado.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleSubscribe} 
                disabled={isSubscribing} 
                className="w-full sm:w-auto"
              >
                {isSubscribing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Se inscrevendo...
                  </>
                ) : (
                  'Ativar Notificações Push'
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Segurança
              </CardTitle>
              <CardDescription>
                Gerencie sua senha e configurações de segurança
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Senha Atual</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nova Senha</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirmar Nova Senha</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" variant="outline" disabled={isUpdatingPassword}>
                    {isUpdatingPassword ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Alterando...
                      </>
                    ) : (
                      'Alterar Senha'
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* System Info */}
        <div className="space-y-6">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Informações do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Versão:</span>
                  <span className="text-sm font-medium">{packageJson.version}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Última Atualização:</span>
                  <span className="text-sm font-medium">
                    {authState.user?.updated_at ? new Date(authState.user.updated_at).toLocaleDateString('pt-BR') : 'N/A'}
                  </span>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Seu Perfil:</Label>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Função: {authState.user?.role}</p>
                    <p>ID: {authState.user?.id}</p>
                    <p>Criado em: {authState.user?.created_at ? new Date(authState.user.created_at).toLocaleDateString('pt-BR') : 'N/A'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Help Center and Support */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Central de Ajuda</CardTitle>
              <CardDescription>
                Encontre respostas para as suas dúvidas ou contate o suporte.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {faqsLoading ? (
                <div className="animate-pulse space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-12 bg-muted rounded"></div>
                  ))}
                </div>
              ) : (
                <Accordion type="single" collapsible className="w-full">
                  {faqs.length > 0 ? faqs.map((item) => (
                    <AccordionItem value={`item-${item.id}`} key={item.id}>
                      <AccordionTrigger className="text-left font-medium hover:no-underline">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  )) : (
                    <p className="text-center text-muted-foreground">Nenhuma FAQ encontrada.</p>
                  )}
                </Accordion>
              )}

              {faqs && faqs.length > 0 && (
                <Link to="/help-center">
                  <Button variant="outline" className="w-full mt-4">
                    Ver Mais FAQs
                  </Button>
                </Link>
              )}

              <Button onClick={handleWhatsappSupport} className="w-full gradient-success text-success-foreground hover:bg-success/90">
                <MessageSquare className="h-4 w-4 mr-2" />
                Contatar Suporte
              </Button>
              

            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};