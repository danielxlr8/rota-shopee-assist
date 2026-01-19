import { useEffect, useRef, useState } from "react";
import { realtimeDb } from "../firebase";
import {
  ref,
  onValue,
  set,
  onDisconnect,
  serverTimestamp,
  remove,
} from "firebase/database";

interface PresenceData {
  uid: string;
  userType: "driver" | "admin";
  name: string;
  email: string;
  online: boolean;
  lastSeen: any;
  connectedAt: any;
}

/**
 * Hook para gerenciar presença de usuário em tempo real
 * Usa Firebase Realtime Database para economizar leituras do Firestore
 *
 * @param uid - ID único do usuário
 * @param userType - Tipo de usuário (driver ou admin)
 * @param userData - Dados do usuário (nome, email)
 * @param enabled - Se true, ativa o rastreamento de presença
 */
export const usePresence = (
  uid: string | null,
  userType: "driver" | "admin",
  userData: { name: string; email: string } | null,
  enabled: boolean = true
) => {
  const presenceRef = useRef<any>(null);
  const connectedListenerRef = useRef<(() => void) | null>(null);
  const isConfiguredRef = useRef(false);

  useEffect(() => {
    // Se não tiver UID, dados do usuário ou estiver desabilitado, não faz nada
    if (!uid || !userData || !enabled) {
      return;
    }

    if (!realtimeDb) {
      console.error("❌ usePresence: Realtime Database não disponível!");
      return;
    }

    // Evitar configurações duplicadas
    if (isConfiguredRef.current) {
      return;
    }

    isConfiguredRef.current = true;
    console.log("✅ Configurando presença para:", userData.name);

    // Referência para o nó de presença do usuário
    const userPresenceRef = ref(realtimeDb, `presence/${uid}`);
    presenceRef.current = userPresenceRef;

    // Referência para o nó de conexão especial do Firebase
    const connectedRef = ref(realtimeDb, ".info/connected");

    // Monitora o status de conexão
    const unsubscribe = onValue(connectedRef, async (snapshot) => {
      if (snapshot.val() === true) {
        // Usuário está conectado

        // Configurar o que fazer ao desconectar (antes de definir online)
        const disconnectRef = onDisconnect(userPresenceRef);

        try {
          // Quando desconectar, atualiza para offline e salva timestamp
          await disconnectRef.set({
            uid,
            userType,
            name: userData.name,
            email: userData.email,
            online: false,
            lastSeen: serverTimestamp(),
            connectedAt: null,
          } as PresenceData);

          // Agora define como online
          const presenceData = {
            uid,
            userType,
            name: userData.name,
            email: userData.email,
            online: true,
            lastSeen: serverTimestamp(),
            connectedAt: serverTimestamp(),
          } as PresenceData;

          await set(userPresenceRef, presenceData);

          console.log("✅ Presença ativada com sucesso:", {
            uid,
            userType,
            name: userData.name,
            online: true
          });
        } catch (error) {
          console.error("❌ Erro ao configurar presença:", error);
        }
      }
    });

    connectedListenerRef.current = unsubscribe;

    // Cleanup ao desmontar o componente
    return () => {
      isConfiguredRef.current = false;
      
      if (connectedListenerRef.current) {
        connectedListenerRef.current();
        connectedListenerRef.current = null;
      }

      // Remove a presença ao desmontar
      if (presenceRef.current) {
        set(presenceRef.current, {
          uid,
          userType,
          name: userData.name,
          email: userData.email,
          online: false,
          lastSeen: serverTimestamp(),
          connectedAt: null,
        } as PresenceData).catch(console.error);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, enabled]);
};

/**
 * Hook para monitorar usuários online em tempo real
 * Usado no Dashboard Admin para ver quantos usuários estão conectados
 *
 * @returns Objeto com contadores de usuários online
 */
export const useOnlineUsers = () => {
  const [onlineUsers, setOnlineUsers] = useState<{
    drivers: number;
    admins: number;
    total: number;
    users: PresenceData[];
  }>({
    drivers: 0,
    admins: 0,
    total: 0,
    users: [],
  });

  useEffect(() => {
    console.log("🔹 useOnlineUsers - Montando listener...");
    
    if (!realtimeDb) {
      console.error("❌ useOnlineUsers: realtimeDb é null!");
      return;
    }

    console.log("✅ realtimeDb OK, criando listener na rota 'presence'");
    const presenceRef = ref(realtimeDb, "presence");

    const unsubscribe = onValue(presenceRef, (snapshot) => {
      const data = snapshot.val();
      console.log("📊 Dados brutos do Firebase:", data);

      if (!data) {
        console.log("⚠️ Nenhum dado de presença encontrado");
        setOnlineUsers({ drivers: 0, admins: 0, total: 0, users: [] });
        return;
      }

      const users: PresenceData[] = Object.values(data);
      console.log("👥 Todos os usuários:", users);
      
      const onlineUsersList = users.filter((user) => user.online);
      console.log("✅ Usuários online:", onlineUsersList);

      const driversCount = onlineUsersList.filter(
        (u) => u.userType === "driver"
      ).length;
      const adminsCount = onlineUsersList.filter(
        (u) => u.userType === "admin"
      ).length;

      console.log("📈 Contadores finais:", {
        drivers: driversCount,
        admins: adminsCount,
        total: onlineUsersList.length
      });

      setOnlineUsers({
        drivers: driversCount,
        admins: adminsCount,
        total: onlineUsersList.length,
        users: onlineUsersList,
      });
    });

    return () => unsubscribe();
  }, []);

  return onlineUsers;
};

/**
 * Função auxiliar para obter o total de usuários online
 * Usada no Gatekeeper para verificar se pode permitir novo login
 * Implementa timeout de 5 segundos para evitar travamentos
 */
export const getTotalOnlineUsers = async (): Promise<number> => {
  if (!realtimeDb) return 0;

  return new Promise((resolve) => {
    const presenceRef = ref(realtimeDb, "presence");
    let hasResolved = false;

    // Timeout de 5 segundos - se não responder, retorna 0 (permite acesso)
    const timeoutId = setTimeout(() => {
      if (!hasResolved) {
        hasResolved = true;
        console.warn("⏱️ Timeout ao verificar usuários online. Permitindo acesso.");
        resolve(0);
      }
    }, 5000);

    // Usa once para ler apenas uma vez (mais eficiente)
    onValue(
      presenceRef,
      (snapshot) => {
        if (hasResolved) return;
        
        hasResolved = true;
        clearTimeout(timeoutId);

        const data = snapshot.val();

        if (!data) {
          resolve(0);
          return;
        }

        const users: PresenceData[] = Object.values(data);
        const onlineCount = users.filter((user) => user.online).length;

        resolve(onlineCount);
      },
      (error) => {
        // Em caso de erro, permite o acesso (fail-open)
        if (hasResolved) return;
        
        hasResolved = true;
        clearTimeout(timeoutId);
        console.error("❌ Erro ao verificar usuários online:", error);
        resolve(0);
      },
      { onlyOnce: true }
    );
  });
};
