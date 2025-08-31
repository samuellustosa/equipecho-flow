import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Bell, 
  Shield, 
  Monitor,
  Save,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';

export const Settings: React.FC = () => {
  const { authState } = useAuth();

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

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
                  <AvatarFallback className="text-lg">
                    {authState.user && getUserInitials(authState.user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Button variant="outline">Alterar Foto</Button>
                  <p className="text-sm text-muted-foreground">
                    JPG, GIF ou PNG. Máximo 1MB.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nome</Label>
                  <Input 
                    id="firstName" 
                    defaultValue={authState.user?.name.split(' ')[0] || ''} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Sobrenome</Label>
                  <Input 
                    id="lastName" 
                    defaultValue={authState.user?.name.split(' ').slice(1).join(' ') || ''} 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="email" 
                    type="email"
                    defaultValue={authState.user?.email || ''} 
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="phone" 
                      type="tel"
                      placeholder="(11) 99999-9999"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Departamento</Label>
                  <Input 
                    id="department" 
                    defaultValue="Manutenção"
                    readOnly
                    className="bg-muted"
                  />
                </div>
              </div>

              <Button className="gradient-primary text-primary-foreground">
                <Save className="h-4 w-4 mr-2" />
                Salvar Alterações
              </Button>
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
                    <Label className="text-base">Notificações por Email</Label>
                    <p className="text-sm text-muted-foreground">
                      Receber notificações sobre manutenções e alertas
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Alertas de Estoque</Label>
                    <p className="text-sm text-muted-foreground">
                      Notificar quando itens estiverem com estoque baixo
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Manutenções Vencidas</Label>
                    <p className="text-sm text-muted-foreground">
                      Alertas sobre manutenções em atraso
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Relatórios Semanais</Label>
                    <p className="text-sm text-muted-foreground">
                      Resumo semanal das atividades
                    </p>
                  </div>
                  <Switch />
                </div>
              </div>
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
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Senha Atual</Label>
                <Input id="currentPassword" type="password" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nova Senha</Label>
                <Input id="newPassword" type="password" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                <Input id="confirmPassword" type="password" />
              </div>

              <Button variant="outline">
                Alterar Senha
              </Button>
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
                  <span className="text-sm font-medium">1.2.5</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Última Atualização:</span>
                  <span className="text-sm font-medium">15/01/2024</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Licença:</span>
                  <span className="text-sm font-medium">Enterprise</span>
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

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Suporte</CardTitle>
              <CardDescription>
                Precisa de ajuda? Entre em contato
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full">
                <Mail className="h-4 w-4 mr-2" />
                Contatar Suporte
              </Button>
              
              <Button variant="outline" className="w-full">
                <Monitor className="h-4 w-4 mr-2" />
                Central de Ajuda
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};