import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';


export default function TestNotifications() {
  const [title, setTitle] = useState('Teste de Notificação');
  const [body, setBody] = useState('Esta é uma notificação de teste do EquipCPD');
  
  const status = { hasPermission: 'Notification' in window && Notification.permission === 'granted', hasSubscription: false };

  const handleSubscribe = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        toast({ title: 'Permissão concedida!', description: 'Você pode receber notificações.' });
      }
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
            {!status?.hasPermission && (
              <Button 
                onClick={handleSubscribe} 
                className="w-full"
              >
                Solicitar Permissão
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
      </div>
    </div>
  );
}