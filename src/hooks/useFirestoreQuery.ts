/**
 * Hook simplificado para queries do Firestore
 * Leve, rápido e confiável - sem complexidade desnecessária
 */

import { useState, useEffect } from "react";
import {
  collection,
  query,
  getDocs,
  QueryConstraint,
  DocumentData,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "../firebase";

interface UseFirestoreQueryOptions {
  collectionName: string;
  constraints?: QueryConstraint[];
  orderByField?: string;
  orderDirection?: "asc" | "desc";
  limitCount?: number;
  enableCache?: boolean;
  cacheDuration?: number; // em milissegundos
}

// Cache simples em memória
const queryCache = new Map<string, { data: any[]; timestamp: number }>();

export function useFirestoreQuery<T extends DocumentData>(
  options: UseFirestoreQueryOptions
) {
  const {
    collectionName,
    constraints = [],
    orderByField,
    orderDirection = "desc",
    limitCount = 100,
    enableCache = true,
    cacheDuration = 2 * 60 * 1000, // 2 minutos padrão
  } = options;

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Gera chave única para o cache baseada nos parâmetros
  const cacheKey = JSON.stringify({
    collectionName,
    orderByField,
    orderDirection,
    limitCount,
    constraints: constraints.length,
  });

  const fetchData = async () => {
    try {
      // Verifica cache primeiro
      if (enableCache) {
        const cached = queryCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < cacheDuration) {
          console.log(`✅ Cache hit: ${collectionName}`);
          setData(cached.data);
          setLoading(false);
          return;
        }
      }

      setLoading(true);
      setError(null);

      console.log(`🔄 Buscando dados: ${collectionName}`);

      // Constrói a query
      const queryConstraints: QueryConstraint[] = [...constraints];

      if (orderByField) {
        queryConstraints.push(orderBy(orderByField, orderDirection));
      }

      if (limitCount) {
        queryConstraints.push(limit(limitCount));
      }

      const q = query(collection(db, collectionName), ...queryConstraints);

      // Timeout de 10 segundos
      const fetchPromise = getDocs(q);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Timeout ao buscar dados")), 10000)
      );

      const snapshot = await Promise.race([fetchPromise, timeoutPromise]);

      const fetchedData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as T[];

      console.log(`✅ Dados carregados: ${collectionName} (${fetchedData.length} itens)`);

      setData(fetchedData);

      // Salva no cache
      if (enableCache) {
        queryCache.set(cacheKey, {
          data: fetchedData,
          timestamp: Date.now(),
        });
      }

      setLoading(false);
    } catch (err) {
      console.error(`❌ Erro ao buscar ${collectionName}:`, err);
      setError(err instanceof Error ? err.message : "Erro desconhecido");
      setLoading(false);
    }
  };

  const refresh = () => {
    // Limpa o cache e recarrega
    queryCache.delete(cacheKey);
    fetchData();
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionName, orderByField, orderDirection, limitCount]);

  return {
    data,
    loading,
    error,
    refresh,
  };
}

// Função auxiliar para limpar todo o cache
export const clearQueryCache = () => {
  queryCache.clear();
  console.log("🗑️ Cache limpo");
};

// Função auxiliar para limpar cache de uma collection específica
export const clearCollectionCache = (collectionName: string) => {
  const keysToDelete: string[] = [];
  queryCache.forEach((_, key) => {
    if (key.includes(collectionName)) {
      keysToDelete.push(key);
    }
  });
  keysToDelete.forEach((key) => queryCache.delete(key));
  console.log(`🗑️ Cache limpo: ${collectionName}`);
};
