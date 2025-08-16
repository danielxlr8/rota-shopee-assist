// Importe as funções necessárias dos SDKs que você precisa
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // 1. Adicione esta importação

// A configuração do seu projeto Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCdVoWcUqnLoHGQzs4a91nx7epHs5iDyVo",
  authDomain: "shopee-apoio-9b103.firebaseapp.com",
  projectId: "shopee-apoio-9b103",
  storageBucket: "shopee-apoio-9b103.appspot.com",
  messagingSenderId: "610673332843",
  appId: "1:610673332843:web:090bdd2433790d2a37972e",
  measurementId: "G-72YLGWY45W",
};

// Inicialize o Firebase
const app = initializeApp(firebaseConfig);

// Exporte os serviços que vamos usar na aplicação
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app); // 2. Adicione esta linha para inicializar e exportar o Storage
