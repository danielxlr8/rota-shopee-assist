import React, { useState } from "react";
import {
  Lock,
  Mail,
  User,
  Phone,
  ShieldCheck,
  Briefcase,
  UserCheck,
} from "lucide-react";
import { auth, db } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

// Numa aplicação real, esta lista viria do seu banco de dados (ex: Firestore)
const validDriverIDs = [
  "1419969",
  "ID-002",
  "ID-003",
  "ID-004",
  "ID-005",
  // ADICIONE O SEU ID DE TESTE AQUI. Ex: 'MEU-ID-TESTE'
];

export const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<"driver" | "admin">("driver");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        // O App.tsx irá redirecionar automaticamente após o login
      } else {
        // Lógica de Cadastro
        const name = formData.get("name") as string;

        if (role === "admin") {
          if (!email.endsWith("@shopee.com")) {
            throw new Error(
              "Cadastro de admin permitido apenas para e-mails @shopee.com."
            );
          }
        } else {
          // Cadastro de Motorista
          const phone = formData.get("phone") as string;
          const driverId = formData.get("driverId") as string;

          if (!validDriverIDs.includes(driverId)) {
            throw new Error("ID de motorista inválido ou não encontrado.");
          }
          // Futuramente: verificar se o ID já foi usado
        }

        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        const user = userCredential.user;

        // Atualiza o perfil do Firebase Auth com o nome
        await updateProfile(user, { displayName: name });

        // Salva informações adicionais no Firestore
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          name,
          email,
          role,
          phone: role === "driver" ? formData.get("phone") : null,
          driverId: role === "driver" ? formData.get("driverId") : null,
        });
      }
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-orange-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-xl">
        <div className="text-center">
          <img
            src="/shopee-logo.png"
            alt="Logótipo da Shopee"
            className="w-24 h-24 mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-gray-800">
            {isLogin ? "Bem-vindo de Volta!" : "Crie a sua Conta"}
          </h1>
          <p className="text-gray-500">
            {isLogin
              ? "Faça login para aceder ao painel."
              : "Registe-se para começar."}
          </p>
        </div>

        {!isLogin && (
          <div className="flex justify-center bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setRole("driver")}
              className={`w-1/2 py-2 text-sm font-semibold rounded-md transition-colors ${
                role === "driver" ? "bg-orange-600 text-white" : "text-gray-600"
              }`}
            >
              Sou Motorista
            </button>
            <button
              onClick={() => setRole("admin")}
              className={`w-1/2 py-2 text-sm font-semibold rounded-md transition-colors ${
                role === "admin" ? "bg-orange-600 text-white" : "text-gray-600"
              }`}
            >
              Sou Admin
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  name="name"
                  type="text"
                  placeholder="Nome Completo"
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>
              {role === "driver" && (
                <>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      name="phone"
                      type="tel"
                      placeholder="Telefone"
                      className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      required
                    />
                  </div>
                  <div className="relative">
                    <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      name="driverId"
                      type="text"
                      placeholder="ID de Motorista"
                      className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      required
                    />
                  </div>
                </>
              )}
            </>
          )}

          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              name="email"
              type="email"
              placeholder="E-mail"
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              name="password"
              type="password"
              placeholder="Senha (mínimo 6 caracteres)"
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>

          {error && <p className="text-sm text-red-600 text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 text-white bg-orange-600 rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors disabled:bg-orange-300"
          >
            {loading ? "A processar..." : isLogin ? "Entrar" : "Cadastrar"}
          </button>
        </form>

        <div className="text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-orange-600 hover:underline"
          >
            {isLogin
              ? "Não tem uma conta? Cadastre-se"
              : "Já tem uma conta? Faça login"}
          </button>
        </div>
      </div>
    </div>
  );
};
