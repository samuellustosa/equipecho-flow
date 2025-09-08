import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/components/ui/use-toast';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { useEffect } from 'react';

// O VAPID Key para o Firebase Cloud Messaging, obtido no console do Firebase
const VAPID_PUBLIC_KEY = 'BMauxkOMTmUUpmvhqnKvm1jXMHRNZ67K1znbg1_fgBXBrPxGgdSjgQmEOFX4ueh1wt9kFgxrPA5GPVU5JfUb5sQ';

// Hook para verificar se o usuário já tem uma subscription
export const usePushNotificationStatus = () => {
  const { authState } = useAuth();
  const queryClient = useQueryClient();

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

      const registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
      if (!registration) {
        throw new Error('Service Worker not registered.');
      }

      // Obter o token do dispositivo via Firebase
      const { messaging } = await import('@/integrations/firebase/client');
      if (!messaging) throw new Error('Navegador não suporta Push/FCM.');

      const token = await getToken(messaging, {
        vapidKey: VAPID_PUBLIC_KEY,
        serviceWorkerRegistration: registration,
      });

      // Salvar assinatura via Edge Function do Supabase
      const { data, error } = await supabase.functions.invoke('subscribe', {
        body: { token },
      });
      if (error) throw new Error(error.message || 'Falha ao salvar assinatura no Supabase.');
      return data;
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

// Hook para lidar com notificações em primeiro plano
export const useForegroundPushNotifications = () => {
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    (async () => {
      const { messaging } = await import('@/integrations/firebase/client');
      if (!messaging) return;
      unsubscribe = onMessage(messaging, (payload) => {
        console.log('Foreground message received:', payload);
        toast({
          title: payload.notification?.title,
          description: payload.notification?.body,
        });
      });
    })();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);
};