import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { usePushNotificationSubscription, usePushNotificationStatus } from '@/hooks/usePushNotifications';

export default function TestNotifications() {
  const [title, setTitle] = useState('Teste de Notificação');
  const [body, setBody] = useState('Esta é uma notificação de teste do EquipCPD');
  const [loading, setLoading] = useState(false);
  
  const { data: status } = usePushNotificationStatus();
  const subscribeMutation = usePushNotificationSubscription();

  const handleSubscribe = async () => {
    subscribeMutation.mutate();
  };

  const handleTestNotification = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          title,
          body,
          url: '/dashboard'
        }
      });

      if (error) {
        console.error('Erro ao enviar notificação:', error);
        toast({
          title: 'Erro ao enviar notificação',
          description: error.message,
          variant: 'destructive'
        });
      } else {
        console.log('Notificação enviada:', data);
        toast({
          title: 'Notificação enviada!',
          description: 'A notificação foi enviada com sucesso.'
        });
      }
    } catch (error: any) {
      console.error('Erro:', error);
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestLocalNotification = () => {
    if ('Notification' in window) {
      new Notification(title, {
        body,
        icon: '/appstore.png',
        badge: '/196.png'
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Teste de Notificações Push</h1>
        <p className="text-muted-foreground">
          Use esta página para testar as notificações push do sistema.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Status da Inscrição</CardTitle>
            <CardDescription>
              Verifique se você está inscrito para receber notificações
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Permissão do navegador:</span>
              <span className={status?.hasPermission ? 'text-green-600' : 'text-red-600'}>
                {status?.hasPermission ? 'Concedida' : 'Negada'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Inscrição ativa:</span>
              <span className={status?.hasSubscription ? 'text-green-600' : 'text-red-600'}>
                {status?.hasSubscription ? 'Sim' : 'Não'}
              </span>
            </div>
            {!status?.hasSubscription && (
              <Button 
                onClick={handleSubscribe} 
                disabled={subscribeMutation.isPending}
                className="w-full"
              >
                {subscribeMutation.isPending ? 'Inscrevendo...' : 'Inscrever-se'}
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Teste de Notificação Local</CardTitle>
            <CardDescription>
              Teste uma notificação local sem usar o servidor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleTestLocalNotification}
              disabled={!status?.hasPermission}
              className="w-full"
            >
              Testar Notificação Local
            </Button>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Teste de Notificação Push</CardTitle>
            <CardDescription>
              Envie uma notificação push através do servidor
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título da notificação"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="body">Mensagem</Label>
              <Textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Corpo da notificação"
                rows={3}
              />
            </div>
            <Button 
              onClick={handleTestNotification}
              disabled={loading || !status?.hasSubscription}
              className="w-full"
            >
              {loading ? 'Enviando...' : 'Enviar Notificação Push'}
            </Button>
            {!status?.hasSubscription && (
              <p className="text-sm text-muted-foreground text-center">
                Você precisa se inscrever primeiro para receber notificações push
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}