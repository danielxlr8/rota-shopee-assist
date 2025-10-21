import React, { useState, useEffect } from "react";
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
import rocketAnimation from "../rocket-launch.json"; // Garanta que o nome e caminho estejam corretos

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 48 48">
    {/* Paths do SVG */}
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
  // --- SEUS ESTADOS ORIGINAIS ---
  const [isLoginView, setIsLoginView] = useState(true);
  const [activeTab, setActiveTab] = useState<"admin" | "driver">("driver");
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

  // --- NOVOS ESTADOS ---
  const [showPassword, setShowPassword] = useState(false);
  // Estados para controlar as fases da animação:
  // 'playing': Foguete visível e tocando
  // 'exiting': Foguete animando a saída (ainda no DOM)
  // 'finished': Foguete saiu, formulário visível
  const [animationState, setAnimationState] = useState<
    "playing" | "exiting" | "finished"
  >("playing");

  // --- Função chamada quando o Lottie termina ---
  const handleLottieComplete = () => {
    setAnimationState("exiting"); // Inicia a animação de SAÍDA do foguete
  };

  // --- SUAS FUNÇÕES ORIGINAIS (COMPLETAS E CORRIGIDAS) ---
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

  // --- TELA DE VINCULAR CONTA ---
  if (isLinkingGoogleAccount) {
    return (
      // ------ MODIFICAÇÃO AQUI PARA A TELA DE VINCULAÇÃO ------
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#FDF0EB]">
        {/* ------ FIM DA MODIFICAÇÃO ------ */}
        <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
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
                className="mt-1 block w-full input-style"
                placeholder="Seu ID único"
                required
              />{" "}
              {/* Classe genérica */}
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

  // --- JSX PRINCIPAL COM ANIMAÇÃO CORRIGIDA ---
  return (
    // ------ MODIFICAÇÃO AQUI PARA A TELA PRINCIPAL ------
    <div
      className="min-h-screen flex items-center justify-center p-4 bg-[#FDF0EB] overflow-hidden"
      // Removida imagem de fundo, adicionada cor sólida
    >
      {/* ------ FIM DA MODIFICAÇÃO ------ */}

      {/* Container Centralizador */}
      <div className="relative w-full max-w-md h-[700px] flex items-center justify-center">
        {" "}
        {/* Aumentei a altura para dar espaço */}
        {/* Animação Lottie (Foguete) - SÓ RENDERIZA SE NÃO ESTIVER 'finished' */}
        {animationState !== "finished" && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center z-0" // Fica atrás (z-0)
            animate={{
              // Anima a saída
              y: animationState === "exiting" ? "-100%" : "0%",
              opacity: animationState === "exiting" ? 0 : 1,
            }}
            transition={{ duration: 0.5, ease: "easeIn" }}
            // Marca como 'finished' DEPOIS que a animação de SAÍDA termina
            onAnimationComplete={() => {
              if (animationState === "exiting") {
                setAnimationState("finished");
              }
            }}
          >
            <Lottie
              animationData={rocketAnimation}
              loop={false}
              onComplete={handleLottieComplete} // Chama quando a animação INTERNA acaba
              style={{ width: 400, height: 400 }} // Ajuste o tamanho
            />
          </motion.div>
        )}
        {/* Formulário de Login - SÓ RENDERIZA QUANDO O FOGUETE COMEÇA A SAIR */}
        <AnimatePresence>
          {(animationState === "exiting" || animationState === "finished") && (
            <motion.div
              key="form"
              className="w-full z-10" // Fica na frente (z-10)
              initial={{ opacity: 0, y: "100%" }} // Começa de BAIXO, invisível
              animate={{ opacity: 1, y: "0%" }} // Entra na posição
              transition={{
                type: "spring",
                stiffness: 50,
                damping: 15,
                delay: 0.2,
              }} // Delay para esperar o foguete
            >
              {/* --- CARD ORIGINAL COM ROLAGEM INTERNA --- */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden max-h-[90vh]">
                <div className="flex border-b">
                  <button
                    onClick={() => setActiveTab("driver")}
                    className={`flex-1 py-3 font-semibold text-center transition-colors ${
                      activeTab === "driver"
                        ? "text-orange-600 border-b-2 border-orange-600"
                        : "text-gray-500"
                    }`}
                  >
                    <User className="inline-block mr-2" size={18} /> Motorista
                  </button>
                  <button
                    onClick={() => setActiveTab("admin")}
                    className={`flex-1 py-3 font-semibold text-center transition-colors ${
                      activeTab === "admin"
                        ? "text-orange-600 border-b-2 border-orange-600"
                        : "text-gray-500"
                    }`}
                  >
                    <Briefcase className="inline-block mr-2" size={18} /> Admin
                  </button>
                </div>
                {/* DIV INTERNA COM ROLAGEM */}
                <div className="p-8 overflow-y-auto">
                  <img
                    src="/spx-logo.png"
                    alt="SPX Logo"
                    className="w-24 mx-auto mb-4"
                  />
                  <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
                    {isLoginView ? "Login de" : "Cadastro de"}{" "}
                    {activeTab === "admin" ? "Administrador" : "Motorista"}
                  </h2>

                  {error && (
                    <p className="text-sm text-center text-red-600 mb-4">
                      {error}
                    </p>
                  )}
                  {successMessage && (
                    <p className="text-sm text-center text-green-600 mb-4">
                      {successMessage}
                    </p>
                  )}

                  {isLoginView ? (
                    <form onSubmit={handleLogin} className="space-y-4">
                      {/* Inputs e Botão de Login */}
                      <div className="relative">
                        <Mail
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                          size={20}
                        />
                        <input
                          type="email"
                          placeholder="E-mail"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                          required
                        />
                      </div>
                      <div className="relative">
                        <Lock
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                          size={20}
                        />
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="Senha"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                      </div>
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center items-center gap-2 py-2 px-4 border rounded-md text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50"
                      >
                        <LogIn size={18} /> {loading ? "Entrando..." : "Entrar"}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleRegister} className="space-y-4">
                      {/* Inputs e Botão de Cadastro */}
                      <div className="relative">
                        <User
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                          size={20}
                        />
                        <input
                          type="text"
                          placeholder="Nome"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                          required
                        />
                      </div>
                      <div className="relative">
                        <User
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                          size={20}
                        />
                        <input
                          type="text"
                          placeholder="Sobrenome"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                          required
                        />
                      </div>
                      <div className="relative">
                        <Calendar
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                          size={20}
                        />
                        <input
                          type="date"
                          placeholder="Data de Nascimento"
                          value={birthDate}
                          onChange={(e) => setBirthDate(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                          required
                        />
                      </div>
                      <div className="relative">
                        <Phone
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                          size={20}
                        />
                        <input
                          type="tel"
                          placeholder="Telefone (com DDD)"
                          value={phone}
                          onChange={(e) =>
                            setPhone(formatAndLimitPhone(e.target.value))
                          }
                          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                          required
                        />
                      </div>
                      {activeTab === "driver" && (
                        <div className="relative">
                          <Hash
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            size={20}
                          />
                          <input
                            type="text"
                            placeholder="ID de Motorista (fornecido pelo admin)"
                            value={driverId}
                            onChange={(e) => setDriverId(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                            required
                          />
                        </div>
                      )}
                      <div className="relative">
                        <Mail
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                          size={20}
                        />
                        <input
                          type="email"
                          placeholder="E-mail"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                          required
                        />
                      </div>
                      <div className="relative">
                        <Lock
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                          size={20}
                        />
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="Senha (mínimo 6 caracteres)"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                      </div>
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center items-center gap-2 py-2 px-4 border rounded-md text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50"
                      >
                        <UserPlus size={18} />{" "}
                        {loading ? "Cadastrando..." : "Cadastrar"}
                      </button>
                    </form>
                  )}

                  {/* Botões "OU" e Google */}
                  <div className="mt-4 text-center text-sm">
                    <button
                      onClick={() => {
                        setIsLoginView(!isLoginView);
                        setError("");
                        setSuccessMessage("");
                      }}
                      className="font-medium text-orange-600 hover:text-orange-500"
                    >
                      {isLoginView
                        ? "Não tem conta? Cadastre-se"
                        : "Já tem conta? Faça login"}
                    </button>
                  </div>
                  <div className="mt-6 relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">Ou</span>
                    </div>
                  </div>
                  <div className="mt-6">
                    <button
                      onClick={() => handleGoogleSignIn(activeTab)}
                      disabled={loading}
                      className="w-full flex justify-center items-center gap-3 py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <GoogleIcon /> Entrar com o Google
                    </button>
                  </div>
                </div>{" "}
                {/* Fim da div com rolagem */}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
