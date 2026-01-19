/**
 * Hook seguro para operações no Firestore
 * Implementa circuit breaker, cache e tratamento de erros de quota
 */

import { useState, useEffect, useCallback, useRef } from "react";
import {
  collection,
  query,
  getDocs,
  onSnapshot,
  QueryConstraint,
  DocumentData,
  FirestoreError,
  limit,
  startAfter,
  QueryDocumentSnapshot,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase";
import { firestoreCircuitBreaker, CircuitState } from "../services/firestoreCircuitBreaker";
import { firestoreCache } from "../services/firestoreCache";

interface UseSafeFirestoreOptions {
  collectionName: string;
  constraints?: QueryConstraint[];
  useRealtime?: boolean;
  enableCache?: boolean;
  cacheTTL?: number;
  pageSize?: number;
  orderByField?: string;
  orderDirection?: "asc" | "desc";
}

interface PaginationState {
  hasMore: boolean;
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  currentPage: number;
}

export function useSafeFirestore<T extends DocumentData>(
  options: UseSafeFirestoreOptions
) {
  const {
    collectionName,
    constraints = [],
    useRealtime = false,
    enableCache = true,
    cacheTTL = 5 * 60 * 1000,
    pageSize = 15,
    orderByField = "createdAt",
    orderDirection = "desc",
  } = options;

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [circuitState, setCircuitState] = useState<CircuitState>(
    firestoreCircuitBreaker.getState()
  );
  const [pagination, setPagination] = useState<PaginationState>({
    hasMore: true,
    lastDoc: null,
    currentPage: 1,
  });

  const isMountedRef = useRef(true);
  const cacheKey = `${collectionName}_${JSON.stringify(constraints)}`;

  // Monitora estado do circuit breaker
  useEffect(() => {
    const unsubscribe = firestoreCircuitBreaker.subscribe((state) => {
      setCircuitState(state);
    });
    return unsubscribe;
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchData = async (loadMore = false) => {
    if (!isMountedRef.current) return;

    // Verifica circuit breaker
    if (!firestoreCircuitBreaker.canMakeRequest()) {
      setError(
        `Sistema temporariamente ocupado. Tente novamente em ${Math.ceil(
          firestoreCircuitBreaker.getRemainingCooldownTime() / 1000
        )} segundos.`
      );
      setLoading(false);
      return;
    }

    // Verifica cache (apenas para primeira página e se não for loadMore)
    if (enableCache && !loadMore) {
      const cachedData = firestoreCache.get<T[]>(cacheKey);
      if (cachedData) {
        console.log("✅ Dados carregados do cache:", collectionName);
        setData(cachedData);
        setLoading(false);
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);

      firestoreCircuitBreaker.recordRequest();

      // Constrói a query com paginação
      const queryConstraints: QueryConstraint[] = [
        orderBy(orderByField, orderDirection),
        limit(pageSize),
        ...constraints,
      ];

      // Se for loadMore, adiciona startAfter
      if (loadMore && pagination.lastDoc) {
        queryConstraints.push(startAfter(pagination.lastDoc));
      }

      const q = query(collection(db, collectionName), ...queryConstraints);
      
      // Timeout de 10 segundos para getDocs
      const snapshotPromise = getDocs(q);
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Timeout ao carregar dados')), 10000)
      );
      
      const snapshot = await Promise.race([snapshotPromise, timeoutPromise]);

      if (!isMountedRef.current) return;

      const fetchedData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as T[];

      // Atualiza dados (append se for loadMore)
      if (loadMore) {
        setData((prev) => [...prev, ...fetchedData]);
      } else {
        setData(fetchedData);
      }

      // Atualiza paginação
      const lastVisible = snapshot.docs[snapshot.docs.length - 1];
      setPagination({
        hasMore: snapshot.docs.length === pageSize,
        lastDoc: lastVisible || null,
        currentPage: loadMore ? pagination.currentPage + 1 : 1,
      });

      // Armazena no cache (apenas primeira página)
      if (enableCache && !loadMore) {
        firestoreCache.set(cacheKey, fetchedData, cacheTTL);
      }

      firestoreCircuitBreaker.recordSuccess();
    } catch (err) {
      if (!isMountedRef.current) return;

      const firestoreError = err as FirestoreError;
      console.error("Erro ao buscar dados:", firestoreError);

      if (
        firestoreError.code === "resource-exhausted" ||
        firestoreError.message?.includes("quota")
      ) {
        firestoreCircuitBreaker.recordQuotaError();
        setError(
          "🚨 Limite de leituras atingido. O sistema está em modo de economia. Tente novamente em alguns minutos."
        );
      } else {
        setError(`Erro ao carregar dados: ${firestoreError.message}`);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  // Carrega dados inicialmente
  useEffect(() => {
    if (useRealtime) {
      // Verifica circuit breaker
      if (!firestoreCircuitBreaker.canMakeRequest()) {
        setError(
          `Sistema temporariamente ocupado. Tente novamente em ${Math.ceil(
            firestoreCircuitBreaker.getRemainingCooldownTime() / 1000
          )} segundos.`
        );
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      firestoreCircuitBreaker.recordRequest();

      const q = query(
        collection(db, collectionName),
        orderBy(orderByField, orderDirection),
        limit(pageSize),
        ...constraints
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!isMountedRef.current) return;

          const fetchedData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as T[];

          setData(fetchedData);
          setLoading(false);

          if (enableCache) {
            firestoreCache.set(cacheKey, fetchedData, cacheTTL);
          }

          firestoreCircuitBreaker.recordSuccess();
        },
        (err) => {
          if (!isMountedRef.current) return;

          const firestoreError = err as FirestoreError;
          console.error("Erro no listener:", firestoreError);

          if (
            firestoreError.code === "resource-exhausted" ||
            firestoreError.message?.includes("quota")
          ) {
            firestoreCircuitBreaker.recordQuotaError();
            setError(
              "🚨 Limite de leituras atingido. Mudando para modo econômico..."
            );
          } else {
            setError(`Erro ao monitorar dados: ${firestoreError.message}`);
          }
          setLoading(false);
        }
      );

      return unsubscribe;
    } else {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionName, useRealtime]);

  const loadMore = useCallback(() => {
    if (!pagination.hasMore || loading) return;
    fetchData(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.hasMore, loading]);

  const refresh = useCallback(() => {
    firestoreCache.invalidate(cacheKey);
    setPagination({
      hasMore: true,
      lastDoc: null,
      currentPage: 1,
    });
    fetchData(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey]);

  return {
    data,
    loading,
    error,
    circuitState,
    pagination,
    loadMore,
    refresh,
  };
}
