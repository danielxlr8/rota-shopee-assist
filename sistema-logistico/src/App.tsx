import { useState, useEffect, useRef } from "react";
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
} from "firebase/firestore";
import { AuthPage } from "./components/AuthPage";
import { AdminDashboard } from "./components/AdminDashboard";
import { DriverInterface } from "./components/DriverInterface";
import type {
  SupportCall as OriginalSupportCall,
  Driver,
} from "./types/logistics";
// --- CORREÇÃO DOS IMPORTS ---
// A importação do 'toaster' antigo foi removida.
// A importação do 'sonner' foi simplificada.
import { Toaster, toast } from "sonner";

export type SupportCall = OriginalSupportCall & {
  deletedAt?: any;
};

const LogOutIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24"
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

  const [calls, setCalls] = useState<SupportCall[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);

  // A chamada ao useToast() não é mais necessária aqui.
  // O 'toast' importado de 'sonner' funcionará globalmente.

  const previousCallsRef = useRef<SupportCall[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          setUser(currentUser);
          setUserData(userDocSnap.data() as UserData);
        } else {
          console.error("Documento do usuário não encontrado no Firestore!");
          await signOut(auth);
        }
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user && userData) {
      const callsCollection = collection(db, "supportCalls");
      const driversCollection = collection(db, "drivers");

      const unsubCalls = onSnapshot(callsCollection, (snapshot) => {
        const callsData = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as SupportCall)
        );

        if (previousCallsRef.current.length > 0) {
          const previousOpenCallsIds = new Set(
            previousCallsRef.current
              .filter((c) => c.status === "ABERTO")
              .map((c) => c.id)
          );

          const newOpenCalls = callsData.filter(
            (call) =>
              call.status === "ABERTO" && !previousOpenCallsIds.has(call.id)
          );

          newOpenCalls.forEach((newCall) => {
            if (userData.role === "admin") {
              audioRef.current?.play();
              toast.info("Novo Chamado Aberto!", {
                description: `${newCall.solicitante.name} precisa de apoio.`,
              });
            } else if (userData.role === "driver") {
              const currentDriver = drivers.find((d) => d.id === user.uid);
              if (currentDriver?.status === "DISPONIVEL") {
                audioRef.current?.play();
                toast.info("Novo Apoio Disponível!", {
                  description: `Um novo chamado de ${newCall.solicitante.name} está aberto.`,
                });
              }
            }
          });
        }

        setCalls(callsData);
        previousCallsRef.current = callsData;
      });

      const unsubDrivers = onSnapshot(driversCollection, (snapshot) => {
        const driversData = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as Driver)
        );
        setDrivers(driversData);
      });

      return () => {
        unsubCalls();
        unsubDrivers();
      };
    }
  }, [user, userData, drivers]);

  const handleUpdateCall = async (
    id: string,
    updates: Partial<Omit<SupportCall, "id">>
  ) => {
    const callDocRef = doc(db, "supportCalls", id);
    try {
      await updateDoc(callDocRef, updates);
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
      console.log(`Chamado ${id} excluído permanentemente.`);
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
    querySnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });

    try {
      await batch.commit();
      console.log("Todos os chamados excluídos foram limpos.");
    } catch (error) {
      console.error("Erro ao limpar chamados excluídos: ", error);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <p>A carregar...</p>
        </div>
      );
    }

    if (!user || !userData) {
      return <AuthPage />;
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
          />
        );
      case "driver":
        return <DriverInterface />;
      default:
        return (
          <div className="flex items-center justify-center min-h-screen">
            <p>A verificar permissões...</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {user && userData && (
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
      {/* --- CORREÇÃO: Renderizando apenas o Toaster do 'sonner' --- */}
      <Toaster richColors position="top-center" />
      <audio ref={audioRef} src="/shopee-ringtone.mp3" preload="auto"></audio>
    </div>
  );
}

export default App;
