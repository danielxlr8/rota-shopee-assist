import { useState, useEffect } from "react";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import type { User as FirebaseUser } from "firebase/auth";
import { doc, getDoc, collection, onSnapshot } from "firebase/firestore";
import { AuthPage } from "./components/AuthPage";
import { AdminDashboard } from "./components/AdminDashboard";
import { DriverInterface } from "./components/DriverInterface";
import { mockCalls, mockDrivers } from "./data/mockData";
import type { SupportCall, Driver } from "./types/logistics";

// Define a estrutura para os dados do usuário armazenados no Firestore
interface UserData {
  uid: string;
  name: string;
  email: string;
  role: "admin" | "driver";
}

function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  // Estados para os dados da aplicação (iniciados com dados mockados como fallback)
  const [calls, setCalls] = useState<SupportCall[]>(mockCalls);
  const [drivers, setDrivers] = useState<Driver[]>(mockDrivers);

  // Efeito para observar o estado de autenticação do Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Se o usuário estiver logado, busca seus dados no Firestore
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          setUser(currentUser);
          setUserData(userDocSnap.data() as UserData);
        } else {
          // Se não encontrar os dados do usuário, desloga para evitar erros
          console.error("Documento do usuário não encontrado no Firestore!");
          signOut(auth);
        }
      } else {
        // Se não houver usuário, reseta os estados
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    // Limpa o observador ao desmontar o componente para evitar memory leaks
    return () => unsubscribe();
  }, []);

  // Efeito para buscar dados em tempo real (chamados e motoristas)
  useEffect(() => {
    // Apenas busca os dados se o usuário for um administrador
    if (userData?.role === "admin") {
      const callsCollection = collection(db, "supportCalls");
      const driversCollection = collection(db, "drivers");

      const unsubCalls = onSnapshot(callsCollection, (snapshot) => {
        const callsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SupportCall));
        setCalls(callsData);
      });

      const unsubDrivers = onSnapshot(driversCollection, (snapshot) => {
        const driversData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Driver));
        setDrivers(driversData);
      });

      // Limpa os observadores ao desmontar ou quando o usuário não for mais admin
      return () => {
        unsubCalls();
        unsubDrivers();
      };
    }
  }, [userData]); // Re-executa este efeito sempre que o userData mudar

  // Função para atualizar um chamado (será passada como prop para o AdminDashboard)
  const handleUpdateCall = (id: string, updates: Partial<SupportCall>) => {
    // Aqui você implementaria a lógica para atualizar o documento no Firestore
    console.log(`Atualizando chamado ${id} com:`, updates);
  };

  // Enquanto verifica a autenticação, exibe uma tela de carregamento
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>A carregar...</p>
      </div>
    );
  }

  // Se não houver usuário logado, renderiza a página de autenticação
  if (!user) {
    return <AuthPage />;
  }

  // Após o login, renderiza o painel correto com base na função do usuário
  switch (userData?.role) {
    case "admin":
      // CORREÇÃO: Passa as props necessárias para o AdminDashboard
      return (
        <AdminDashboard
          calls={calls}
          drivers={drivers}
          updateCall={handleUpdateCall}
        />
      );
    case "driver":
      return <DriverInterface />;
    default:
      // Caso os dados do usuário ainda não tenham sido carregados ou a função seja inválida
      return (
        <div className="flex items-center justify-center min-h-screen">
            <p>A verificar permissões...</p>
            <button onClick={() => signOut(auth)} className="ml-4 p-2 bg-red-500 text-white rounded">Sair</button>
        </div>
      );
  }
}

export default App;
