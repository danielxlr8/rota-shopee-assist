import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";
import { getDatabase } from "firebase/database";

// Configuração carregada das variáveis de ambiente (.env)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
};

// Verifica se as chaves foram carregadas corretamente
if (!firebaseConfig.apiKey) {
  console.error(
    "ERRO CRÍTICO: Variáveis de ambiente do Firebase não encontradas. Verifique o arquivo .env"
  );
}

console.log("🔥 Firebase Config:", {
  apiKey: firebaseConfig.apiKey ? '✅' : '❌',
  authDomain: firebaseConfig.authDomain ? '✅' : '❌',
  projectId: firebaseConfig.projectId ? '✅' : '❌',
  databaseURL: firebaseConfig.databaseURL ? '✅' : '❌',
});

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Exporte os serviços
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app);

// Realtime Database - com tratamento de erro
let realtimeDb: ReturnType<typeof getDatabase> | null = null;

console.log("🔹 Tentando inicializar Realtime Database...");
console.log("🔹 databaseURL:", firebaseConfig.databaseURL);

try {
  if (firebaseConfig.databaseURL) {
    realtimeDb = getDatabase(app);
    console.log("✅ Realtime Database inicializado com sucesso!");
    console.log("✅ realtimeDb:", realtimeDb ? "OK" : "NULL");
  } else {
    console.warn("⚠️ databaseURL não configurado - Realtime Database desabilitado");
  }
} catch (error) {
  console.error("❌ Erro ao inicializar Realtime Database:", error);
  realtimeDb = null;
}

// Hooks personalizados
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return { user, loading };
};

export const useFirestore = () => db;
export const useStorage = () => storage;

export { auth, db, storage, functions, realtimeDb };
