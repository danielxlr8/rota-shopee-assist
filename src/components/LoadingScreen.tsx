import { useEffect, useState } from "react";

export const LoadingScreen = () => {
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    // Após 8 segundos, mostra aviso
    const timer = setTimeout(() => {
      setShowWarning(true);
    }, 8000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-gray-50">
      <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-600"></div>
      <p className="text-xl font-semibold text-gray-700">A carregar...</p>
      
      {showWarning && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg max-w-md text-center">
          <p className="text-yellow-800 font-medium">⚠️ Carregamento demorado</p>
          <p className="text-sm text-yellow-700 mt-2">
            Se a página não carregar em alguns segundos, tente:
          </p>
          <ul className="text-sm text-yellow-700 mt-2 space-y-1 text-left">
            <li>• Recarregar a página (F5)</li>
            <li>• Verificar sua conexão com a internet</li>
            <li>• Limpar o cache do navegador</li>
          </ul>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            Recarregar Página
          </button>
        </div>
      )}
    </div>
  );
};
