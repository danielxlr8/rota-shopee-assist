/**
 * Sistema de Cache para Firestore
 * Implementa cache-first com TTL para evitar leituras desnecessárias
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class FirestoreCache {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutos padrão

  /**
   * Armazena dados no cache com TTL customizável
   */
  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    });
  }

  /**
   * Recupera dados do cache se ainda estiverem válidos
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    const age = Date.now() - entry.timestamp;
    
    // Se expirou, remove do cache
    if (age > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Verifica se o cache tem dados válidos para uma chave
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Invalida (remove) uma entrada do cache
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalida todas as entradas que começam com um prefixo
   */
  invalidateByPrefix(prefix: string): void {
    const keysToDelete: string[] = [];
    
    this.cache.forEach((_, key) => {
      if (key.startsWith(prefix)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  /**
   * Limpa todo o cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Remove entradas expiradas do cache
   */
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  /**
   * Retorna estatísticas do cache
   */
  getStats() {
    let validEntries = 0;
    let expiredEntries = 0;
    const now = Date.now();

    this.cache.forEach((entry) => {
      if (now - entry.timestamp <= entry.ttl) {
        validEntries++;
      } else {
        expiredEntries++;
      }
    });

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
    };
  }
}

// Singleton global
export const firestoreCache = new FirestoreCache();

// Executa limpeza automática a cada 10 minutos
setInterval(() => {
  firestoreCache.cleanup();
}, 10 * 60 * 1000);
