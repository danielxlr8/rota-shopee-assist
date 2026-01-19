import { useEffect, useState } from "react";
import { realtimeDb } from "../firebase";
import { ref, set, onValue } from "firebase/database";

/**
 * Componente de teste para verificar se o Realtime Database está funcionando
 */
export const RealtimeDBTest = () => {
  const [status, setStatus] = useState<string>("Testando...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testRealtimeDB = async () => {
      try {
        if (!realtimeDb) {
          setStatus("❌ ERRO: realtimeDb é null");
          setError("Realtime Database não foi inicializado");
          return;
        }

        console.log("🧪 Iniciando teste do Realtime Database...");
        
        // Tenta escrever
        const testRef = ref(realtimeDb, "test/connection");
        const timestamp = new Date().toISOString();
        
        await set(testRef, {
          message: "Test from localhost",
          timestamp,
        });

        console.log("✅ Escrita bem-sucedida!");
        setStatus("✅ Escrita bem-sucedida!");

        // Tenta ler
        onValue(testRef, (snapshot) => {
          const data = snapshot.val();
          console.log("✅ Leitura bem-sucedida:", data);
          setStatus(`✅ Conexão OK! Timestamp: ${data?.timestamp}`);
        }, (error) => {
          console.error("❌ Erro na leitura:", error);
          setError(`Erro na leitura: ${error.message}`);
          setStatus("❌ Erro na leitura");
        });

      } catch (err: any) {
        console.error("❌ Erro no teste:", err);
        setError(`Erro: ${err.message || err.code || "Desconhecido"}`);
        setStatus("❌ Teste falhou");
      }
    };

    testRealtimeDB();
  }, []);

  return (
    <div className="fixed bottom-4 right-4 bg-white border-2 border-blue-500 rounded-lg p-4 shadow-lg max-w-sm z-50">
      <h3 className="font-bold text-sm mb-2">🧪 Teste Realtime Database</h3>
      <p className="text-xs mb-2">{status}</p>
      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-2 mt-2">
          <p className="text-xs text-red-600 font-mono break-all">{error}</p>
        </div>
      )}
      <div className="mt-2 text-xs text-gray-500">
        <p>• realtimeDb: {realtimeDb ? "✅ OK" : "❌ NULL"}</p>
        <p>• Verifique o console (F12) para mais detalhes</p>
      </div>
    </div>
  );
};
