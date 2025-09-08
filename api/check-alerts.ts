import { createClient } from '@supabase/supabase-js';
import * as admin from 'firebase-admin';

// Use as variáveis de ambiente do Vercel para uma conexão segura e confiável.
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const FIREBASE_SERVICE_ACCOUNT_KEY_BASE64 = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

// Verifica se todas as variáveis de ambiente estão definidas.
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !FIREBASE_SERVICE_ACCOUNT_KEY_BASE64) {
  console.error('Erro: Variáveis de ambiente não estão definidas.');
  throw new Error('As variáveis de ambiente SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY e FIREBASE_SERVICE_ACCOUNT_KEY devem ser definidas.');
}

const FIREBASE_SERVICE_ACCOUNT_KEY = JSON.parse(
  Buffer.from(FIREBASE_SERVICE_ACCOUNT_KEY_BASE64, 'base64').toString('utf8')
);

// Inicializa o Firebase Admin SDK para o envio das notificações.
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(FIREBASE_SERVICE_ACCOUNT_KEY),
  });
}

// Handler da função Serverless.
export default async function handler(req, res) {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1. Verificar se há alertas de equipamentos vencidos.
    const { data: overdueEquipments } = await supabase
      .from('equipments')
      .select('name')
      .lt('next_cleaning', new Date().toISOString().split('T')[0]);

    // 2. Verificar se há itens com estoque baixo ou crítico.
    const { data: lowStockItems } = await supabase
      .from('inventory')
      .select('name')
      .or('status.eq.baixo,status.eq.critico');

    const hasAlerts = (overdueEquipments?.length || 0) > 0 || (lowStockItems?.length || 0) > 0;

    if (hasAlerts) {
      // 3. Obter todos os tokens de inscrição de notificação.
      const { data: subscriptions } = await supabase
        .from('push_subscriptions')
        .select('subscription_data');
      
      const tokens = subscriptions?.map(sub => JSON.parse(sub.subscription_data).token).filter(Boolean) || [];

      if (tokens.length > 0) {
        // 4. Criar e enviar a notificação para todos os tokens.
        const message = {
          notification: {
            title: 'Alerta EquipCPD',
            body: 'Existem manutenções vencidas ou itens com estoque baixo. Volte para o sistema!'
          },
          webpush: {
            fcmOptions: { // propriedade corrigida para 'fcmOptions'
              link: '/'
            }
          }
        };

        const response = await admin.messaging().sendEachForMulticast({ tokens, ...message });

        console.log(`${response.successCount} mensagens enviadas com sucesso.`);
        console.log(`${response.failureCount} mensagens falharam.`);

        return res.status(200).json({ message: 'Notificações enviadas com sucesso.', results: response });
      }
    }

    return res.status(200).json({ message: 'Nenhum alerta para enviar.' });
  } catch (error) {
    console.error('Erro na função Serverless:', error.message);
    return res.status(500).json({ error: 'Ocorreu um erro interno.' });
  }
}