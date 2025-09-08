// src/integrations/firebase/client.ts
import { initializeApp } from 'firebase/app';
import { getMessaging, isSupported } from 'firebase/messaging';

// Configuração do Firebase (chaves públicas)
const firebaseConfig = {
  apiKey: 'AIzaSyCo3cUtYSOivxFcv6dMt8JY1xG7l5R0mfQ',
  authDomain: 'quipcpd.firebaseapp.com',
  projectId: 'quipcpd',
  storageBucket: 'quipcpd.firebasestorage.app',
  messagingSenderId: '809870831674',
  appId: '1:809870831674:web:19848532a7464a4fa64503',
  measurementId: 'G-ZMHH9TSWJB',
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Inicializa messaging de forma lazy para evitar travamentos
let messaging: ReturnType<typeof getMessaging> | null = null;

export { messaging, app };

// Função para obter messaging apenas quando necessário
export const getFirebaseMessaging = async () => {
  if (messaging) return messaging;
  
  try {
    if (await isSupported()) {
      messaging = getMessaging(app);
      return messaging;
    }
  } catch (e) {
    console.warn('[FCM] Messaging não suportado:', e);
  }
  
  return null;
};
