import { useState, useEffect } from "react";
import { LogOut } from "lucide-react";
import { AdminDashboard } from "./components/AdminDashboard";
import { DriverInterface } from "./components/DriverInterface";
import { AuthPage } from "./components/AuthPage";
import { mockCalls, mockDrivers } from "./data/mockData";
import type { Driver, SupportCall } from "./types/logistics";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import type { User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export default function App() {
  const [calls, setCalls] = useState<SupportCall[]>(mockCalls);
  const [drivers, setDrivers] = useState<Driver[]>(mockDrivers);

  const [authUser, setAuthUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<"admin" | "driver" | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        let driverProfile = drivers.find((d) => d.id === user.uid);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserRole(userData.role);

          // Se o motorista não existir na nossa lista de estado, cria-o
          if (!driverProfile && userData.role === "driver") {
            const newDriverProfile: Driver = {
              id: user.uid,
              name: user.displayName || userData.name,
              phone: userData.phone || "N/A",
              avatar:
                user.photoURL || `https://i.pravatar.cc/150?u=${user.uid}`,
              initials: (user.displayName ||
                userData.name ||
                "D")[0].toUpperCase(),
              location: "Localização Padrão",
              status: "DISPONIVEL",
              region: userData.region || "N/A",
              accountStatus: "approved", // Assume que se está logado, está aprovado
            };
            setDrivers((prev) => [...prev, newDriverProfile]);
          }
        }
        setAuthUser(user);
      } else {
        setAuthUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []); // Executa apenas uma vez

  const handleLogout = () => {
    signOut(auth).catch((error) =>
      console.error("Erro ao fazer logout:", error)
    );
  };

  const updateCall = (
    callId: string,
    updates: Partial<Omit<SupportCall, "id">>
  ) => {
    setCalls((prevCalls) =>
      prevCalls.map((call) =>
        call.id === callId ? { ...call, ...updates } : call
      )
    );
  };

  const updateDriver = (
    driverId: string,
    updates: Partial<Omit<Driver, "id">>
  ) => {
    setDrivers((prevDrivers) =>
      prevDrivers.map((driver) =>
        driver.id === driverId ? { ...driver, ...updates } : driver
      )
    );
  };

  const addNewCall = (
    newCall: Omit<SupportCall, "id" | "timestamp" | "solicitante">,
    driver: Driver
  ) => {
    const callToAdd: SupportCall = {
      ...newCall,
      id: `c${Date.now()}`,
      timestamp: Date.now(),
      solicitante: {
        id: driver.id,
        name: driver.name,
        avatar: driver.avatar,
        initials: driver.initials,
      },
    };
    setCalls((prevCalls) => [callToAdd, ...prevCalls]);
  };

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

  const currentUserDriver = drivers.find((d) => d.id === authUser.uid);

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
        {userRole === "admin" && (
          <AdminDashboard
            calls={calls}
            drivers={drivers}
            updateCall={updateCall}
          />
        )}
        {userRole === "driver" && currentUserDriver && (
          <DriverInterface
            driver={currentUserDriver}
            calls={calls}
            updateCall={updateCall}
            addNewCall={addNewCall}
            updateDriver={updateDriver}
          />
        )}
      </main>
    </div>
  );
}
