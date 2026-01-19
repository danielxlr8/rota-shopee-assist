import { getTotalOnlineUsers } from "../hooks/usePresence";

/**
 * Serviço Gatekeeper - Controla o acesso baseado no limite de usuários simultâneos
 */

// Obtém o limite de usuários simultâneos das variáveis de ambiente
const MAX_CONCURRENT_USERS = Number(
  import.meta.env.VITE_MAX_CONCURRENT_USERS || 50
);

/**
 * Verifica se o sistema pode aceitar um novo usuário
 * @returns true se pode aceitar, false se atingiu o limite
 */
export const canAcceptNewUser = async (): Promise<{
  allowed: boolean;
  currentCount: number;
  maxCount: number;
  message?: string;
}> => {
  try {
    const currentCount = await getTotalOnlineUsers();

    // Se o número de usuários online for menor que o limite, permite
    if (currentCount < MAX_CONCURRENT_USERS) {
      return {
        allowed: true,
        currentCount,
        maxCount: MAX_CONCURRENT_USERS,
      };
    }

    // Atingiu o limite
    return {
      allowed: false,
      currentCount,
      maxCount: MAX_CONCURRENT_USERS,
      message: `Servidor cheio. ${currentCount}/${MAX_CONCURRENT_USERS} usuários online. Tente novamente em instantes.`,
    };
  } catch (error) {
    console.error("Erro ao verificar limite de usuários:", error);

    // Em caso de erro, permite o acesso (fail-open)
    // Você pode mudar para fail-closed (bloquear) se preferir
    return {
      allowed: true,
      currentCount: 0,
      maxCount: MAX_CONCURRENT_USERS,
      message:
        "Não foi possível verificar o limite de usuários. Acesso permitido.",
    };
  }
};

/**
 * Verifica se um usuário admin tem permissão especial para bypassar o limite
 * Admins sempre podem acessar mesmo se o servidor estiver cheio
 */
export const canBypassLimit = (userEmail: string): boolean => {
  // Lista de emails de admins que podem bypassar o limite
  const adminEmails = [
    // Adicione aqui os emails dos admins que podem bypassar
    // Ou pode verificar algum campo específico no banco
  ];

  return adminEmails.includes(userEmail);
};

/**
 * Função principal do Gatekeeper - verifica se pode permitir o login
 */
export const checkAccessPermission = async (
  userEmail?: string
): Promise<{
  allowed: boolean;
  reason?: string;
  currentCount?: number;
  maxCount?: number;
}> => {
  // Se for admin com permissão especial, bypassa o limite
  if (userEmail && canBypassLimit(userEmail)) {
    return {
      allowed: true,
      reason: "Admin bypass",
    };
  }

  // Verifica o limite normal
  const result = await canAcceptNewUser();

  if (!result.allowed) {
    return {
      allowed: false,
      reason: result.message,
      currentCount: result.currentCount,
      maxCount: result.maxCount,
    };
  }

  return {
    allowed: true,
    currentCount: result.currentCount,
    maxCount: result.maxCount,
  };
};

/**
 * Obtém estatísticas do servidor em tempo real
 */
export const getServerStats = async () => {
  const currentCount = await getTotalOnlineUsers();

  return {
    currentUsers: currentCount,
    maxUsers: MAX_CONCURRENT_USERS,
    availableSlots: Math.max(0, MAX_CONCURRENT_USERS - currentCount),
    utilizationPercent: Math.round(
      (currentCount / MAX_CONCURRENT_USERS) * 100
    ),
    isFull: currentCount >= MAX_CONCURRENT_USERS,
  };
};
