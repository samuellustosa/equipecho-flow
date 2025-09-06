// src/integrations/firebase/client.ts
import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";

// Sua configuração do Firebase, obtida do console.
const firebaseConfig = {
  apiKey: "AIzaSyCo3cUtYSOivxFcv6dMt8JY1xG7l5R0mfQ",
  authDomain: "quipcpd.firebaseapp.com",
  projectId: "quipcpd",
  storageBucket: "quipcpd.firebasestorage.app",
  messagingSenderId: "809870831674",
  appId: "1:809870831674:web:19848532a7464a4fa64503",
  measurementId: "G-ZMHH9TSWJB"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Inicializa o Messaging e o exporta para ser usado nos hooks
const messaging = getMessaging(app);

export { messaging };