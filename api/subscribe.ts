import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase URL or service role key is not defined.');
    }

    const { token, userId } = req.body;

    if (!token || !userId) {
      return res.status(400).json({ error: 'Missing token or userId in request body' });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verificar se já existe uma subscription para este usuário
    const { data: existing } = await supabase
      .from('push_subscriptions')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existing) {
      // Atualizar subscription existente
      await supabase
        .from('push_subscriptions')
        .update({ subscription_data: JSON.stringify({ token }) })
        .eq('user_id', userId);
    } else {
      // Criar nova subscription
      await supabase
        .from('push_subscriptions')
        .insert({
          user_id: userId,
          subscription_data: JSON.stringify({ token }),
        });
    }

    return res.status(200).json({ success: true, message: 'Subscription saved successfully.' });
  } catch (error) {
    console.error('Error in Vercel subscribe function:', error);
    return res.status(500).json({ error: error.message });
  }
}