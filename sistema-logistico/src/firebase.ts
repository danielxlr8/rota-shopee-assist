import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// A configuração do seu projeto Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCdVoWcUqnLoHGQzs4a91nx7epHs5iDyVo",
  authDomain: "shopee-apoio-9b103.firebaseapp.com",
  projectId: "shopee-apoio-9b103",
  storageBucket: "shopee-apoio-9b103.firebasestorage.app",
  messagingSenderId: "610673332843",
  appId: "1:610673332843:web:090bdd2433790d2a37972e",
  measurementId: "G-72YLGWY45W",
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Exporte os serviços que vamos usar na aplicação
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Crie ganchos personalizados para fornecer o estado do Firebase
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

export { auth, db, storage };
