import { useState } from "react";
import { auth, db } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

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

    if (isLogin) {
      // --- LÓGICA DE LOGIN ---
      try {
        await signInWithEmailAndPassword(auth, email, password);
        // O redirecionamento será tratado pelo App.tsx
      } catch (err: any) {
        setError("Falha ao fazer login. Verifique seu e-mail e senha.");
        console.error("Erro de login:", err);
      }
    } else {
      // --- LÓGICA DE CADASTRO ---
      const fullName = formData.get("fullName") as string;
      const phone = formData.get("phone") as string;

      try {
        // Lógica de verificação movida para dentro do bloco try
        if (role === "driver") {
          const driverId = formData.get("driverId") as string;
          // Verifica se o campo ID do motorista foi preenchido
          if (!driverId) {
            setError("Por favor, insira seu ID de Motorista.");
            setLoading(false);
            return;
          }
          const preApprovedDocRef = doc(
            db,
            "motoristas_pre_aprovados",
            driverId
          );
          const preApprovedDocSnap = await getDoc(preApprovedDocRef);

          if (!preApprovedDocSnap.exists()) {
            setError(
              "ID de Motorista inválido ou não autorizado para cadastro."
            );
            setLoading(false);
            return;
          }
        } else if (role === "admin") {
          // Verificação para Admin usando o e-mail
          const preApprovedAdminRef = doc(db, "admins_pre_aprovados", email);
          const preApprovedAdminSnap = await getDoc(preApprovedAdminRef);

          if (!preApprovedAdminSnap.exists()) {
            setError("E-mail não autorizado para cadastro de administrador.");
            setLoading(false);
            return;
          }
        }

        // Se a verificação passar, prosseguir com a criação da conta
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        const user = userCredential.user;

        // Salvar as informações do novo usuário na coleção 'users'
        await setDoc(doc(db, "users", user.uid), {
          role: role,
          name: fullName,
          email: user.email,
          phone: phone,
          // Adiciona driverId apenas se for um motorista
          ...(role === "driver" && {
            driverId: formData.get("driverId") as string,
          }),
        });

        // Se for um motorista, criar também o perfil na coleção 'drivers'
        if (role === "driver") {
          await setDoc(doc(db, "drivers", user.uid), {
            name: fullName,
            phone: phone,
            driverId: formData.get("driverId") as string,
            status: "INDISPONIVEL", // Status inicial
            avatar: `https://i.pravatar.cc/150?u=${user.uid}`,
            initials: fullName
              ? fullName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
              : "D",
          });
        }
      } catch (err: any) {
        if (err.code === "auth/email-already-in-use") {
          setError("Este e-mail já está em uso.");
        } else {
          setError("Ocorreu um erro ao criar a conta.");
        }
        console.error("Erro de cadastro:", err);
      }
    }
    setLoading(false);
  };

  return (
    <div
      className="flex items-center justify-center min-h-screen bg-cover bg-center"
      style={{ backgroundImage: "url('/SP3.jpg')" }}
    >
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md bg-opacity-90 backdrop-blur-sm">
        <div className="text-center">
          <img
            src="/spx-logo.png"
            alt="Logótipo da Shopee"
            className="w-24 h-auto mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-gray-800">
            {isLogin ? "Faça seu login" : "Crie a sua Conta"}
          </h1>
          <p className="text-gray-500">
            {isLogin ? "Bem-vindo de volta!" : "Registe-se para começar."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              {/* Seletor de Função */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-gray-200 rounded-md">
                <button
                  type="button"
                  onClick={() => setRole("driver")}
                  className={`px-4 py-2 text-sm font-semibold rounded ${
                    role === "driver"
                      ? "bg-orange-600 text-white"
                      : "text-gray-600"
                  }`}
                >
                  Sou Motorista
                </button>
                <button
                  type="button"
                  onClick={() => setRole("admin")}
                  className={`px-4 py-2 text-sm font-semibold rounded ${
                    role === "admin"
                      ? "bg-orange-600 text-white"
                      : "text-gray-600"
                  }`}
                >
                  Sou Admin
                </button>
              </div>

              {/* Campos de Cadastro */}
              <input
                name="fullName"
                type="text"
                placeholder="Nome Completo"
                required
                className="w-full px-4 py-2 border rounded-md"
              />
              <input
                name="phone"
                type="tel"
                placeholder="Telefone"
                required
                className="w-full px-4 py-2 border rounded-md"
              />
              {role === "driver" && (
                <input
                  name="driverId"
                  type="text"
                  placeholder="ID de Motorista"
                  required
                  className="w-full px-4 py-2 border rounded-md"
                />
              )}
            </>
          )}

          {/* Campos Comuns */}
          <input
            name="email"
            type="email"
            placeholder="E-mail"
            required
            className="w-full px-4 py-2 border rounded-md"
          />
          <input
            name="password"
            type="password"
            placeholder="Senha"
            required
            className="w-full px-4 py-2 border rounded-md"
          />

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 text-white bg-orange-600 rounded-md hover:bg-orange-700 disabled:bg-orange-300"
          >
            {loading ? "A processar..." : isLogin ? "Login" : "Cadastrar"}
          </button>
        </form>

        <p className="text-sm text-center text-gray-600">
          {isLogin ? "Não tem uma conta?" : "Já tem uma conta?"}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
            }}
            className="ml-1 font-semibold text-orange-600 hover:underline"
          >
            {isLogin ? "Registe-se" : "Faça login"}
          </button>
        </p>
      </div>
    </div>
  );
};
