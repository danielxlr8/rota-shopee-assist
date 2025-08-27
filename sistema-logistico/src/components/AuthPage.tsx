import React, { useState } from "react";
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
} from "lucide-react";
import spxLogo from "/spx-logo.png";

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

  const formatAndLimitPhone = (value: string) => {
    let digits = value.replace(/\D/g, "");
    digits = digits.slice(0, 11);
    if (digits.length > 2) {
      digits = `(${digits.substring(0, 2)}) ${digits.substring(2)}`;
    }
    if (digits.length > 9) {
      digits = `${digits.substring(0, 9)}-${digits.substring(9)}`;
    }
    return digits;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMessage("");

    // CORREÇÃO: Validação de domínio por aba
    if (activeTab === "driver" && email.endsWith("@shopee.com")) {
      setError("Contas @shopee.com devem fazer login na aba de Admin.");
      setLoading(false);
      return;
    }
    if (activeTab === "admin" && !email.endsWith("@shopee.com")) {
      setError("Apenas contas @shopee.com podem fazer login como Admin.");
      setLoading(false);
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      // CORREÇÃO: Forçar verificação de e-mail para admins
      if (activeTab === "admin" && !userCredential.user.emailVerified) {
        setError("Por favor, verifique seu e-mail antes de fazer o login.");
        await signOut(auth); // Desloga para impedir acesso temporário
        setLoading(false);
        return;
      }
    } catch (err: any) {
      setError("Falha ao entrar. Verifique seu e-mail e senha.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMessage("");

    // CORREÇÃO: Validação de domínio por aba no cadastro
    if (activeTab === "driver" && email.endsWith("@shopee.com")) {
      setError("Contas @shopee.com devem se registrar como Admin.");
      setLoading(false);
      return;
    }
    if (activeTab === "admin" && !email.endsWith("@shopee.com")) {
      setError("Cadastro de admin permitido apenas para e-mails @shopee.com.");
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
          setError("ID de Motorista inválido ou já cadastrado.");
          await user.delete(); // Deleta o usuário criado no Auth se a validação falhar
          setLoading(false);
          return;
        }

        await updateDoc(driverDocRef, {
          name: `${name} ${lastName}`,
          phone: phone.replace(/\D/g, ""),
          birthDate,
          email,
          uid: user.uid,
        });
        // Após o cadastro, o App.tsx cuidará do login automático
      } else {
        // Cadastro de Admin
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

        // CORREÇÃO: Não desloga, apenas mostra a mensagem e volta para a tela de login
        setSuccessMessage(
          "Conta criada! Um e-mail de verificação foi enviado. Por favor, confirme seu e-mail antes de fazer o login."
        );
        setIsLoginView(true); // Muda para a tela de login
      }
    } catch (err: any) {
      setError(
        err.code === "auth/email-already-in-use"
          ? "Este e-mail já está em uso."
          : "Falha ao criar a conta."
      );
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

      if (role === "admin") {
        if (!user.email?.endsWith("@shopee.com")) {
          setError("Acesso restrito a contas @shopee.com.");
          await signOut(auth);
        }
      } else {
        // role === 'driver'
        if (user.email?.endsWith("@shopee.com")) {
          setError("Contas @shopee.com devem fazer login na aba de Admin.");
          await signOut(auth);
          setLoading(false);
          return;
        }
        const driversRef = collection(db, "motoristas_pre_aprovados");
        const q = query(driversRef, where("googleUid", "==", user.uid));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          setGoogleUser(user);
          setIsLinkingGoogleAccount(true);
        }
      }
    } catch (err: any) {
      setError("Falha ao entrar com o Google.");
    } finally {
      setLoading(false);
    }
  };

  const handleLinkAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLinkingError("");

    if (!driverId.trim()) {
      setLinkingError("Por favor, insira seu ID de motorista.");
      setLoading(false);
      return;
    }

    try {
      const driverDocRef = doc(db, "motoristas_pre_aprovados", driverId.trim());
      const driverDoc = await getDoc(driverDocRef);

      if (!driverDoc.exists()) {
        setLinkingError("ID de motorista não encontrado.");
        setLoading(false);
        return;
      }

      const driverData = driverDoc.data();
      if (driverData.googleUid || driverData.uid) {
        setLinkingError(
          "Este ID de motorista já está vinculado a outra conta."
        );
        setLoading(false);
        return;
      }

      await updateDoc(driverDoc.ref, {
        googleUid: googleUser.uid,
        email: googleUser.email,
        name: driverData.name || googleUser.displayName,
        avatar: driverData.avatar || googleUser.photoURL,
      });

      setIsLinkingGoogleAccount(false);
      setGoogleUser(null);
    } catch (err) {
      setLinkingError("Ocorreu um erro ao vincular a conta.");
    } finally {
      setLoading(false);
    }
  };

  if (isLinkingGoogleAccount) {
    return (
      <div
        className="relative min-h-screen bg-cover bg-center"
        style={{ backgroundImage: `url(/SP3.jpg)` }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-50" />
        <div className="relative flex items-center justify-center min-h-screen p-4">
          <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
              Vincular Conta Google
            </h2>
            <p className="text-center text-gray-600 mb-6">
              Insira seu ID de motorista para vincularmos à sua conta Google.
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
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                  placeholder="Seu ID único"
                  required
                />
              </div>
              {linkingError && (
                <p className="text-sm text-red-600">{linkingError}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700"
              >
                {loading ? "Verificando..." : "Vincular Conta"}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative min-h-screen bg-cover bg-center"
      style={{ backgroundImage: `url(/SP3.jpg)` }}
    >
      <div className="absolute inset-0 bg-black bg-opacity-50" />
      <div className="relative flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <img src={spxLogo} alt="SPX Logo" className="w-32 mx-auto" />
            <h1 className="text-3xl font-bold text-white mt-4">
              Sistema de Apoio
            </h1>
          </div>

          <div className="bg-white rounded-lg shadow-md">
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab("driver")}
                className={`flex-1 py-3 font-semibold text-center transition-colors ${
                  activeTab === "driver"
                    ? "text-orange-600 border-b-2 border-orange-600"
                    : "text-gray-500"
                }`}
              >
                <User className="inline-block mr-2" size={18} />
                Motorista
              </button>
              <button
                onClick={() => setActiveTab("admin")}
                className={`flex-1 py-3 font-semibold text-center transition-colors ${
                  activeTab === "admin"
                    ? "text-orange-600 border-b-2 border-orange-600"
                    : "text-gray-500"
                }`}
              >
                <Briefcase className="inline-block mr-2" size={18} />
                Admin
              </button>
            </div>

            <div className="p-8">
              <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
                {isLoginView ? "Login de" : "Cadastro de"}{" "}
                {activeTab === "admin" ? "Administrador" : "Motorista"}
              </h2>

              {error && (
                <p className="text-sm text-center text-red-600 mb-4">{error}</p>
              )}
              {successMessage && (
                <p className="text-sm text-center text-green-600 mb-4">
                  {successMessage}
                </p>
              )}

              {isLoginView ? (
                <form onSubmit={handleLogin} className="space-y-4">
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
                      className="w-full pl-10 pr-4 py-2 border rounded-lg"
                      required
                    />
                  </div>
                  <div className="relative">
                    <Lock
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={20}
                    />
                    <input
                      type="password"
                      placeholder="Senha"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border rounded-lg"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center items-center gap-2 py-2 px-4 border rounded-md text-white bg-orange-600 hover:bg-orange-700"
                  >
                    <LogIn size={18} />
                    {loading ? "Entrando..." : "Entrar"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="space-y-4">
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
                      className="w-full pl-10 pr-4 py-2 border rounded-lg"
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
                      className="w-full pl-10 pr-4 py-2 border rounded-lg"
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
                      className="w-full pl-10 pr-4 py-2 border rounded-lg"
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
                      className="w-full pl-10 pr-4 py-2 border rounded-lg"
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
                        className="w-full pl-10 pr-4 py-2 border rounded-lg"
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
                      className="w-full pl-10 pr-4 py-2 border rounded-lg"
                      required
                    />
                  </div>
                  <div className="relative">
                    <Lock
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={20}
                    />
                    <input
                      type="password"
                      placeholder="Senha (mínimo 6 caracteres)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border rounded-lg"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center items-center gap-2 py-2 px-4 border rounded-md text-white bg-orange-600 hover:bg-orange-700"
                  >
                    <UserPlus size={18} />
                    {loading ? "Cadastrando..." : "Cadastrar"}
                  </button>
                </form>
              )}

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
                    ? "Não tem uma conta? Cadastre-se"
                    : "Já tem uma conta? Faça login"}
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
                  className="w-full flex justify-center items-center gap-3 py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <GoogleIcon />
                  Entrar com o Google
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
