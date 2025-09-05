import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushNotificationRequest {
  title: string;
  body: string;
  url?: string;
  userIds?: string[];
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

    const { title, body, url = '/', userIds }: PushNotificationRequest = await req.json();
    
    const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY');
    const VAPID_PUBLIC_KEY = 'BMi3TAXX9-alz7ZTCFZkCawhVfJ2iedKfYIjhUxt97-lQ1YyjImlGKa4cVdfIz8SRk4byEwbQSYD_oY3U9g2qCM';

    if (!VAPID_PRIVATE_KEY) {
      throw new Error('VAPID_PRIVATE_KEY not configured');
    }

    // Buscar todas as subscriptions ou apenas dos usuários especificados
    let query = supabase.from('push_subscriptions').select('*');
    
    if (userIds && userIds.length > 0) {
      query = query.in('user_id', userIds);
    }

    const { data: subscriptions, error } = await query;

    if (error) {
      console.error('Error fetching subscriptions:', error);
      throw error;
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ message: 'No subscriptions found' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload = JSON.stringify({
      title,
      body,
      url,
      icon: '/appstore.png',
      badge: '/196.png',
    });

    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          const subscription = JSON.parse(sub.subscription_data as string);
          
          // Preparar headers para web-push
          const vapidHeaders = await generateVAPIDHeaders(
            subscription.endpoint,
            VAPID_PUBLIC_KEY,
            VAPID_PRIVATE_KEY
          );

          const response = await fetch(subscription.endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/octet-stream',
              'Content-Encoding': 'aes128gcm',
              'TTL': '86400',
              ...vapidHeaders,
            },
            body: await encryptPayload(payload, subscription),
          });

          if (!response.ok) {
            console.error(`Push failed for subscription ${sub.id}:`, response.status, response.statusText);
            // Se a subscription é inválida (410), removê-la
            if (response.status === 410) {
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

  } catch (error) {
    console.error('Error in send-push-notification function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

// Função para gerar headers VAPID
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

  // Para simplificar, vamos usar uma implementação básica
  // Em produção, use uma biblioteca específica para VAPID
  return {
    'Authorization': `vapid t=${await createJWT(header, payload, vapidKeys.privateKey)}, k=${publicKey}`,
  };
}

// Função simples para criar JWT (em produção, use uma biblioteca)
async function createJWT(header: any, payload: any, privateKey: Uint8Array): Promise<string> {
  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  
  // Para simplificar, retornamos um token básico
  // Em produção, implemente a assinatura ECDSA correta
  return `${headerB64}.${payloadB64}.signature`;
}

// Função para criptografar payload (simplificada)
async function encryptPayload(payload: string, subscription: any): Promise<Uint8Array> {
  // Para simplificar, retornamos o payload como bytes
  // Em produção, implemente a criptografia AES128GCM correta
  return new TextEncoder().encode(payload);
}

serve(handler);