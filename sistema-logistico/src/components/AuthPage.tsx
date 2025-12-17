import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Lottie from "lottie-react";
import rocketAnimation from "../rocket-launch.json";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  sendEmailVerification,
} from "firebase/auth";
import { auth, db } from "../firebase";
import {
  doc,
  getDoc,
  query,
  where,
  getDocs,
  collection,
  updateDoc,
  setDoc,
} from "firebase/firestore";
import {
  Lock,
  Mail,
  User,
  LogIn,
  Briefcase,
  UserPlus,
  Phone,
  Hash,
  Calendar,
  Eye,
  EyeOff,
  Clock,
  MapPin,
  AlertTriangle,
} from "lucide-react";
import { cn } from "../lib/utils";
import { Loading } from "./ui/loading";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 48 48">
    <path
      fill="#FFC107"
      d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
    ></path>
    <path
      fill="#FF3D00"
      d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
    ></path>
    <path
      fill="#4CAF50"
      d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.519-3.487-11.187-8.264l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
    ></path>
    <path
      fill="#1976D2"
      d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C42.022,35.244,44,30.036,44,24C44,22.659,43.862,21.35,43.611,20.083z"
    ></path>
  </svg>
);

export const AuthPage = () => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [activeTab, setActiveTab] = useState<"admin" | "driver">("driver");
  const [previousTab, setPreviousTab] = useState<"admin" | "driver">("driver");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [phone, setPhone] = useState("");
  const [driverId, setDriverId] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLinkingGoogleAccount, setIsLinkingGoogleAccount] = useState(false);
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [linkingError, setLinkingError] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<
    "rocket" | "fadeIn" | "complete"
  >("complete");
  const [isInitialLoading] = useState(false);

  const [adminProfile, setAdminProfile] = useState<{
    name: string;
    city: string;
    avatar: string;
    initials: string;
  } | null>(null);
  const [driverProfile, setDriverProfile] = useState<{
    name: string;
    city: string;
    avatar: string;
    initials: string;
  } | null>(null);
  const [currentDateTime, setCurrentDateTime] = useState<Date>(new Date());
  
  // Atualizar data/hora do Brasil
  useEffect(() => {
    const updateDateTime = () => {
      const brazilTime = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
      setCurrentDateTime(brazilTime);
    };
    
    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Loading inicial removido - card aparece imediatamente
  
  // Buscar dados do admin quando a aba admin estiver selecionada
  useEffect(() => {
    if (activeTab === "admin") {
      const currentUser = auth.currentUser;
      
      if (currentUser && currentUser.email?.endsWith("@shopee.com")) {
        const fetchAdminProfile = async () => {
          try {
            const adminDocRef = doc(db, "admins_pre_aprovados", currentUser.uid);
            const adminDoc = await getDoc(adminDocRef);
            
            if (adminDoc.exists()) {
              const data = adminDoc.data();
              const name = data.name || currentUser.displayName || currentUser.email?.split("@")[0] || "Admin";
              const initials = name
                .split(" ")
                .map((n: string) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);
              
              setAdminProfile({
                name: name,
                city: data.city || "Não informado",
                avatar: data.avatar || currentUser.photoURL || "",
                initials: initials,
              });
            } else {
              const name = currentUser.displayName || currentUser.email?.split("@")[0] || "Admin";
              const initials = name
                .split(" ")
                .map((n: string) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);
              
              setAdminProfile({
                name: name,
                city: "Não informado",
                avatar: currentUser.photoURL || "",
                initials: initials,
              });
            }
          } catch (error) {
            console.error("Erro ao buscar perfil do admin:", error);
            setAdminProfile({
              name: "Admin Shopee",
              city: "Brasil",
              avatar: "",
              initials: "AS",
            });
          }
        };
        
        fetchAdminProfile();
      } else {
        setAdminProfile({
          name: "Admin Shopee",
          city: "Brasil",
          avatar: "",
          initials: "AS",
        });
      }
    } else {
      setAdminProfile(null);
    }
  }, [activeTab]);
  
  // Buscar dados do motorista quando a aba driver estiver selecionada
  useEffect(() => {
    if (activeTab === "driver") {
      const currentUser = auth.currentUser;
      
      if (currentUser && !currentUser.email?.endsWith("@shopee.com")) {
        const fetchDriverProfile = async () => {
          try {
            const driversRef = collection(db, "motoristas_pre_aprovados");
            const q = query(
              driversRef,
              where("uid", "==", currentUser.uid)
            );
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
              const driverData = querySnapshot.docs[0].data();
              const name = driverData.name || currentUser.displayName || currentUser.email?.split("@")[0] || "Motorista";
              const initials = name
                .split(" ")
                .map((n: string) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);
              
              const hub = driverData.hub || "";
              const city = hub.split("_")[2] || driverData.city || "Não informado";
              
              setDriverProfile({
                name: name,
                city: city,
                avatar: driverData.avatar || currentUser.photoURL || "",
                initials: initials,
              });
            } else {
              const q2 = query(
                driversRef,
                where("googleUid", "==", currentUser.uid)
              );
              const querySnapshot2 = await getDocs(q2);
              
              if (!querySnapshot2.empty) {
                const driverData = querySnapshot2.docs[0].data();
                const name = driverData.name || currentUser.displayName || currentUser.email?.split("@")[0] || "Motorista";
                const initials = name
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);
                
                const hub = driverData.hub || "";
                const city = hub.split("_")[2] || driverData.city || "Não informado";
                
                setDriverProfile({
                  name: name,
                  city: city,
                  avatar: driverData.avatar || currentUser.photoURL || "",
                  initials: initials,
                });
              } else {
                const name = currentUser.displayName || currentUser.email?.split("@")[0] || "Motorista";
                const initials = name
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);
                
                setDriverProfile({
                  name: name,
                  city: "Não informado",
                  avatar: currentUser.photoURL || "",
                  initials: initials,
                });
              }
            }
          } catch (error) {
            console.error("Erro ao buscar perfil do motorista:", error);
            setDriverProfile({
              name: "Motorista",
              city: "Brasil",
              avatar: "",
              initials: "M",
            });
          }
        };
        
        fetchDriverProfile();
      } else {
        setDriverProfile({
          name: "Motorista",
          city: "Brasil",
          avatar: "",
          initials: "M",
        });
      }
    } else {
      setDriverProfile(null);
    }
  }, [activeTab]);

  // Callback quando a animação do foguete termina
  const handleRocketComplete = () => {
    // Mostra o card quase instantaneamente
    setAnimationPhase("fadeIn");
    setTimeout(() => setAnimationPhase("complete"), 100);
  };

  const formatAndLimitPhone = (value: string) => {
    let digits = value.replace(/\D/g, "");
    digits = digits.slice(0, 11);
    if (digits.length > 2)
      digits = `(${digits.substring(0, 2)}) ${digits.substring(2)}`;
    if (digits.length > 9)
      digits = `${digits.substring(0, 9)}-${digits.substring(9)}`;
    return digits;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMessage("");
    if (activeTab === "driver" && email.endsWith("@shopee.com")) {
      setError("Contas @shopee.com devem usar aba Admin.");
      setLoading(false);
      return;
    }
    if (activeTab === "admin" && !email.endsWith("@shopee.com")) {
      setError("Admin só com @shopee.com.");
      setLoading(false);
      return;
    }
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      if (activeTab === "admin" && !userCredential.user.emailVerified) {
        setError("Verifique seu e-mail.");
        await signOut(auth);
        setLoading(false);
        return;
      }
    } catch (err: any) {
      if (
        [
          "auth/user-not-found",
          "auth/wrong-password",
          "auth/invalid-credential",
        ].includes(err.code)
      ) {
        setError("E-mail ou senha inválidos.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Muitas tentativas. Tente mais tarde.");
      } else {
        setError("Falha ao entrar.");
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMessage("");
    if (activeTab === "driver" && email.endsWith("@shopee.com")) {
      setError("Contas @shopee.com devem ser Admin.");
      setLoading(false);
      return;
    }
    if (activeTab === "admin" && !email.endsWith("@shopee.com")) {
      setError("Admin só com e-mail @shopee.com.");
      setLoading(false);
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      if (activeTab === "driver") {
        const driverDocRef = doc(db, "motoristas_pre_aprovados", driverId);
        const driverDoc = await getDoc(driverDocRef);
        if (!driverDoc.exists() || driverDoc.data().uid) {
          setError("ID inválido ou já cadastrado.");
          await user.delete();
          setLoading(false);
          return;
        }
        await updateDoc(driverDocRef, {
          name: `${name} ${lastName}`,
          phone: phone.replace(/\D/g, ""),
          birthDate,
          email: user.email,
          uid: user.uid,
        });
      } else {
        await sendEmailVerification(user);
        const adminDocRef = doc(db, "admins_pre_aprovados", user.uid);
        await setDoc(adminDocRef, {
          uid: user.uid,
          email: user.email,
          name: `${name} ${lastName}`,
          phone: phone.replace(/\D/g, ""),
          birthDate,
          role: "admin",
        });
        await signOut(auth);
        setSuccessMessage("Conta criada! Verifique seu e-mail.");
        setIsLoginView(true);
      }
    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") {
        setError("E-mail já em uso.");
      } else if (err.code === "auth/weak-password") {
        setError("Senha fraca (mínimo 6 caracteres).");
      } else {
        setError("Falha ao criar conta.");
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async (role: "admin" | "driver") => {
    setLoading(true);
    setError("");
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      if (!user) {
        setError("Falha no Google.");
        setLoading(false);
        return;
      }
      if (role === "admin") {
        if (!user.email?.endsWith("@shopee.com")) {
          setError("Admin só com @shopee.com.");
          await signOut(auth);
        }
      } else {
        if (user.email?.endsWith("@shopee.com")) {
          setError("Conta @shopee.com deve usar aba Admin.");
          await signOut(auth);
          setLoading(false);
          return;
        }
        const q = query(
          collection(db, "motoristas_pre_aprovados"),
          where("googleUid", "==", user.uid)
        );
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
          setGoogleUser(user);
          setIsLinkingGoogleAccount(true);
        }
      }
    } catch (err: any) {
      if (err.code !== "auth/popup-closed-by-user") {
        setError("Falha ao entrar com Google.");
        console.error(err);
      } else {
        setError("");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLinkAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLinkingError("");
    if (!driverId.trim()) {
      setLinkingError("Insira seu ID.");
      setLoading(false);
      return;
    }
    try {
      const driverDocRef = doc(db, "motoristas_pre_aprovados", driverId.trim());
      const driverDoc = await getDoc(driverDocRef);
      if (!driverDoc.exists()) {
        setLinkingError("ID não encontrado.");
        setLoading(false);
        return;
      }
      const driverData = driverDoc.data();
      if (driverData.uid || driverData.googleUid) {
        setLinkingError("ID já vinculado.");
        setLoading(false);
        return;
      }
      await updateDoc(driverDoc.ref, {
        googleUid: googleUser.uid,
        email: googleUser.email,
        name: driverData.name || googleUser.displayName || "N/A",
        avatar: driverData.avatar || googleUser.photoURL,
      });
      setIsLinkingGoogleAccount(false);
      setGoogleUser(null);
      setDriverId("");
    } catch (err) {
      setLinkingError("Erro ao vincular.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (isLinkingGoogleAccount) {
    return (
      <div
        className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden"
        style={{ minHeight: "100vh", minWidth: "100vw" }}
      >
        {/* Background com gradiente Shopee */}
        <div
          className="absolute inset-0 w-full h-full"
          style={{
            background: "linear-gradient(135deg, #fff5f0 0%, #ffe8d6 5%, #ffd4b8 10%, #ffb88c 15%, #ffa366 20%, #ff8c42 25%, #ff7733 30%, #ff6622 35%, #ff5511 40%, #ff4400 45%, #ee3d00 50%, #dd3300 55%, #cc2a00 60%, #bb2200 65%, #aa1a00 70%, #991100 75%, #880900 80%, #770600 85%, #660400 90%, #550300 95%, #440200 100%)",
            backgroundAttachment: "fixed",
          }}
        />
        
        {/* Overlay com padrão sutil */}
        <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-5" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/10" />

        {/* Card principal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-lg p-8 md:p-10 relative z-10"
        >
          <div
            className="w-full rounded-3xl p-8 md:p-10 backdrop-blur-xl border-2 shadow-2xl"
            style={{
              background: "linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 248, 240, 0.98) 100%)",
              borderColor: "rgba(238, 77, 45, 0.3)",
              boxShadow: "0 25px 60px -20px rgba(238, 77, 45, 0.4), 0 0 40px rgba(255, 122, 26, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.5)",
            }}
          >
            {/* Logo/Ícone Shopee */}
            <div className="flex justify-center mb-6">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg"
                style={{
                  background: "linear-gradient(135deg, #EE4D2D 0%, #FF6B35 100%)",
                  boxShadow: "0 10px 30px rgba(238, 77, 45, 0.4)",
                }}
              >
                <Hash size={40} className="text-white" />
              </div>
            </div>

            {/* Título */}
            <motion.h2
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-3xl md:text-4xl font-bold text-center mb-2"
              style={{
                background: "linear-gradient(135deg, #EE4D2D 0%, #FF6B35 50%, #EE4D2D 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Validação de Acesso
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-center text-slate-600 mb-8 text-sm md:text-base"
            >
              Digite seu ID de motorista para validar seu acesso ao sistema
            </motion.p>

            {/* Formulário */}
            <form onSubmit={handleLinkAccount} className="space-y-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <label
                  htmlFor="driverIdLink"
                  className="block text-sm font-bold uppercase tracking-wide mb-2"
                  style={{ color: "#EE4D2D" }}
                >
                  ID do Motorista
                </label>
                <div className="relative">
                  <input
                    id="driverIdLink"
                    type="text"
                    value={driverId}
                    onChange={(e) => setDriverId(e.target.value)}
                    className="w-full p-4 rounded-xl text-base font-medium border-2 transition-all focus:ring-4 focus:ring-orange-500/30 outline-none"
                    style={{
                      background: "rgba(255, 255, 255, 0.9)",
                      borderColor: linkingError ? "#ef4444" : "rgba(238, 77, 45, 0.3)",
                      color: "#1e293b",
                      boxShadow: linkingError 
                        ? "0 0 0 3px rgba(239, 68, 68, 0.1)" 
                        : "0 4px 15px rgba(238, 77, 45, 0.1)",
                    }}
                    placeholder="Digite seu ID único"
                    required
                    autoComplete="off"
                    autoFocus
                  />
                  <div
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                    style={{ color: "#EE4D2D" }}
                  >
                    <Hash size={20} />
                  </div>
                </div>
                {linkingError && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-red-600 mt-2 flex items-center gap-2 font-medium"
                  >
                    <AlertTriangle size={16} />
                    {linkingError}
                  </motion.p>
                )}
              </motion.div>

              {/* Botão de ação */}
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                type="submit"
                disabled={loading || !driverId.trim()}
                className="w-full py-4 rounded-xl font-bold text-lg text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] shadow-xl"
                style={{
                  background: loading || !driverId.trim()
                    ? "linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%)"
                    : "linear-gradient(135deg, #EE4D2D 0%, #FF6B35 50%, #EE4D2D 100%)",
                  backgroundSize: "200% 200%",
                  boxShadow: loading || !driverId.trim()
                    ? "0 4px 15px rgba(0, 0, 0, 0.1)"
                    : "0 10px 30px rgba(238, 77, 45, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
                }}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-3">
                    <Loading size="sm" variant="spinner" />
                    <span className="font-semibold tracking-wide">Verificando...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <LogIn size={20} />
                    <span>Validar e Continuar</span>
                  </div>
                )}
              </motion.button>

              {/* Botão cancelar */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                type="button"
                onClick={async () => {
                  if (auth.currentUser) {
                    await signOut(auth);
                  }
                  setIsLinkingGoogleAccount(false);
                  setGoogleUser(null);
                  setLinkingError("");
                  setDriverId("");
                }}
                className="w-full text-center text-sm text-slate-600 hover:text-slate-800 font-medium transition-colors py-2"
              >
                Cancelar
              </motion.button>
            </form>

            {/* Informações adicionais */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-8 pt-6 border-t border-orange-200/50"
            >
              <div className="flex items-start gap-3 text-xs text-slate-500">
                <div className="p-2 rounded-lg bg-orange-50" style={{ color: "#EE4D2D" }}>
                  <Briefcase size={16} />
                </div>
                <div>
                  <p className="font-semibold text-slate-700 mb-1">Não tem seu ID?</p>
                  <p>Entre em contato com o administrador do sistema para obter seu ID de motorista.</p>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    );
  }

  const showRocket = animationPhase === "rocket";
  const isExpanded = animationPhase === "fadeIn" || animationPhase === "complete";

  // Mostrar loading inicial
  if (isInitialLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-black relative overflow-hidden">
        {/* Vídeo de fundo do loading */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-50"
          style={{
            filter: "brightness(0.3)",
          }}
        >
          <source src="/pinterest-video (1).mp4" type="video/mp4" />
        </video>
        
        {/* Overlay escuro */}
        <div className="absolute inset-0 bg-black/60 z-10" />
        
        {/* Conteúdo do loading */}
        <div className="relative z-20 flex flex-col items-center justify-center gap-8">
          {/* Texto "Loading" com efeito */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <motion.h1
              className="text-6xl md:text-8xl font-bold text-white mb-4"
              style={{
                textShadow: "0 0 30px rgba(255, 107, 53, 0.8), 0 0 60px rgba(255, 107, 53, 0.5)",
              }}
              animate={{
                textShadow: [
                  "0 0 30px rgba(255, 107, 53, 0.8), 0 0 60px rgba(255, 107, 53, 0.5)",
                  "0 0 50px rgba(255, 107, 53, 1), 0 0 100px rgba(255, 107, 53, 0.8)",
                  "0 0 30px rgba(255, 107, 53, 0.8), 0 0 60px rgba(255, 107, 53, 0.5)",
                ],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              LOADING
            </motion.h1>
            
            {/* Pontos animados */}
            <div className="flex gap-2 justify-center">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-3 h-3 bg-orange-500 rounded-full"
                  animate={{
                    y: [0, -10, 0],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 text-foreground overflow-hidden relative"
      style={{
        minHeight: "100vh",
      }}
    >
      {/* Imagem de fundo com desfoque melhorado */}
      <div
        className="absolute inset-0 w-full h-full z-0"
        style={{
          backgroundImage: 'url("/city-skyline-background.jpg")',
        backgroundSize: "cover",
        backgroundPosition: "center center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
        minHeight: "100vh",
          filter: "blur(2px)",
          transform: "scale(1.02)",
      }}
      />
      
      {/* Overlay escuro melhorado para legibilidade */}
      <div className="absolute inset-0 bg-black/25 z-[1]" />
      
      {/* Efeito de glow de fundo durante a animação */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: showRocket ? 1 : 0 
        }}
        transition={{ duration: 0.3 }}
        style={{
          background: "radial-gradient(circle at center, rgba(249, 115, 22, 0.3) 0%, transparent 50%)",
        }}
      />

      {/* Container do card - versão melhorada do visual antigo */}
      <motion.div
        className={cn(
          "relative z-10 flex items-center justify-center border border-orange-900/30 overflow-hidden transition-all duration-300",
          isExpanded && "shadow-2xl"
        )}
        initial={{
          opacity: 1,
          y: 0,
          scale: 1,
        }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
        }}
        transition={{
          opacity: { duration: 0, delay: 0 },
          y: { duration: 0, delay: 0 },
          scale: { duration: 0, delay: 0 },
        }}
        style={{
          background: "linear-gradient(to bottom, #5C1F0F 0%, #6B2515 20%, #7A2B1B 40%, #8B2E1A 60%, #A63E1F 80%, #C04E24 100%)",
          position: "relative",
          width: "min(95vw, 1400px)",
          borderRadius: "2.5rem",
          minHeight: "auto",
        }}
      >
        {/* Efeito de textura sutil melhorado */}
        <div 
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            background: `
              radial-gradient(circle at 20% 80%, rgba(139, 46, 26, 0.3) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(192, 78, 36, 0.2) 0%, transparent 50%),
              radial-gradient(circle at 40% 60%, rgba(166, 62, 31, 0.25) 0%, transparent 50%),
              radial-gradient(circle at 60% 40%, rgba(238, 77, 45, 0.15) 0%, transparent 50%)
            `,
            mixBlendMode: "overlay",
            opacity: 0.5,
          }}
        />
        {/* Foguete dentro do círculo */}
        <AnimatePresence>
          {showRocket && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center z-20"
              initial={{ opacity: 1, y: 0 }}
              exit={{ 
                opacity: 0, 
                y: -300,
                scale: 0.8,
                transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } 
              }}
            >
              <Lottie
                animationData={rocketAnimation}
                loop={false}
                onComplete={handleRocketComplete}
                style={{ width: 140, height: 140 }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Conteúdo do formulário - aparece com fade in suave */}
        <motion.div
          className="flex flex-col md:flex-row w-full"
          initial={{ opacity: 1 }}
          animate={{ 
            opacity: 1,
          }}
          transition={{ duration: 0, delay: 0, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex-1 relative p-8 md:p-12 lg:p-16">
            {/* Conteúdo do formulário */}
            <div className="w-full z-10">
                <div className="flex flex-col">
                  {/* Seção superior do Motorista - aparece apenas na aba driver */}
                  {activeTab === "driver" && (
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15 }}
                      className="w-full p-4 md:p-6 rounded-t-[2.5rem] border-b border-orange-900/30 relative z-10 mb-6"
                      style={{
                        marginTop: "-2rem",
                        marginLeft: "-2rem",
                        marginRight: "-2rem",
                        backgroundColor: "#000000",
                        background: "linear-gradient(to bottom, #000000 0%, #1a1a1a 100%)",
                      }}
                    >
                      {/* Data e hora do Brasil no topo */}
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4 pb-4 border-b border-orange-900/20">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-white">
                            <Clock size={20} className="text-orange-500" />
                            <span className="text-xl md:text-2xl font-bold">
                              {format(currentDateTime, "HH:mm:ss", { locale: ptBR })}
                            </span>
                          </div>
                          <div className="text-sm md:text-base text-gray-300 ml-8">
                            {format(currentDateTime, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </div>
                        </div>
                      </div>
                      
                      {/* Informações do perfil */}
                      <div className="flex items-center gap-4">
                        {/* Foto de perfil */}
                        <div className="relative flex-shrink-0">
                          {driverProfile?.avatar ? (
                            <img
                              src={driverProfile.avatar}
                              alt={driverProfile.name}
                              className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover border-2 border-orange-500/50 shadow-lg"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = "none";
                                const parent = target.parentElement;
                                if (parent) {
                                  const fallback = parent.querySelector(".driver-avatar-fallback") as HTMLElement;
                                  if (fallback) fallback.style.display = "flex";
                                }
                              }}
                            />
                          ) : null}
                          <div 
                            className={`driver-avatar-fallback w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center border-2 border-orange-500/50 shadow-lg ${driverProfile?.avatar ? "hidden" : ""}`}
                            style={{ display: driverProfile?.avatar ? "none" : "flex" }}
                          >
                            <span className="text-2xl md:text-3xl font-bold text-white">
                              {driverProfile?.initials || "M"}
                            </span>
                          </div>
                        </div>
                        
                        {/* Nome e cidade */}
                        <div className="flex flex-col flex-1 min-w-0">
                          <h3 className="text-lg md:text-xl font-bold text-white mb-1 truncate">
                            {driverProfile?.name || "Motorista"}
                          </h3>
                          <div className="flex items-center gap-1.5 text-sm md:text-base text-gray-300">
                            <MapPin size={16} className="text-orange-500 flex-shrink-0" />
                            <span className="truncate">{driverProfile?.city || "Não informado"}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  
                  {/* Seção superior do Admin - aparece apenas na aba admin */}
                  {activeTab === "admin" && (
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15 }}
                      className="w-full p-4 md:p-6 rounded-t-[2.5rem] border-b border-orange-900/30 relative z-10 mb-6"
                      style={{
                        marginTop: "-2rem",
                        marginLeft: "-2rem",
                        marginRight: "-2rem",
                        backgroundColor: "#000000",
                        background: "linear-gradient(to bottom, #000000 0%, #1a1a1a 100%)",
                      }}
                    >
                      {/* Data e hora do Brasil no topo */}
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4 pb-4 border-b border-orange-900/20">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-white">
                            <Clock size={20} className="text-orange-500" />
                            <span className="text-xl md:text-2xl font-bold">
                              {format(currentDateTime, "HH:mm:ss", { locale: ptBR })}
                            </span>
                          </div>
                          <div className="text-sm md:text-base text-gray-300 ml-8">
                            {format(currentDateTime, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </div>
                        </div>
                      </div>
                      
                      {/* Informações do perfil */}
                      <div className="flex items-center gap-4">
                        {/* Foto de perfil */}
                        <div className="relative flex-shrink-0">
                          {adminProfile?.avatar ? (
                            <img
                              src={adminProfile.avatar}
                              alt={adminProfile.name}
                              className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover border-2 border-orange-500/50 shadow-lg"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = "none";
                                const parent = target.parentElement;
                                if (parent) {
                                  const fallback = parent.querySelector(".admin-avatar-fallback") as HTMLElement;
                                  if (fallback) fallback.style.display = "flex";
                                }
                              }}
                            />
                          ) : null}
                          <div 
                            className={`admin-avatar-fallback w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center border-2 border-orange-500/50 shadow-lg ${adminProfile?.avatar ? "hidden" : ""}`}
                            style={{ display: adminProfile?.avatar ? "none" : "flex" }}
                          >
                            <span className="text-2xl md:text-3xl font-bold text-white">
                              {adminProfile?.initials || "A"}
                            </span>
                          </div>
                        </div>
                        
                        {/* Nome e cidade */}
                        <div className="flex flex-col flex-1 min-w-0">
                          <h3 className="text-lg md:text-xl font-bold text-white mb-1 truncate">
                            {adminProfile?.name || "Admin Shopee"}
                          </h3>
                          <div className="flex items-center gap-1.5 text-sm md:text-base text-gray-300">
                            <MapPin size={16} className="text-orange-500 flex-shrink-0" />
                            <span className="truncate">{adminProfile?.city || "Não informado"}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  
                <div className="flex flex-col border-b border-border">
                  <div className="mb-6">
                    {/* Logo Shopee Xpress em texto - largura total e maior */}
                    <div className="flex items-baseline justify-center w-full">
                      <span 
                        className="text-5xl md:text-6xl lg:text-7xl font-bold italic"
                        style={{
                          background: "linear-gradient(135deg, #f97316 0%, #ea580c 50%, #f97316 100%)",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          textShadow: "0 0 40px rgba(249, 115, 22, 0.3)",
                        }}
                      >
                        Shopee
                      </span>
                      <span 
                        className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight"
                        style={{
                          background: "linear-gradient(135deg, #fb923c 0%, #f97316 50%, #ea580c 100%)",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          textShadow: "0 0 40px rgba(249, 115, 22, 0.3)",
                        }}
                      >
                        X
                      </span>
                      <span 
                        className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-wider"
                        style={{
                          background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                        }}
                      >
                        PRESS
                      </span>
                    </div>
                  </div>
                  </div>
                  <div className="flex rounded-full border border-border overflow-hidden text-sm font-semibold" style={{ background: "rgba(15, 23, 42, 0.1)" }}>
                    <button
                      onClick={() => {
                        setPreviousTab(activeTab);
                        setActiveTab("driver");
                      }}
                      className={cn(
                        "flex-1 py-4 md:py-5 text-lg md:text-xl font-semibold text-center transition-all duration-300",
                        activeTab === "driver"
                          ? "bg-primary text-primary-foreground shadow-lg"
                          : "text-slate-800/70 hover:bg-slate-800/10 hover:text-slate-900"
                      )}
                    >
                      <User className="inline-block mr-2 md:mr-3" size={20} />{" "}
                      Motorista
                    </button>
                    <button
                      onClick={() => {
                        setPreviousTab(activeTab);
                        setActiveTab("admin");
                      }}
                      className={cn(
                        "flex-1 py-4 md:py-5 text-lg md:text-xl font-semibold text-center transition-all duration-300",
                        activeTab === "admin"
                          ? "bg-primary text-primary-foreground shadow-lg"
                          : "text-slate-800/70 hover:bg-slate-800/10 hover:text-slate-900"
                      )}
                    >
                      <Briefcase
                        className="inline-block mr-2 md:mr-3"
                        size={20}
                      />{" "}
                      Admin
                    </button>
                  </div>
                </div>

                <div className="pt-8 md:pt-12 space-y-8 md:space-y-10">
                  <div className="relative h-32 md:h-40 lg:h-48 overflow-hidden flex items-center justify-center">
                    <AnimatePresence mode="wait">
                      <motion.h2
                        key={`${activeTab}-${isLoginView}`}
                        initial={{
                          x: activeTab === "driver" ? -300 : 300,
                          opacity: 0,
                        }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{
                          x: previousTab === "driver" ? 300 : -300,
                          opacity: 0,
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 25,
                          duration: 0.3,
                        }}
                        className="absolute inset-0 flex items-center justify-center text-center text-3xl md:text-5xl lg:text-6xl font-bold leading-tight px-4"
                        style={{ color: "#FFFFFF" }}
                      >
                        {isLoginView ? "Login de " : "Cadastro de "}
                        {activeTab === "admin" ? "Administrador" : "Motorista"}
                      </motion.h2>
                    </AnimatePresence>
                  </div>

                  {error && (
                    <p className="text-base md:text-lg text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
                      {error}
                    </p>
                  )}
                  {successMessage && (
                    <p className="text-base md:text-lg text-green-400 bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-3">
                      {successMessage}
                    </p>
                  )}

                  <AnimatePresence mode="wait">
                    {isLoginView ? (
                      <motion.form
                        key={`login-${activeTab}`}
                        initial={{
                          x: activeTab === "driver" ? -100 : 100,
                          opacity: 0,
                        }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{
                          x: previousTab === "driver" ? 100 : -100,
                          opacity: 0,
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 30,
                          duration: 0.4,
                        }}
                        onSubmit={handleLogin}
                        className="space-y-6 md:space-y-8"
                      >
                        <div className="relative">
                          <Mail
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                            size={24}
                          />
                          <input
                            type="email"
                            placeholder="E-mail"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 md:py-5 text-lg md:text-xl rounded-2xl bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all"
                            required
                            autoComplete="off"
                          />
                        </div>
                        <div className="relative">
                          <Lock
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                            size={24}
                          />
                          <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Senha"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-12 pr-12 py-4 md:py-5 text-lg md:text-xl rounded-2xl bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all"
                            required
                            autoComplete="new-password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showPassword ? (
                              <EyeOff size={20} />
                            ) : (
                              <Eye size={20} />
                            )}
                          </button>
                        </div>
                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full flex justify-center items-center gap-3 py-4 md:py-5 px-4 rounded-2xl text-lg md:text-xl font-semibold text-primary-foreground bg-primary hover:bg-primary/90 transition-all shadow-lg disabled:opacity-50"
                        >
                          {loading ? (
                            <>
                              <Loading size="sm" variant="spinner" />
                              <span className="font-semibold tracking-wide" style={{ 
                                fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif",
                                letterSpacing: "0.5px"
                              }}>Entrando...</span>
                            </>
                          ) : (
                            <>
                              <LogIn size={20} />
                              <span>Entrar</span>
                            </>
                          )}
                        </button>
                      </motion.form>
                    ) : (
                      <motion.form
                        key={`register-${activeTab}`}
                        initial={{
                          x: activeTab === "driver" ? -100 : 100,
                          opacity: 0,
                        }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{
                          x: previousTab === "driver" ? 100 : -100,
                          opacity: 0,
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 30,
                          duration: 0.4,
                        }}
                        onSubmit={handleRegister}
                        className="space-y-6 md:space-y-8"
                      >
                        <div className="relative">
                          <User
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                            size={24}
                          />
                          <input
                            type="text"
                            placeholder="Nome"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 md:py-5 text-lg md:text-xl rounded-2xl bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all"
                            required
                            autoComplete="off"
                          />
                        </div>
                        <div className="relative">
                          <User
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                            size={24}
                          />
                          <input
                            type="text"
                            placeholder="Sobrenome"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 md:py-5 text-lg md:text-xl rounded-2xl bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all"
                            required
                            autoComplete="off"
                          />
                        </div>
                        <div className="relative">
                          <Calendar
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                            size={24}
                          />
                          <input
                            type="date"
                            placeholder="Data de Nascimento"
                            value={birthDate}
                            onChange={(e) => setBirthDate(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 md:py-5 text-lg md:text-xl rounded-2xl bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all"
                            required
                            autoComplete="off"
                          />
                        </div>
                        <div className="relative">
                          <Phone
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                            size={24}
                          />
                          <input
                            type="tel"
                            placeholder="Telefone (com DDD)"
                            value={phone}
                            onChange={(e) =>
                              setPhone(formatAndLimitPhone(e.target.value))
                            }
                            className="w-full pl-12 pr-4 py-4 md:py-5 text-lg md:text-xl rounded-2xl bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all"
                            required
                            autoComplete="off"
                          />
                        </div>
                        {activeTab === "driver" && (
                          <div className="relative">
                            <Hash
                              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                              size={24}
                            />
                            <input
                              type="text"
                              placeholder="ID de Motorista (fornecido pelo admin)"
                              value={driverId}
                              onChange={(e) => setDriverId(e.target.value)}
                              className="w-full pl-12 pr-4 py-4 md:py-5 text-lg md:text-xl rounded-2xl bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all"
                              required
                              autoComplete="off"
                            />
                          </div>
                        )}
                        <div className="relative">
                          <Mail
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                            size={24}
                          />
                          <input
                            type="email"
                            placeholder="E-mail"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 md:py-5 text-lg md:text-xl rounded-2xl bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all"
                            required
                            autoComplete="off"
                          />
                        </div>
                        <div className="relative">
                          <Lock
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                            size={24}
                          />
                          <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Senha (mínimo 6 caracteres)"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-12 pr-12 py-4 md:py-5 text-lg md:text-xl rounded-2xl bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all"
                            required
                            autoComplete="new-password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showPassword ? (
                              <EyeOff size={20} />
                            ) : (
                              <Eye size={20} />
                            )}
                          </button>
                        </div>
                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full flex justify-center items-center gap-3 py-4 md:py-5 px-4 rounded-2xl text-lg md:text-xl font-semibold text-primary-foreground bg-primary hover:bg-primary/90 transition-all shadow-lg disabled:opacity-50"
                        >
                          {loading ? (
                            <>
                              <Loading size="sm" variant="spinner" />
                              <span className="font-semibold tracking-wide" style={{ 
                                fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif",
                                letterSpacing: "0.5px"
                              }}>Cadastrando...</span>
                            </>
                          ) : (
                            <>
                              <UserPlus size={20} />
                              <span>Cadastrar</span>
                            </>
                          )}
                        </button>
                      </motion.form>
                    )}
                  </AnimatePresence>

                  <div className="pt-4 md:pt-6 text-base md:text-lg" style={{ color: "#FFFFFF" }}>
                    <button
                      onClick={() => {
                        setPreviousTab(activeTab);
                        setIsLoginView(!isLoginView);
                        setError("");
                        setSuccessMessage("");
                      }}
                      className="font-medium text-orange-400 hover:text-orange-300 transition-colors"
                    >
                      {isLoginView
                        ? "Não tem uma conta? Cadastre-se"
                        : "Já tem uma conta? Faça login"}
                    </button>
                  </div>

                  <div className="mt-8 md:mt-10 relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t" style={{ borderColor: "rgba(255, 255, 255, 0.2)" }} />
                    </div>
                    <div className="relative flex justify-center text-base md:text-lg" style={{ color: "#E2E8F0" }}>
                      <span className="px-4 rounded-full" style={{ background: "rgba(255, 255, 255, 0.1)", backdropFilter: "blur(8px)" }}>Ou</span>
                    </div>
                  </div>

                  <div className="mt-8 md:mt-10">
                    <button
                      onClick={() => handleGoogleSignIn(activeTab)}
                      disabled={loading}
                      className="w-full flex justify-center items-center gap-3 py-4 md:py-5 px-4 rounded-2xl border border-border bg-secondary text-secondary-foreground text-base md:text-lg font-medium hover:bg-secondary/80 disabled:opacity-50 transition-all"
                    >
                      <GoogleIcon /> Entrar com o Google
                    </button>
                  </div>
                </div>
            </div>
          </div>

          {/* Imagem lateral com formato arredondado interno - melhorada */}
          <motion.div 
            className="hidden md:block w-[42%] relative m-4 overflow-hidden flex-shrink-0"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ 
              opacity: isExpanded ? 1 : 0,
              scale: isExpanded ? 1 : 0.9,
            }}
            transition={{ 
              duration: 0.2,
              ease: [0.22, 1, 0.36, 1],
              delay: 0.05,
            }}
            style={{
              borderRadius: "1.5rem",
              boxShadow: `
                inset 0 2px 10px rgba(0, 0, 0, 0.5),
                0 10px 30px rgba(0, 0, 0, 0.4)
              `,
            }}
          >
            <div 
              className="absolute inset-0 bg-[url('/SP3.jpg')] bg-cover bg-center"
              style={{ borderRadius: "1.5rem" }}
            />
            <div 
              className="absolute inset-0 bg-gradient-to-br from-slate-900/20 via-transparent to-slate-900/40"
              style={{ borderRadius: "1.5rem" }}
            />
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
};
