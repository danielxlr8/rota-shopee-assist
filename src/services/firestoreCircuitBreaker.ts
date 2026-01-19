/**
 * Circuit Breaker para Firestore
 * Protege contra estouros de quota limitando requisições e exibindo avisos amigáveis
 */

interface CircuitBreakerConfig {
  maxRequestsPerMinute: number;
  cooldownPeriod: number; // em ms
  quotaErrorThreshold: number;
}

class FirestoreCircuitBreaker {
  private requestCount = 0;
  private quotaErrorCount = 0;
  private isOpen = false;
  private lastResetTime = Date.now();
  private cooldownEndTime = 0;
  
  private config: CircuitBreakerConfig = {
    maxRequestsPerMinute: 50, // Limite conservador
    cooldownPeriod: 60000, // 1 minuto
    quotaErrorThreshold: 3, // Após 3 erros de quota, abre o circuito
  };

  private listeners: Array<(state: CircuitState) => void> = [];

  constructor(config?: Partial<CircuitBreakerConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
    this.startPeriodicReset();
  }

  private startPeriodicReset() {
    setInterval(() => {
      const now = Date.now();
      if (now - this.lastResetTime >= 60000) {
        this.requestCount = 0;
        this.lastResetTime = now;
      }

      // Verifica se o período de cooldown terminou
      if (this.isOpen && now >= this.cooldownEndTime) {
        this.close();
      }
    }, 1000);
  }

  public canMakeRequest(): boolean {
    // Se o circuito está aberto, não permite requisições
    if (this.isOpen) {
      return false;
    }

    // Verifica se excedeu o limite de requisições por minuto
    if (this.requestCount >= this.config.maxRequestsPerMinute) {
      this.open("Limite de requisições por minuto atingido");
      return false;
    }

    return true;
  }

  public recordRequest() {
    this.requestCount++;
  }

  public recordQuotaError() {
    this.quotaErrorCount++;
    if (this.quotaErrorCount >= this.config.quotaErrorThreshold) {
      this.open("Quota do Firestore excedida");
    }
  }

  public recordSuccess() {
    // Reset de erros em caso de sucesso
    this.quotaErrorCount = Math.max(0, this.quotaErrorCount - 1);
  }

  private open(reason: string) {
    if (!this.isOpen) {
      this.isOpen = true;
      this.cooldownEndTime = Date.now() + this.config.cooldownPeriod;
      console.warn(`Circuit Breaker ABERTO: ${reason}`);
      this.notifyListeners({
        isOpen: true,
        reason,
        cooldownEndsAt: this.cooldownEndTime,
      });
    }
  }

  private close() {
    if (this.isOpen) {
      this.isOpen = false;
      this.quotaErrorCount = 0;
      console.log("Circuit Breaker FECHADO: Sistema normalizado");
      this.notifyListeners({
        isOpen: false,
        reason: null,
        cooldownEndsAt: null,
      });
    }
  }

  public subscribe(listener: (state: CircuitState) => void) {
    this.listeners.push(listener);
    // Retorna função de unsubscribe
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners(state: CircuitState) {
    this.listeners.forEach((listener) => listener(state));
  }

  public getState(): CircuitState {
    return {
      isOpen: this.isOpen,
      reason: this.isOpen ? "Circuit breaker ativado" : null,
      cooldownEndsAt: this.isOpen ? this.cooldownEndTime : null,
    };
  }

  public getRemainingCooldownTime(): number {
    if (!this.isOpen) return 0;
    return Math.max(0, this.cooldownEndTime - Date.now());
  }
}

export interface CircuitState {
  isOpen: boolean;
  reason: string | null;
  cooldownEndsAt: number | null;
}

// Singleton global
export const firestoreCircuitBreaker = new FirestoreCircuitBreaker();
