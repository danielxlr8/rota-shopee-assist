import { useState, useEffect } from "react";
import { LogOut } from "lucide-react";
import { AdminDashboard } from "./components/AdminDashboard";
import { DriverInterface } from "./components/DriverInterface";
import { AuthPage } from "./components/AuthPage";
// Remova a importação dos dados mockados e dos tipos, pois não são mais necessários aqui
// import { mockCalls, mockDrivers } from "./data/mockData";
// import type { Driver, SupportCall } from "./types/logistics";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import type { User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export default function App() {
  // O estado agora é focado apenas na autenticação e no papel do usuário
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<"admin" | "driver" | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // A lógica para buscar o papel do usuário continua a mesma
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserRole(userData.role);
        }
        setAuthUser(user);
      } else {
        setAuthUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    signOut(auth).catch((error) =>
      console.error("Erro ao fazer logout:", error)
    );
  };

  // As funções de update (updateCall, updateDriver, etc.) foram removidas
  // porque cada componente cuidará de suas próprias atualizações.

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-orange-50">
        A carregar...
      </div>
    );
  }

  if (!authUser) {
    return <AuthPage />;
  }

  return (
    <div className="bg-gray-50 text-gray-800 min-h-screen">
      <header className="bg-orange-600 shadow-md p-2 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center space-x-2">
          <img
            src="/shopee-logo.png"
            alt="Logótipo da Shopee"
            className="h-8 object-contain"
          />
          <span className="font-bold text-xl text-white">SPX</span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-white text-sm hidden sm:block">
            Bem-vindo, {authUser.displayName || authUser.email}
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 py-2 px-4 rounded-md text-sm font-semibold bg-white text-orange-600 hover:bg-gray-200 transition-colors"
            title="Sair"
          >
            <LogOut size={16} />
            <span>Sair</span>
          </button>
        </div>
      </header>

      <main>
        {/* Renderiza o AdminDashboard sem passar props de dados */}
        {userRole === "admin" && <AdminDashboard />}

        {/* Renderiza o DriverInterface sem passar props de dados */}
        {userRole === "driver" && <DriverInterface />}
      </main>
    </div>
  );
}
