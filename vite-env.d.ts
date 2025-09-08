/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_SUPABASE_URL: string;
    readonly VITE_SUPABASE_ANON_KEY: string;
    readonly SUPABASE_SERVICE_ROLE_KEY: string;
    readonly FIREBASE_SERVICE_ACCOUNT_KEY: string;
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }