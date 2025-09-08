// src/integrations/firebase/client.ts
import { initializeApp } from 'firebase/app';
import { getMessaging, isSupported } from 'firebase/messaging';

// Configuração do Firebase (chaves públicas)
const firebaseConfig = {
  apiKey: 'AIzaSyCo3cUtYSOivxFcv6dMt8JY1xG7l5R0mfQ',
  authDomain: 'quipcpd.firebaseapp.com',
  projectId: 'quipcpd',
  storageBucket: 'quipcpd.appspot.com', // ajuste para o formato esperado
  messagingSenderId: '809870831674',
  appId: '1:809870831674:web:19848532a7464a4fa64503',
  measurementId: 'G-ZMHH9TSWJB',
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Cria o Messaging apenas em ambientes suportados (https/localhost, navegador compatível)
let messaging: ReturnType<typeof getMessaging> | null = null;
(async () => {
  try {
    if (await isSupported()) {
      messaging = getMessaging(app);
      console.info('[FCM] Messaging habilitado');
    } else {
      console.warn('[FCM] Messaging não é suportado neste navegador/ambiente');
    }
  } catch (e) {
    console.warn('[FCM] Falha ao inicializar messaging:', e);
  }
})();

export { messaging };
