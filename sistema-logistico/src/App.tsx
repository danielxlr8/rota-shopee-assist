import React, { useState, useEffect } from "react";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import type { User as FirebaseUser } from "firebase/auth";
import {
  doc,
  getDoc,
  collection,
  onSnapshot,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  writeBatch,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { AuthPage } from "./components/AuthPage";
import { AdminDashboard } from "./components/AdminDashboard";
import DriverInterface from "./components/DriverInterface";
import { VerifyEmailPage } from "./components/VerifyEmailPage";
import type {
  SupportCall as OriginalSupportCall,
  Driver,
  CallStatus,
} from "./types/logistics";

export type SupportCall = OriginalSupportCall & {
  deletedAt?: any;
};

const LogOutIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" x2="9" y1="12" y2="12" />
  </svg>
);

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
  const [isAdminUnverified, setIsAdminUnverified] = useState(false);
  const [calls, setCalls] = useState<SupportCall[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [activeView, setActiveView] = useState<"admin" | "driver" | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setIsAdminUnverified(false);
      setLoading(true); // Começa a carregar
      if (currentUser) {
        await currentUser.reload();
        let resolvedUserData: UserData | null = null;
        if (currentUser.email?.endsWith("@shopee.com")) {
          // Lógica de Admin (permanece a mesma)
          if (!currentUser.emailVerified) {
            setUser(currentUser);
            setIsAdminUnverified(true);
            setLoading(false);
            return;
          }
          const adminDocRef = doc(db, "admins_pre_aprovados", currentUser.uid);
          const adminDocSnap = await getDoc(adminDocRef);
          if (adminDocSnap.exists()) {
            resolvedUserData = adminDocSnap.data() as UserData;
          } else {
            const newAdminData: UserData = {
              uid: currentUser.uid,
              email: currentUser.email!,
              name: currentUser.displayName || "Admin Shopee",
              role: "admin",
            };
            await setDoc(adminDocRef, newAdminData);
            resolvedUserData = newAdminData;
          }
        } else {
          // --- ✅ LÓGICA CORRIGIDA E AUTOMÁTICA PARA MOTORISTAS ---
          const driverDocRef = doc(
            db,
            "motoristas_pre_aprovados",
            currentUser.uid
          );
          const driverDocSnap = await getDoc(driverDocRef);

          if (driverDocSnap.exists()) {
            // Se o motorista JÁ EXISTE, carrega seus dados
            const driverData = driverDocSnap.data() as Driver;
            resolvedUserData = {
              uid: currentUser.uid,
              email: currentUser.email!,
              name: driverData.name,
              role: "driver",
            };
          } else {
            // Se o motorista NÃO EXISTE, CRIA um perfil básico para ele
            console.log(
              "Perfil de motorista não encontrado, criando um novo..."
            );

            const getInitials = (name: string | null) => {
              if (!name) return currentUser.email?.[0].toUpperCase() ?? "??";
              return name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .substring(0, 2);
            };

            const newDriverData: Partial<Driver> = {
              uid: currentUser.uid,
              email: currentUser.email!,
              name: currentUser.displayName || "Novo Motorista",
              status: "INDISPONIVEL", // Status inicial seguro
              createdAt: serverTimestamp(),
              initials: getInitials(currentUser.displayName),
            };

            await setDoc(driverDocRef, newDriverData);

            resolvedUserData = {
              uid: currentUser.uid,
              email: currentUser.email!,
              name: newDriverData.name!,
              role: "driver",
            };
          }
        }

        if (resolvedUserData) {
          setUserData(resolvedUserData);
          setUser(currentUser);
          setActiveView(resolvedUserData.role);
        } else {
          // Este bloco agora só será alcançado em casos de erro real
          console.error("Usuário não autorizado. Fazendo logout.");
          if (!isAdminUnverified) {
            await signOut(auth);
          }
        }
      } else {
        setUser(null);
        setUserData(null);
        setActiveView(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [isAdminUnverified]);

  useEffect(() => {
    if (user && userData && !isAdminUnverified) {
      const callsCollection = collection(db, "supportCalls");
      const driversCollection = collection(db, "motoristas_pre_aprovados");
      const unsubCalls = onSnapshot(callsCollection, (snapshot) => {
        const callsData = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as SupportCall)
        );
        setCalls(callsData);
      });
      const unsubDrivers = onSnapshot(driversCollection, (snapshot) => {
        const driversData = snapshot.docs.map(
          (doc) => ({ uid: doc.id, ...doc.data() } as Driver)
        );
        setDrivers(driversData);
      });
      return () => {
        unsubCalls();
        unsubDrivers();
      };
    }
  }, [user, userData, isAdminUnverified]);

  // Funções de manipulação (handleUpdateCall, etc.) permanecem as mesmas...
  const handleUpdateCall = async (
    id: string,
    updates: Partial<Omit<SupportCall, "id">>
  ) => {
    const callDocRef = doc(db, "supportCalls", id);
    try {
      await updateDoc(callDocRef, updates as any);
    } catch (error) {
      console.error("Erro ao atualizar chamado: ", error);
    }
  };

  const handleDeleteCall = async (id: string) => {
    await handleUpdateCall(id, {
      status: "EXCLUIDO" as CallStatus,
      deletedAt: serverTimestamp(),
    });
  };

  const handlePermanentDeleteCall = async (id: string) => {
    const callDocRef = doc(db, "supportCalls", id);
    try {
      await deleteDoc(callDocRef);
    } catch (error) {
      console.error("Erro ao excluir chamado permanentemente: ", error);
    }
  };

  const handleDeleteAllExcluded = async () => {
    const q = query(
      collection(db, "supportCalls"),
      where("status", "==", "EXCLUIDO")
    );
    const querySnapshot = await getDocs(q);
    const batch = writeBatch(db);
    querySnapshot.forEach((doc) => batch.delete(doc.ref));
    try {
      await batch.commit();
    } catch (error) {
      console.error("Erro ao limpar chamados excluídos: ", error);
    }
  };

  // Lógica de renderização (renderContent) permanece a mesma...
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <p>A carregar...</p>
        </div>
      );
    }
    if (user && isAdminUnverified) {
      return <VerifyEmailPage user={user} />;
    }
    if (!user || !userData) {
      return <AuthPage />;
    }
    if (activeView === "admin") {
      return (
        <AdminDashboard
          calls={calls}
          drivers={drivers}
          updateCall={handleUpdateCall}
          onDeleteCall={handleDeleteCall}
          onDeletePermanently={handlePermanentDeleteCall}
          onDeleteAllExcluded={handleDeleteAllExcluded}
        />
      );
    }
    if (activeView === "driver") {
      const currentDriver = drivers.find((d) => d.uid === user.uid);
      if (currentDriver) {
        return <DriverInterface driver={currentDriver} />;
      }
    }
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Carregando perfil do usuário...</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {user && userData && !isAdminUnverified && (
        <header className="bg-white shadow-md p-4 flex justify-between items-center">
          <div className="text-lg font-semibold text-gray-700">
            Bem-vindo,{" "}
            <span className="font-bold text-orange-600">{userData.name}</span>
          </div>
          <button
            onClick={() => signOut(auth)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <LogOutIcon className="h-5 w-5" />
            <span>Sair</span>
          </button>
        </header>
      )}
      <main>{renderContent()}</main>
    </div>
  );
}

export default App;
