import { useState } from "react";
import { mockCalls } from "../data/mockData";
import type { Driver } from "../types/logistics";
import { AlertTriangle, Users } from "lucide-react";
import { CallCard } from "./UI";

export const DriverInterface = ({ driver }: { driver: Driver }) => {
  // Não precisamos de 'useState' para os chamados, pois não os estamos a alterar aqui.
  const calls = mockCalls;
  const [isAvailable, setIsAvailable] = useState(
    driver.status === "DISPONIVEL"
  );

  const handleAcceptCall = (callId: string) => {
    alert(`Lógica para aceitar o chamado ${callId} aqui.`);
  };

  const availableCalls = calls.filter((c) => c.status === "ABERTO");

  return (
    <div className="bg-gray-100 min-h-screen p-4 md:p-6 space-y-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow-md text-center space-y-3">
          <img
            src={driver.avatar}
            alt={`Avatar de ${driver.name}`}
            className="w-24 h-24 rounded-full mx-auto border-4 border-gray-200"
          />
          <h2 className="text-2xl font-bold text-gray-800">{driver.name}</h2>
          <p className="text-gray-500">Sistema de Apoio Logístico</p>
          <div className="flex items-center justify-center space-x-2">
            <span
              className={`text-sm font-medium ${
                isAvailable ? "text-gray-500" : "text-green-600"
              }`}
            >
              Indisponível
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isAvailable}
                onChange={() => setIsAvailable(!isAvailable)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-green-300 peer-checked:bg-green-600"></div>
              <div className="absolute left-1 top-1 bg-white border-gray-300 border rounded-full h-4 w-4 transition-transform peer-checked:translate-x-full"></div>
            </label>
            <span
              className={`text-sm font-medium ${
                isAvailable ? "text-green-600" : "text-gray-500"
              }`}
            >
              Disponível para Apoio
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md mt-6 space-y-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="text-red-500" />
            <h3 className="text-lg font-bold text-gray-800">Solicitar Apoio</h3>
          </div>
          <button className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold py-3 px-4 rounded-lg shadow-lg hover:scale-105 transform transition-transform">
            PRECISO DE APOIO
          </button>
          <p className="text-center text-xs text-gray-500">
            A sua localização será enviada automaticamente
          </p>
        </div>

        <div className="mt-6">
          <div className="flex items-center space-x-2 mb-4">
            <Users className="text-blue-600" />
            <h3 className="text-lg font-bold text-gray-800">
              Chamados Disponíveis
            </h3>
            <span className="bg-gray-200 text-gray-600 text-xs font-semibold px-2 py-1 rounded-full">
              {availableCalls.length}
            </span>
          </div>
          <div className="space-y-4">
            {availableCalls.map((call) => (
              <CallCard
                key={call.id}
                call={call}
                onAction={handleAcceptCall}
                actionText="Aceitar Chamado"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
