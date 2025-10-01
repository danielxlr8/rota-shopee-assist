import { useState, useEffect } from "react";
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
import { DriverInterface } from "./components/DriverInterface"; // <-- CORREÇÃO AQUI
import { VerifyEmailPage } from "./components/VerifyEmailPage";
import type {
  SupportCall as OriginalSupportCall,
  Driver,
} from "./types/logistics";

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
  const [isAdminUnverified, setIsAdminUnverified] = useState(false);

  const [calls, setCalls] = useState<SupportCall[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setIsAdminUnverified(false);

      if (currentUser) {
        await currentUser.reload();
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
        const currentUser = auth.currentUser;
        if (!currentUser) return <AuthPage />;

        const driverProfile = drivers.find(
          (d) => d.uid === currentUser.uid || d.googleUid === currentUser.uid
        );

        if (driverProfile) {
          // Passando o perfil do motorista como prop
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
