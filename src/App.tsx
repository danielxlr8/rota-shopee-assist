import { useState, useEffect } from "react";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import type { User as FirebaseUser } from "firebase/auth";
import {
  doc,
  getDoc,
  collection,
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
import { DriverInterface } from "./components/DriverInterface";
import { VerifyEmailPage } from "./components/VerifyEmailPage";
import { LoadingScreen } from "./components/LoadingScreen";
import { Toaster } from "sonner";
import { toast as sonnerToast } from "sonner";
import type {
  SupportCall as OriginalSupportCall,
  Driver,
} from "./types/logistics";
import { useSafeFirestore } from "./hooks/useSafeFirestore";
import { useFirestoreQuery, clearCollectionCache } from "./hooks/useFirestoreQuery";
import { usePresence } from "./hooks/usePresence";
import { checkAccessPermission } from "./services/gatekeeper";

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

  // ========================================
  // NOVA IMPLEMENTAÇÃO COM useFirestoreQuery (SIMPLIFICADO)
  // ========================================
  
  // Hook para chamados - simples e rápido
  const {
    data: calls,
    loading: callsLoading,
    error: callsError,
    refresh: refreshCalls,
  } = useFirestoreQuery<SupportCall>({
    collectionName: "supportCalls",
    orderByField: "createdAt",
    orderDirection: "desc",
    limitCount: 100,
    enableCache: true,
    cacheDuration: 2 * 60 * 1000, // 2 minutos
  });

  // Hook para motoristas - simples e rápido
  const {
    data: drivers,
    loading: driversLoading,
    error: driversError,
    refresh: refreshDrivers,
  } = useFirestoreQuery<Driver>({
    collectionName: "motoristas_pre_aprovados",
    orderByField: "name",
    orderDirection: "asc",
    limitCount: 200,
    enableCache: true,
    cacheDuration: 5 * 60 * 1000, // 5 minutos
  });

  // ========================================
  // ATIVA PRESENÇA DO USUÁRIO (para contador online)
  // ========================================
  usePresence(
    user?.uid || null,
    userData?.role || "driver",
    userData ? { name: userData.name, email: userData.email } : null,
    !!user && !!userData // Só ativa se usuário estiver logado
  );

  useEffect(() => {
    console.log("🔹 Iniciando useEffect de autenticação");
    
    // Timeout de segurança: se após 15 segundos ainda estiver carregando, exibe erro
    const safetyTimeout = setTimeout(() => {
      if (loading) {
        console.error("⚠️ Timeout de segurança atingido. Forçando fim do carregamento.");
        setLoading(false);
        setUser(null);
        setUserData(null);
      }
    }, 15000);

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log("🔹 onAuthStateChanged disparado", currentUser ? "COM usuário" : "SEM usuário");
      try {
        setIsAdminUnverified(false);

        if (currentUser) {
          console.log("🔹 Recarregando dados do usuário...");
          await currentUser.reload();

          // ========================================
          // GATEKEEPER: Verificação de limite de usuários simultâneos
          // ========================================
          console.log("🔹 Verificando gatekeeper...");
          const accessCheck = await Promise.race([
            checkAccessPermission(currentUser.email || undefined),
            new Promise<any>((resolve) => 
              setTimeout(() => {
                console.warn("⏱️ Timeout no gatekeeper, permitindo acesso");
                resolve({ allowed: true });
              }, 5000)
            )
          ]);

          console.log("🔹 Resultado do gatekeeper:", accessCheck);

        if (!accessCheck.allowed) {
          // Servidor cheio - mostra notificação e faz logout
          sonnerToast.error("Servidor Cheio", {
            description: accessCheck.reason || "Tente novamente em instantes.",
            duration: 5000,
          });

          console.warn("⛔ Acesso negado - Servidor cheio:", {
            currentCount: accessCheck.currentCount,
            maxCount: accessCheck.maxCount,
          });

          await signOut(auth);
          setLoading(false);
          return;
        }

        console.log("✅ Acesso permitido via Gatekeeper:", {
          currentCount: accessCheck.currentCount,
          maxCount: accessCheck.maxCount,
        });

        console.log("🔹 Começando a buscar dados do usuário...");
        let resolvedUserData: UserData | null = null;

        if (currentUser.email?.endsWith("@shopee.com")) {
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
          const driversRef = collection(db, "motoristas_pre_aprovados");
          const qUid = query(driversRef, where("uid", "==", currentUser.uid));
          const qGoogleUid = query(
            driversRef,
            where("googleUid", "==", currentUser.uid)
          );

          const [uidSnapshot, googleUidSnapshot] = await Promise.all([
            getDocs(qUid),
            getDocs(qGoogleUid),
          ]);

          const driverDoc = uidSnapshot.docs[0] || googleUidSnapshot.docs[0];

          if (driverDoc && driverDoc.exists()) {
            const driverData = driverDoc.data() as Driver;
            resolvedUserData = {
              uid: currentUser.uid,
              email: currentUser.email!,
              name: driverData.name,
              role: "driver",
            };
          }
        }

        if (resolvedUserData) {
          setUserData(resolvedUserData);
          setUser(currentUser);
        } else {
          console.error(
            "Usuário não encontrado ou não autorizado. Fazendo logout."
          );
          if (!isAdminUnverified) {
            await signOut(auth);
          }
        }
        } else {
          setUser(null);
          setUserData(null);
        }
      } catch (error) {
        console.error("❌ Erro durante autenticação:", error);
        setUser(null);
        setUserData(null);
      } finally {
        setLoading(false);
        clearTimeout(safetyTimeout);
      }
    });

    return () => {
      clearTimeout(safetyTimeout);
      unsubscribe();
    };
  }, [isAdminUnverified]);

  const handleUpdateCall = async (
    id: string,
    updates: Partial<Omit<SupportCall, "id">>
  ) => {
    const callDocRef = doc(db, "supportCalls", id);
    try {
      await updateDoc(callDocRef, updates);
      // Limpa cache e recarrega
      clearCollectionCache("supportCalls");
      refreshCalls();
    } catch (error) {
      console.error("Erro ao atualizar chamado: ", error);
    }
  };

  const handleDeleteCall = async (id: string) => {
    await handleUpdateCall(id, {
      status: "EXCLUIDO",
      deletedAt: serverTimestamp(),
    });
  };

  const handlePermanentDeleteCall = async (id: string) => {
    const callDocRef = doc(db, "supportCalls", id);
    try {
      await deleteDoc(callDocRef);
      // Limpa cache e recarrega
      clearCollectionCache("supportCalls");
      refreshCalls();
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
      // Limpa cache e recarrega
      clearCollectionCache("supportCalls");
      refreshCalls();
    } catch (error) {
      console.error("Erro ao limpar chamados excluídos: ", error);
    }
  };

  const renderContent = () => {
    if (loading || callsLoading || driversLoading) {
      return <LoadingScreen />;
    }

    if (user && isAdminUnverified) {
      return <VerifyEmailPage user={user} />;
    }

    if (!user || !userData) {
      return <AuthPage />;
    }

    // Exibe erros se houver
    if (callsError || driversError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4">
          {callsError && (
            <div className="text-red-600 bg-red-50 p-4 rounded-lg border border-red-200">
              <p className="font-bold">Erro ao carregar chamados:</p>
              <p>{callsError}</p>
            </div>
          )}
          {driversError && (
            <div className="text-red-600 bg-red-50 p-4 rounded-lg border border-red-200">
              <p className="font-bold">Erro ao carregar motoristas:</p>
              <p>{driversError}</p>
            </div>
          )}
          <button
            onClick={() => {
              refreshCalls();
              refreshDrivers();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Tentar Novamente
          </button>
        </div>
      );
    }

    switch (userData.role) {
      case "admin":
        return (
          <AdminDashboard
            calls={calls}
            drivers={drivers}
            updateCall={handleUpdateCall}
            onDeleteCall={handleDeleteCall}
            onDeletePermanently={handlePermanentDeleteCall}
            onDeleteAllExcluded={handleDeleteAllExcluded}
            onRefresh={() => {
              refreshCalls();
              refreshDrivers();
            }}
          />
        );
      case "driver":
        const currentUser = auth.currentUser;
        if (!currentUser) return <AuthPage />;

        const driverProfile = drivers.find(
          (d) => d.uid === currentUser.uid || d.googleUid === currentUser.uid
        );

        if (driverProfile) {
          return <DriverInterface driver={driverProfile} />;
        }

        return (
          <div className="flex items-center justify-center h-screen">
            <p>Carregando perfil do motorista...</p>
          </div>
        );
      default:
        signOut(auth);
        return <AuthPage />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Toaster position="top-right" richColors />
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
