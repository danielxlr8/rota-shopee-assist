import React, { useState } from "react"; // CORREÇÃO: useEffect removido
import { motion, AnimatePresence } from "framer-motion";
import Lottie from "lottie-react";
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
} from "lucide-react";
import rocketAnimation from "../rocket-launch.json";

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
  const [animationState, setAnimationState] = useState<
    "playing" | "exiting" | "finished"
  >("playing");

  const handleLottieComplete = () => {
    setAnimationState("exiting");
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
        className="min-h-screen w-full flex items-center justify-center p-4 relative"
        style={{ minHeight: '100vh', minWidth: '100vw' }}
      >
        {/* Background da imagem do armazém - preenchendo toda a página */}
        <div 
          className="absolute inset-0 w-full h-full"
          style={{
            backgroundImage: 'url("/warehouse-background.jpg")',
            backgroundSize: 'cover',
            backgroundPosition: 'center center',
            backgroundRepeat: 'no-repeat',
            backgroundAttachment: 'fixed',
            minHeight: '100vh',
            imageRendering: 'auto',
          }}
        />
        
        {/* Fallback com gradiente laranja caso a imagem não carregue */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#FFA832] via-[#FE8330] to-[#FE5F2F] -z-10 min-h-screen" />
        
        {/* Overlay sutil para melhorar legibilidade do formulário */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/30 to-black/40" />
        
        <div
          className="w-full max-w-md p-8 relative z-10 rounded-3xl border-2"
          style={{
            background: "transparent",
            borderImage:
              "linear-gradient(120deg, #ffb347, #ff7a1a, #ffb347) 1",
            boxShadow:
              "0 25px 60px -20px rgba(0,0,0,0.5), 0 0 25px rgba(255,122,26,0.4), inset 0 0 12px rgba(255,155,71,0.3)",
            transform: "translateZ(0)",
          }}
        >
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
            Vincular Conta Google
          </h2>
          <p className="text-center text-gray-600 mb-6">
            Para usar o login com Google, vincule seu ID de motorista.
          </p>
          <form onSubmit={handleLinkAccount} className="space-y-4">
            <div>
              <label
                htmlFor="driverIdLink"
                className="block text-sm font-medium text-gray-700"
              >
                ID de Motorista
              </label>
              <input
                id="driverIdLink"
                type="text"
                value={driverId}
                onChange={(e) => setDriverId(e.target.value)}
                className="mt-1 block w-full input-style text-gray-900"
                placeholder="Seu ID único"
                required
                autoComplete="off"
              />{" "}
            </div>
            {linkingError && (
              <p className="text-sm text-red-600 text-center">{linkingError}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50"
            >
              {loading ? "Verificando..." : "Vincular Conta"}
            </button>
            <button
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
              className="w-full text-center text-sm text-gray-600 hover:text-gray-800 mt-2"
            >
              Cancelar
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white">
      <div className="w-full max-w-6xl flex flex-col md:flex-row overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/70 shadow-[0_25px_80px_-30px_rgba(0,0,0,0.6)] backdrop-blur-xl">
        <div className="flex-1 relative p-10 md:p-16 lg:p-20">
          {animationState !== "finished" && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center z-0"
              animate={{
                y: animationState === "exiting" ? "-100%" : "0%",
                opacity: animationState === "exiting" ? 0 : 1,
              }}
              transition={{ duration: 0.5, ease: "easeIn" }}
              onAnimationComplete={() => {
                if (animationState === "exiting") {
                  setAnimationState("finished");
                }
              }}
            >
              <Lottie
                animationData={rocketAnimation}
                loop={false}
                onComplete={handleLottieComplete}
                style={{ width: 320, height: 320 }}
              />
            </motion.div>
          )}

          <AnimatePresence>
            {(animationState === "exiting" || animationState === "finished") && (
              <motion.div
                key="form"
                className="w-full z-10"
                initial={{ opacity: 0, y: "100%" }}
                animate={{ opacity: 1, y: "0%" }}
                transition={{
                  type: "spring",
                  stiffness: 50,
                  damping: 15,
                  delay: 0.2,
                }}
              >
                <div className="flex flex-col border-b border-slate-800">
                  <div className="flex items-center gap-4 mb-6">
                    <img
                      src="/spx-logo-long.png"
                      alt="Shopee Xpress"
                      className="w-72 md:w-96 lg:w-[28rem] xl:w-[32rem]"
                    />
                    <div className="flex-1 h-px bg-slate-800" />
                  </div>
                  <div className="flex rounded-full border border-slate-800 bg-slate-900/60 overflow-hidden text-sm font-semibold">
                    <button
                      onClick={() => {
                        setPreviousTab(activeTab);
                        setActiveTab("driver");
                      }}
                      className={`flex-1 py-4 md:py-5 text-lg md:text-xl font-semibold text-center transition-colors ${
                        activeTab === "driver"
                          ? "bg-orange-500 text-white"
                          : "text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      <User className="inline-block mr-2 md:mr-3" size={20} /> Motorista
                    </button>
                    <button
                      onClick={() => {
                        setPreviousTab(activeTab);
                        setActiveTab("admin");
                      }}
                      className={`flex-1 py-4 md:py-5 text-lg md:text-xl font-semibold text-center transition-colors ${
                        activeTab === "admin"
                          ? "bg-orange-500 text-white"
                          : "text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      <Briefcase className="inline-block mr-2 md:mr-3" size={20} /> Admin
                    </button>
                  </div>
                </div>

                <div className="pt-8 md:pt-12 space-y-8 md:space-y-10">
                  <div className="relative h-20 md:h-24 lg:h-28 overflow-hidden">
                    <AnimatePresence mode="wait">
                      <motion.h2
                        key={`${activeTab}-${isLoginView}`}
                        initial={{ 
                          x: activeTab === "driver" ? -300 : 300, 
                          opacity: 0 
                        }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ 
                          x: previousTab === "driver" ? 300 : -300, 
                          opacity: 0 
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 30,
                          duration: 0.5
                        }}
                        className="absolute inset-0 text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight"
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
                        initial={{ x: activeTab === "driver" ? -100 : 100, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: previousTab === "driver" ? 100 : -100, opacity: 0 }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 30,
                          duration: 0.4
                        }}
                        onSubmit={handleLogin}
                        className="space-y-6 md:space-y-8"
                      >
                        <div className="relative">
                          <Mail
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                            size={24}
                          />
                          <input
                            type="email"
                            placeholder="E-mail"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 md:py-5 text-lg md:text-xl rounded-xl bg-slate-900/80 border border-slate-800 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                            required
                            autoComplete="off"
                          />
                        </div>
                        <div className="relative">
                          <Lock
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                            size={24}
                          />
                          <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Senha"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-12 pr-12 py-4 md:py-5 text-lg md:text-xl rounded-xl bg-slate-900/80 border border-slate-800 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                            required
                            autoComplete="new-password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                          >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                          </button>
                        </div>
                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full flex justify-center items-center gap-3 py-4 md:py-5 px-4 rounded-xl text-lg md:text-xl font-semibold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-500 transition-all shadow-lg shadow-orange-900/40 disabled:opacity-50"
                        >
                          <LogIn size={20} /> {loading ? "Entrando..." : "Entrar"}
                        </button>
                      </motion.form>
                    ) : (
                      <motion.form
                        key={`register-${activeTab}`}
                        initial={{ x: activeTab === "driver" ? -100 : 100, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: previousTab === "driver" ? 100 : -100, opacity: 0 }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 30,
                          duration: 0.4
                        }}
                        onSubmit={handleRegister}
                        className="space-y-6 md:space-y-8"
                      >
                      <div className="relative">
                        <User
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                          size={24}
                        />
                        <input
                          type="text"
                          placeholder="Nome"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full pl-12 pr-4 py-4 md:py-5 text-lg md:text-xl rounded-xl bg-slate-900/80 border border-slate-800 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                          required
                          autoComplete="off"
                        />
                      </div>
                      <div className="relative">
                        <User
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                          size={24}
                        />
                        <input
                          type="text"
                          placeholder="Sobrenome"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="w-full pl-12 pr-4 py-4 md:py-5 text-lg md:text-xl rounded-xl bg-slate-900/80 border border-slate-800 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                          required
                          autoComplete="off"
                        />
                      </div>
                      <div className="relative">
                        <Calendar
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                          size={24}
                        />
                        <input
                          type="date"
                          placeholder="Data de Nascimento"
                          value={birthDate}
                          onChange={(e) => setBirthDate(e.target.value)}
                          className="w-full pl-12 pr-4 py-4 md:py-5 text-lg md:text-xl rounded-xl bg-slate-900/80 border border-slate-800 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                          required
                          autoComplete="off"
                        />
                      </div>
                      <div className="relative">
                        <Phone
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                          size={24}
                        />
                        <input
                          type="tel"
                          placeholder="Telefone (com DDD)"
                          value={phone}
                          onChange={(e) =>
                            setPhone(formatAndLimitPhone(e.target.value))
                          }
                          className="w-full pl-12 pr-4 py-4 md:py-5 text-lg md:text-xl rounded-xl bg-slate-900/80 border border-slate-800 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                          required
                          autoComplete="off"
                        />
                      </div>
                      {activeTab === "driver" && (
                        <div className="relative">
                          <Hash
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                            size={24}
                          />
                          <input
                            type="text"
                            placeholder="ID de Motorista (fornecido pelo admin)"
                            value={driverId}
                            onChange={(e) => setDriverId(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 md:py-5 text-lg md:text-xl rounded-xl bg-slate-900/80 border border-slate-800 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                            required
                            autoComplete="off"
                          />
                        </div>
                      )}
                      <div className="relative">
                        <Mail
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                          size={24}
                        />
                        <input
                          type="email"
                          placeholder="E-mail"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full pl-12 pr-4 py-4 md:py-5 text-lg md:text-xl rounded-xl bg-slate-900/80 border border-slate-800 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                          required
                          autoComplete="off"
                        />
                      </div>
                      <div className="relative">
                        <Lock
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                          size={24}
                        />
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="Senha (mínimo 6 caracteres)"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full pl-12 pr-12 py-4 md:py-5 text-lg md:text-xl rounded-xl bg-slate-900/80 border border-slate-800 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                          required
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                        >
                          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center items-center gap-3 py-4 md:py-5 px-4 rounded-xl text-lg md:text-xl font-semibold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-500 transition-all shadow-lg shadow-orange-900/40 disabled:opacity-50"
                      >
                        <UserPlus size={20} />{" "}
                        {loading ? "Cadastrando..." : "Cadastrar"}
                      </button>
                      </motion.form>
                    )}
                  </AnimatePresence>

                  <div className="pt-4 md:pt-6 text-base md:text-lg text-slate-300">
                    <button
                      onClick={() => {
                        setPreviousTab(activeTab);
                        setIsLoginView(!isLoginView);
                        setError("");
                        setSuccessMessage("");
                      }}
                      className="font-medium text-orange-400 hover:text-orange-300"
                    >
                      {isLoginView
                        ? "Não tem uma conta? Cadastre-se"
                        : "Já tem uma conta? Faça login"}
                    </button>
                  </div>

                  <div className="mt-8 md:mt-10 relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-800" />
                    </div>
                    <div className="relative flex justify-center text-base md:text-lg text-slate-400">
                      <span className="px-3 bg-slate-900/70">Ou</span>
                    </div>
                  </div>

                  <div className="mt-8 md:mt-10">
                    <button
                      onClick={() => handleGoogleSignIn(activeTab)}
                      disabled={loading}
                      className="w-full flex justify-center items-center gap-3 py-4 md:py-5 px-4 rounded-xl border border-slate-700 bg-slate-900/80 text-base md:text-lg font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                    >
                      <GoogleIcon /> Entrar com o Google
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="hidden md:block w-[45%] relative">
          <div className="absolute inset-0 bg-[url('/SP3.jpg')] bg-cover bg-center" />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/30 via-slate-900/20 to-slate-900/60" />
        </div>
      </div>
    </div>
  );
};
