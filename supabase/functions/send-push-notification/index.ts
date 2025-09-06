import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Chave VAPID pública consistentemente usada no cliente
const VAPID_PUBLIC_KEY = 'BHCJ5XvM3EOHrf1i0uNPTP5_sd-xn6I2_gKkHAnpTWyl1MHt_9WO1IQcInulmJRjPEhBqNmP8OGcqhjnzBSS0YE';

interface PushNotificationPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  badge?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verificar se é uma notificação manual enviada via POST
    if (req.method === 'POST') {
      const requestBody = await req.json();
      
      if (requestBody.title && requestBody.body) {
        // Notificação manual
        const { data: subscriptions, error } = await supabase
          .from('push_subscriptions')
          .select('*');
        
        if (error) throw error;
        
        const payload = {
          title: requestBody.title,
          body: requestBody.body,
          url: requestBody.url || '/dashboard',
          icon: '/appstore.png',
          badge: '/196.png',
        };
        
        return await sendNotificationsToSubscriptions(subscriptions, payload);
      }
    }

    // 1. Identificar alertas de manutenção e inventário (funcionamento automático)
    const { data: overdueEquipments, error: eqError } = await supabase
      .from('equipments')
      .select('id, name')
      .eq('status', 'operacional')
      .lt('next_cleaning', new Date().toISOString().split('T')[0]);

    if (eqError) throw eqError;

    const { data: lowInventoryItems, error: invError } = await supabase
      .from('inventory')
      .select('id, name, current_quantity, minimum_quantity')
      .lte('current_quantity', 1); // Exemplo simplificado para estoque crítico

    if (invError) throw invError;

    const notificationsToSend: { userIds: string[], payload: PushNotificationPayload }[] = [];

    // 2. Criar payloads de notificação
    if (overdueEquipments && overdueEquipments.length > 0) {
      const { data: enabledUsers, error: usersError } = await supabase
        .from('profiles')
        .select('id')
        .eq('overdue_maintenance_alerts_enabled', true);
      
      if (usersError) throw usersError;
      
      const userIds = enabledUsers.map(u => u.id);
      
      if (userIds.length > 0) {
        notificationsToSend.push({
          userIds,
          payload: {
            title: 'Manutenção Atrasada!',
            body: `Você tem ${overdueEquipments.length} equipamento(s) com manutenção em atraso.`,
            url: '/equipments',
            icon: '/appstore.png',
            badge: '/196.png',
          }
        });
      }
    }

    if (lowInventoryItems && lowInventoryItems.length > 0) {
      const { data: enabledUsers, error: usersError } = await supabase
        .from('profiles')
        .select('id')
        .eq('low_stock_alerts_enabled', true);
        
      if (usersError) throw usersError;

      const userIds = enabledUsers.map(u => u.id);
      
      if (userIds.length > 0) {
        notificationsToSend.push({
          userIds,
          payload: {
            title: 'Estoque Crítico!',
            body: `Você tem ${lowInventoryItems.length} item(s) com estoque baixo.`,
            url: '/inventory',
            icon: '/appstore.png',
            badge: '/196.png',
          }
        });
      }
    }

    if (notificationsToSend.length === 0) {
      return new Response(JSON.stringify({ message: 'Nenhum alerta para enviar.' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Enviar notificações automáticas
    const allResults = [];
    for (const { userIds, payload } of notificationsToSend) {
      const { data: subscriptions, error } = await supabase.from('push_subscriptions').select('*').in('user_id', userIds);
      if (error) {
        console.error('Error fetching subscriptions:', error);
        continue;
      }
      
      const result = await sendNotificationsToSubscriptions(subscriptions, payload);
      allResults.push(result);
    }
    
    return new Response(JSON.stringify({
      message: 'No alerts to send automatically',
      successful: 0,
      failed: 0
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in send-push-notification function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

async function generateVAPIDHeaders(endpoint: string, publicKey: string, privateKey: string) {
  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const vapidKeys = {
    publicKey: urlBase64ToUint8Array(publicKey),
    privateKey: urlBase64ToUint8Array(privateKey),
  };

  const audienceOrigin = new URL(endpoint).origin;
  const subject = `mailto:admin@equipecho.com`;

  const header = { typ: 'JWT', alg: 'ES256' };
  const payload = {
    aud: audienceOrigin,
    exp: Math.floor(Date.now() / 1000) + 86400, // 24 horas
    sub: subject,
  };

  return {
    'Authorization': `vapid t=${await createJWT(header, payload, vapidKeys.privateKey)}, k=${publicKey}`,
  };
}

async function createJWT(header: any, payload: any, privateKey: Uint8Array): Promise<string> {
  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  
  const data = encoder.encode(`${headerB64}.${payloadB64}`);
  
  // Import the private key for signing
  const key = await crypto.subtle.importKey(
    'raw',
    privateKey,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );
  
  // Sign the data
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    data
  );
  
  // Convert signature to base64url
  const signatureArray = new Uint8Array(signature);
  const signatureB64 = btoa(String.fromCharCode(...signatureArray))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  
  return `${headerB64}.${payloadB64}.${signatureB64}`;
}

async function encryptPayload(payload: string, subscription: any): Promise<Uint8Array> {
  // For now, return the payload as is (unencrypted)
  // In production, you should implement proper Web Push encryption
  return new TextEncoder().encode(payload);
}

async function sendNotificationsToSubscriptions(subscriptions: any[], payload: PushNotificationPayload) {
  const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY');

  if (!VAPID_PRIVATE_KEY) {
    throw new Error('VAPID_PRIVATE_KEY not configured');
  }

  const payloadString = JSON.stringify(payload);
  
  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        const subscription = JSON.parse(sub.subscription_data as string);
        
        console.log('Sending to subscription:', sub.id);
        
        // Para teste, vamos simplificar e não usar criptografia por enquanto
        const response = await fetch(subscription.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'TTL': '86400',
          },
          body: payloadString,
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
          console.error(`Push failed for subscription ${sub.id}:`, response.status, response.statusText);
          const responseText = await response.text();
          console.error('Response body:', responseText);
          
          if (response.status === 410) {
            // Subscription expired, remove it
            const supabase = createClient(
              Deno.env.get('SUPABASE_URL') ?? '',
              Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
            );
            await supabase.from('push_subscriptions').delete().eq('id', sub.id);
          }
        }

        return { success: response.ok, subscriptionId: sub.id };
      } catch (error) {
        console.error(`Error sending to subscription ${sub.id}:`, error);
        return { success: false, subscriptionId: sub.id, error: error.message };
      }
    })
  );
  
  const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
  const failed = results.length - successful;
  
  console.log(`Push notifications sent: ${successful} successful, ${failed} failed`);

  return new Response(JSON.stringify({
    message: 'Push notifications processed',
    successful,
    failed,
    results: results.map(r => r.status === 'fulfilled' ? r.value : { success: false, error: 'Promise rejected' })
  }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve(handler);