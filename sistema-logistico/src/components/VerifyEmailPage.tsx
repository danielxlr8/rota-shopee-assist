import React, { useState, useEffect } from "react";
import { auth } from "../firebase";
import { signOut, sendEmailVerification, User } from "firebase/auth";
import spxLogo from "/spx-logo.png"; // Garanta que o caminho para o logo está correto

interface VerifyEmailPageProps {
  user: User;
}

export const VerifyEmailPage: React.FC<VerifyEmailPageProps> = ({ user }) => {
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleResendEmail = async () => {
    if (!user || countdown > 0) return;
    setIsSending(true);
    setSendSuccess("");
    try {
      await sendEmailVerification(user);
      setSendSuccess("Um novo e-mail de verificação foi enviado!");
      setCountdown(30);
    } catch (error) {
      console.error("Erro ao reenviar e-mail de verificação:", error);
    } finally {
      setIsSending(false);
    }
  };

  // CORREÇÃO: Função de logout com recarregamento forçado da página.
  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut(auth);
      // Força o recarregamento da página para garantir que o estado de autenticação
      // seja reavaliado e o usuário seja redirecionado para a tela de login.
      window.location.reload();
    } catch (error) {
      console.error("Erro ao sair:", error);
      // Se houver um erro, reabilita o botão para o usuário tentar novamente.
      setIsSigningOut(false);
    }
  };

  return (
    <div
      className="relative min-h-screen bg-cover bg-center flex items-center justify-center p-4"
      style={{ backgroundImage: `url(/SP3.jpg)` }}
    >
      <div className="absolute inset-0 bg-black bg-opacity-50" />
      <div className="relative w-full max-w-md bg-white rounded-lg shadow-md p-8 text-center">
        <img src={spxLogo} alt="SPX Logo" className="w-24 mx-auto mb-6" />
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          Confirme seu E-mail
        </h1>
        <p className="text-gray-600 mb-6">
          Enviamos um link de confirmação para o seu e-mail: <br />
          <strong className="text-gray-800">{user.email}</strong>
        </p>
        <p className="text-gray-600 mb-6">
          Por favor, clique no link para ativar sua conta. Após a confirmação,
          recarregue esta página para acessar o painel.
        </p>

        {sendSuccess && <p className="text-green-600 mb-4">{sendSuccess}</p>}

        <div className="space-y-4">
          <button
            onClick={handleResendEmail}
            disabled={isSending || countdown > 0}
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 disabled:cursor-not-allowed transition-colors"
          >
            {isSending
              ? "Enviando..."
              : countdown > 0
              ? `Aguarde ${countdown}s para reenviar`
              : "Reenviar E-mail de Confirmação"}
          </button>
          <button
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-200 disabled:cursor-not-allowed"
          >
            {isSigningOut ? "Saindo..." : "Sair"}
          </button>
        </div>
      </div>
    </div>
  );
};
