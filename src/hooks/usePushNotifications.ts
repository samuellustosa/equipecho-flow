import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/components/ui/use-toast';

const VAPID_PUBLIC_KEY = 'BMi3TAXX9-alz7ZTCFZkCawhVfJ2iedKfYIjhUxt97-lQ1YyjImlGKa4cVdfIz8SRk4byEwbQSYD_oY3U9g2qCM';

export const usePushNotificationSubscription = () => {
  const { authState } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!authState.user || !('serviceWorker' in navigator)) {
        throw new Error('Push notifications not supported or user not authenticated.');
      }

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Notification permission denied.');
      }

      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        throw new Error('Service Worker not registered.');
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: VAPID_PUBLIC_KEY,
      });

      const { data, error } = await supabase
        .from('push_subscriptions')
        .insert({
          user_id: authState.user.id,
          subscription_data: JSON.stringify(subscription),
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: 'Inscrição para notificações realizada com sucesso!' });
    },
    onError: (err: any) => {
      console.error('Error subscribing to push notifications:', err);
      toast({ title: 'Erro ao se inscrever para notificações', description: err.message, variant: 'destructive' });
    },
  });
};