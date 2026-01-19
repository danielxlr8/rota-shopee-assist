/**
 * EXEMPLOS PRÁTICOS - useSafeFirestore
 * 
 * Este arquivo contém exemplos prontos para uso do hook useSafeFirestore
 * em diferentes cenários comuns do sistema logístico.
 */

import { useState, useEffect } from "react";
import { useSafeFirestore } from "../hooks/useSafeFirestore";
import { where } from "firebase/firestore";

// =====================================
// EXEMPLO 1: Lista de Chamados com Paginação
// =====================================
export function ExemploListaChamados() {
  const {
    data: chamados,
    loading,
    error,
    pagination,
    loadMore,
    refresh,
  } = useSafeFirestore({
    collectionName: "supportCalls",
    pageSize: 15,
    enableCache: true,
    cacheTTL: 3 * 60 * 1000, // 3 minutos
    orderByField: "createdAt",
    orderDirection: "desc",
  });

  if (loading) return <div>Carregando...</div>;
  if (error) return <div>Erro: {error}</div>;

  return (
    <div>
      <button onClick={refresh}>🔄 Atualizar</button>
      
      {chamados.map((chamado: any) => (
        <div key={chamado.id}>
          <h3>{chamado.titulo}</h3>
          <p>{chamado.descricao}</p>
        </div>
      ))}

      {pagination.hasMore && (
        <button onClick={loadMore}>
          Carregar Mais ({pagination.currentPage})
        </button>
      )}
    </div>
  );
}

// =====================================
// EXEMPLO 2: Infinite Scroll
// =====================================
export function ExemploInfiniteScroll() {
  const {
    data: chamados,
    loading,
    pagination,
    loadMore,
  } = useSafeFirestore({
    collectionName: "supportCalls",
    pageSize: 15,
    enableCache: true,
  });

  // Hook para detectar quando usuário chega ao final
  useEffect(() => {
    const handleScroll = () => {
      const bottom = Math.ceil(window.innerHeight + window.scrollY) >= 
                     document.documentElement.scrollHeight;
      
      if (bottom && pagination.hasMore && !loading) {
        loadMore();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pagination.hasMore, loading, loadMore]);

  return (
    <div>
      {chamados.map((c: any) => (
        <div key={c.id}>{c.titulo}</div>
      ))}
      
      {loading && <p>Carregando mais...</p>}
      {!pagination.hasMore && <p>Fim da lista</p>}
    </div>
  );
}

// =====================================
// EXEMPLO 3: Lista com Loading Skeleton
// =====================================
export function ExemploComSkeleton() {
  const {
    data: chamados,
    loading,
    error,
    pagination,
    loadMore,
  } = useSafeFirestore({
    collectionName: "supportCalls",
    pageSize: 15,
    enableCache: true,
  });

  if (error) {
    return (
      <div className="bg-red-50 p-4 border border-red-200 rounded">
        <p className="text-red-700">❌ {error}</p>
        <button onClick={() => window.location.reload()}>
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div>
      {loading && chamados.length === 0 ? (
        // Skeleton loading para primeira carga
        <>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-200 h-20 mb-2 rounded" />
          ))}
        </>
      ) : (
        <>
          {chamados.map((chamado: any) => (
            <div key={chamado.id} className="bg-white p-4 mb-2 rounded shadow">
              <h3>{chamado.titulo}</h3>
              <p>{chamado.descricao}</p>
            </div>
          ))}

          {pagination.hasMore && (
            <button
              onClick={loadMore}
              disabled={loading}
              className="w-full py-2 bg-blue-500 text-white rounded disabled:opacity-50"
            >
              {loading ? "Carregando..." : "Carregar Mais"}
            </button>
          )}
        </>
      )}
    </div>
  );
}
