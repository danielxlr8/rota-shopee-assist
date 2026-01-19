/**
 * Serviço de Gerenciamento de Sessões de Usuários
 * Controla o número de usuários simultâneos para evitar sobrecarga
 */

import { db } from "../firebase";
import {
  collection,
  doc,
  setDoc,
  onSnapshot,
  deleteDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  Timestamp,
} from "firebase/firestore";

interface OnlineUser {
  uid: string;
  role: "admin" | "driver";
  name: string;
  lastActivity: Timestamp;
  sessionId: string;
}

class SessionManager {
  private maxSimultaneousUsers = 100; // Limite de usuários simultâneos
  private sessionId: string | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private listeners: Array<(stats: SessionStats) => void> = [];
  private currentStats: SessionStats = {
    totalOnline: 0,
    adminsOnline: 0,
    driversOnline: 0,
    isLimitReached: false,
  };

  constructor() {
    // Gera ID único para esta sessão
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Registra um usuário como online
   */
  async registerUser(
    uid: string,
    role: "admin" | "driver",
    name: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Verifica se já atingiu o limite
      const stats = await this.getCurrentStats();
      
      if (stats.totalOnline >= this.maxSimultaneousUsers) {
        return {
          success: false,
          error: "LIMIT_REACHED",
        };
      }

      // Registra sessão
      const sessionRef = doc(db, "online_sessions", `${uid}_${this.sessionId}`);
      
      await setDoc(sessionRef, {
        uid,
        role,
        name,
        sessionId: this.sessionId,
        lastActivity: serverTimestamp(),
        connectedAt: serverTimestamp(),
      });

      // Inicia heartbeat
      this.startHeartbeat(uid);

      // Monitora estatísticas
      this.monitorStats();

      return { success: true };
    } catch (error) {
      console.error("Erro ao registrar sessão:", error);
      return {
        success: false,
        error: "REGISTRATION_ERROR",
      };
    }
  }

  /**
   * Atualiza heartbeat do usuário
   */
  private startHeartbeat(uid: string) {
    // Limpa heartbeat anterior se existir
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    // Atualiza a cada 30 segundos
    this.heartbeatInterval = setInterval(async () => {
      try {
        const sessionRef = doc(db, "online_sessions", `${uid}_${this.sessionId}`);
        await setDoc(
          sessionRef,
          {
            lastActivity: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (error) {
        console.error("Erro no heartbeat:", error);
      }
    }, 30000); // 30 segundos
  }

  /**
   * Remove usuário (logout ou inatividade)
   */
  async unregisterUser(uid: string) {
    try {
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = null;
      }

      const sessionRef = doc(db, "online_sessions", `${uid}_${this.sessionId}`);
      await deleteDoc(sessionRef);
    } catch (error) {
      console.error("Erro ao remover sessão:", error);
    }
  }

  /**
   * Obtém estatísticas atuais
   */
  private async getCurrentStats(): Promise<SessionStats> {
    try {
      const sessionsRef = collection(db, "online_sessions");
      const snapshot = await getDocs(sessionsRef);

      // Remove sessões expiradas (mais de 2 minutos sem atividade)
      const now = Date.now();
      const twoMinutesAgo = now - 2 * 60 * 1000;

      let adminsOnline = 0;
      let driversOnline = 0;

      const cleanupPromises: Promise<void>[] = [];

      snapshot.docs.forEach((doc) => {
        const data = doc.data() as OnlineUser;
        const lastActivity = data.lastActivity?.toMillis() || 0;

        if (lastActivity < twoMinutesAgo) {
          // Sessão expirada, remove
          cleanupPromises.push(deleteDoc(doc.ref));
        } else {
          // Sessão ativa, conta
          if (data.role === "admin") {
            adminsOnline++;
          } else {
            driversOnline++;
          }
        }
      });

      // Executa limpeza em background
      if (cleanupPromises.length > 0) {
        Promise.all(cleanupPromises).catch((error) =>
          console.error("Erro na limpeza de sessões:", error)
        );
      }

      const totalOnline = adminsOnline + driversOnline;

      return {
        totalOnline,
        adminsOnline,
        driversOnline,
        isLimitReached: totalOnline >= this.maxSimultaneousUsers,
      };
    } catch (error) {
      console.error("Erro ao obter stats:", error);
      return this.currentStats;
    }
  }

  /**
   * Monitora estatísticas em tempo real
   */
  private monitorStats() {
    const sessionsRef = collection(db, "online_sessions");
    
    onSnapshot(sessionsRef, (snapshot) => {
      const now = Date.now();
      const twoMinutesAgo = now - 2 * 60 * 1000;

      let adminsOnline = 0;
      let driversOnline = 0;

      snapshot.docs.forEach((doc) => {
        const data = doc.data() as OnlineUser;
        const lastActivity = data.lastActivity?.toMillis() || 0;

        if (lastActivity >= twoMinutesAgo) {
          if (data.role === "admin") {
            adminsOnline++;
          } else {
            driversOnline++;
          }
        }
      });

      const totalOnline = adminsOnline + driversOnline;

      this.currentStats = {
        totalOnline,
        adminsOnline,
        driversOnline,
        isLimitReached: totalOnline >= this.maxSimultaneousUsers,
      };

      // Notifica listeners
      this.notifyListeners();
    });
  }

  /**
   * Inscreve-se para receber atualizações de estatísticas
   */
  subscribe(listener: (stats: SessionStats) => void) {
    this.listeners.push(listener);
    // Envia stats atuais imediatamente
    listener(this.currentStats);
    
    // Retorna função de unsubscribe
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.currentStats));
  }

  /**
   * Obtém stats atuais sem assinar
   */
  getStats(): SessionStats {
    return this.currentStats;
  }
}

export interface SessionStats {
  totalOnline: number;
  adminsOnline: number;
  driversOnline: number;
  isLimitReached: boolean;
}

// Singleton global
export const sessionManager = new SessionManager();

// Cleanup ao fechar página
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    const uid = sessionStorage.getItem("user_uid");
    if (uid) {
      sessionManager.unregisterUser(uid);
    }
  });
}
