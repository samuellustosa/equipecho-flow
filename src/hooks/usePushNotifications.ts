import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/components/ui/use-toast';

const VAPID_PUBLIC_KEY = 'BHCJ5XvM3EOHrf1i0uNPTP5_sd-xn6I2_gKkHAnpTWyl1MHt_9WO1IQcInulmJRjPEhBqNmP8OGcqhjnzBSS0YE';

// Hook para verificar se o usuário já tem uma subscription
export const usePushNotificationStatus = () => {
  const { authState } = useAuth();

  return useQuery({
    queryKey: ['push-notification-status', authState.user?.id],
    queryFn: async () => {
      if (!authState.user) return { hasSubscription: false, hasPermission: false };

      // Verificar permissão do navegador
      const hasPermission = 'Notification' in window && Notification.permission === 'granted';

      // Verificar se há subscription no banco
      const { data, error } = await supabase
        .from('push_subscriptions')
        .select('id')
        .eq('user_id', authState.user.id)
        .single();

      return {
        hasSubscription: !error && !!data,
        hasPermission,
      };
    },
    enabled: !!authState.user,
  });
};

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

      // Verificar se já existe uma subscription para este usuário
      const { data: existing } = await supabase
        .from('push_subscriptions')
        .select('id')
        .eq('user_id', authState.user.id)
        .single();

      if (existing) {
        // Atualizar subscription existente
        const { data, error } = await supabase
          .from('push_subscriptions')
          .update({ subscription_data: JSON.stringify(subscription) })
          .eq('user_id', authState.user.id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        // Criar nova subscription
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
      }
      
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['push-notification-status'] });
      toast({ title: 'Inscrição para notificações realizada com sucesso!' });
    },
    onError: (err: any) => {
      console.error('Error subscribing to push notifications:', err);
      toast({ title: 'Erro ao se inscrever para notificações', description: err.message, variant: 'destructive' });
    },
  });
};

export const usePushNotificationUnsubscribe = () => {
  const { authState } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!authState.user) {
        throw new Error('User not authenticated.');
      }

      const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', authState.user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['push-notification-status'] });
      toast({ title: 'Notificações desativadas com sucesso!' });
    },
    onError: (err: any) => {
      console.error('Error unsubscribing from push notifications:', err);
      toast({ title: 'Erro ao desativar notificações', description: err.message, variant: 'destructive' });
    },
  });
};