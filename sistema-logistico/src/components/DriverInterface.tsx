import { useState } from "react";
import type { Driver, SupportCall, UrgencyLevel } from "../types/logistics";
import {
  Clock,
  ThumbsUp,
  AlertTriangle,
  X,
  MapPin,
  Package,
  Building,
  Globe,
  Sparkles,
  LoaderCircle,
  Zap,
} from "lucide-react";
import { CallCard } from "./UI";

interface DriverInterfaceProps {
  driver: Driver;
  calls: SupportCall[];
  updateCall: (id: string, updates: Partial<Omit<SupportCall, "id">>) => void;
  addNewCall: (
    newCall: Omit<SupportCall, "id" | "timestamp" | "solicitante">,
    driver: Driver
  ) => void;
  updateDriver: (id: string, updates: Partial<Omit<Driver, "id">>) => void;
}

const hubs = [
  "LM Hub_PR_Londrina_Parque ABC II",
  "LM Hub_PR_Maringa",
  "LM Hub_PR_Foz do Iguaçu",
  "LM Hub_PR_Cascavel",
];

export const DriverInterface = ({
  driver,
  calls,
  updateCall,
  addNewCall,
  updateDriver,
}: DriverInterfaceProps) => {
  const [activeTab, setActiveTab] = useState<
    "availability" | "support" | "activeCalls"
  >("availability");
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [location, setLocation] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const myActiveCalls = calls.filter(
    (c) =>
      c.assignedTo === driver.id &&
      (c.status === "EM ANDAMENTO" ||
        c.status === "AGUARDANDO_APROVACAO" ||
        c.status === "APROVADO")
  );

  const handleAvailabilityChange = (isAvailable: boolean) => {
    const newStatus = isAvailable ? "DISPONIVEL" : "INDISPONIVEL";
    updateDriver(driver.id, { status: newStatus });
  };

  const handleRequestApproval = (callId: string) => {
    updateCall(callId, {
      status: "AGUARDANDO_APROVACAO",
      description: "Transferência de pacotes finalizada. Aguardando aprovação.",
    });
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocalização não é suportada pelo seu navegador.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation(
          `Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`
        );
        setIsLocating(false);
      },
      () => {
        alert(
          "Não foi possível obter a sua localização. Por favor, verifique as permissões."
        );
        setIsLocating(false);
      }
    );
  };

  const handleSupportSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const informalDescription = `Preciso de apoio de transferência. Estou no hub ${formData.get(
      "hub"
    )}. Minha localização atual é ${location}. Tenho ${formData.get(
      "packageCount"
    )} pacotes para a região de ${formData.get("deliveryRegion")}.`;

    try {
      const prompt = `Aja como um assistente de logística. Um motorista descreveu um problema. Sua tarefa é:
        1. Reescrever a descrição de forma clara e profissional para um chamado de suporte.
        2. Classificar a urgência do problema como 'URGENTE', 'ALTA' ou 'MEDIA'.
        
        Descrição do motorista: "${informalDescription}"
        
        Retorne a sua resposta APENAS no formato JSON, seguindo este schema: {"description": "sua descrição profissional", "urgency": "sua classificação de urgência"}`;

      let chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
      const payload = {
        contents: chatHistory,
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              description: { type: "STRING" },
              urgency: { type: "STRING", enum: ["URGENTE", "ALTA", "MEDIA"] },
            },
            required: ["description", "urgency"],
          },
        },
      };
      const apiKey = "";
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Falha na resposta da API.");

      const result = await response.json();
      const parsedJson = JSON.parse(result.candidates[0].content.parts[0].text);

      addNewCall(
        {
          description: parsedJson.description,
          urgency: parsedJson.urgency as UrgencyLevel,
          location: location,
          status: "ABERTO",
        },
        driver
      );

      alert("Solicitação de apoio enviada com sucesso!");
      setIsSupportModalOpen(false);
    } catch (error) {
      console.error("Erro ao criar chamado:", error);
      alert("Não foi possível criar o chamado. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "availability":
        return (
          <div className="bg-white p-6 rounded-lg shadow-md text-center space-y-4">
            <h3 className="text-lg font-bold text-gray-800">
              Estou disponível para apoio?
            </h3>
            <div className="flex items-center justify-center space-x-4">
              {/* Botão SIM */}
              <button
                onClick={() => handleAvailabilityChange(true)}
                className={`w-24 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  driver.status === "DISPONIVEL"
                    ? "bg-green-600 text-white shadow-md"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Sim
              </button>
              {/* Botão NÃO */}
              <button
                onClick={() => handleAvailabilityChange(false)}
                className={`w-24 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  driver.status !== "DISPONIVEL"
                    ? "bg-red-600 text-white shadow-md"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Não
              </button>
            </div>
            <p className="text-xs text-gray-400">
              Use estes botões para informar o seu status ao administrador.
            </p>
          </div>
        );
      case "support":
        return (
          <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="text-red-500" />
              <h3 className="text-lg font-bold text-gray-800">
                Solicitar Apoio de Transferência
              </h3>
            </div>
            <button
              onClick={() => setIsSupportModalOpen(true)}
              className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold py-3 px-4 rounded-lg shadow-lg hover:scale-105 transform transition-transform"
            >
              PRECISO DE APOIO
            </button>
          </div>
        );
      case "activeCalls":
        return (
          <div className="mt-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              Meus Chamados Ativos
            </h3>
            {myActiveCalls.length > 0 ? (
              <div className="space-y-4">
                {myActiveCalls.map((call) => (
                  <div
                    key={call.id}
                    className="bg-white p-4 rounded-lg shadow-md"
                  >
                    <CallCard call={call} />
                    {call.status === "EM ANDAMENTO" && (
                      <button
                        onClick={() => handleRequestApproval(call.id)}
                        className="mt-4 w-full flex justify-center items-center space-x-2 bg-yellow-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-yellow-600"
                      >
                        <Clock size={16} />
                        <span>Finalizar Transferência e Pedir Aprovação</span>
                      </button>
                    )}
                    {call.status === "AGUARDANDO_APROVACAO" && (
                      <div className="mt-4 p-3 text-center bg-blue-100 text-blue-800 rounded-lg text-sm font-semibold">
                        Aguardando aprovação do admin...
                      </div>
                    )}
                    {call.status === "APROVADO" && (
                      <button
                        onClick={() =>
                          updateCall(call.id, { status: "CONCLUIDO" })
                        }
                        className="mt-4 w-full flex justify-center items-center space-x-2 bg-green-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-600"
                      >
                        <ThumbsUp size={16} />
                        <span>Transferência Aprovada! Concluir Chamado</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500">
                Você não tem nenhum chamado ativo.
              </p>
            )}
          </div>
        );
    }
  };

  return (
    <>
      <div className="bg-gray-100 min-h-screen p-4 md:p-6 space-y-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white p-6 rounded-lg shadow-md text-center space-y-3 mb-6">
            <img
              src={driver.avatar}
              alt={`Avatar de ${driver.name}`}
              className="w-24 h-24 rounded-full mx-auto border-4 border-gray-200"
            />
            <h2 className="text-2xl font-bold text-gray-800">{driver.name}</h2>
            <p className="text-gray-500">Sistema de Apoio Logístico</p>
          </div>

          <div className="bg-white rounded-lg shadow-md">
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab("availability")}
                className={`flex-1 p-4 text-sm font-semibold flex items-center justify-center space-x-2 ${
                  activeTab === "availability"
                    ? "border-b-2 border-orange-600 text-orange-600"
                    : "text-gray-500"
                }`}
              >
                <Zap size={16} />
                <span>Disponibilidade</span>
              </button>
              <button
                onClick={() => setActiveTab("support")}
                className={`flex-1 p-4 text-sm font-semibold flex items-center justify-center space-x-2 ${
                  activeTab === "support"
                    ? "border-b-2 border-orange-600 text-orange-600"
                    : "text-gray-500"
                }`}
              >
                <AlertTriangle size={16} />
                <span>Solicitar Apoio</span>
              </button>
              <button
                onClick={() => setActiveTab("activeCalls")}
                className={`flex-1 p-4 text-sm font-semibold flex items-center justify-center space-x-2 ${
                  activeTab === "activeCalls"
                    ? "border-b-2 border-orange-600 text-orange-600"
                    : "text-gray-500"
                }`}
              >
                <Clock size={16} />
                <span>Meus Chamados</span>
              </button>
            </div>
            <div className="p-4">{renderContent()}</div>
          </div>
        </div>
      </div>
      {isSupportModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                Solicitar Apoio de Transferência
              </h2>
              <button
                onClick={() => setIsSupportModalOpen(false)}
                className="p-1 rounded-full hover:bg-gray-200"
              >
                <X size={24} className="text-gray-600" />
              </button>
            </div>
            <form onSubmit={handleSupportSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="hub"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Selecione o seu Hub
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <select
                    id="hub"
                    name="hub"
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none"
                    required
                  >
                    <option value="">Selecione...</option>
                    {hubs.map((hub) => (
                      <option key={hub} value={hub}>
                        {hub}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label
                  htmlFor="currentLocation"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Sua Localização Atual
                </label>
                <div className="flex items-center space-x-2">
                  <div className="relative flex-grow">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      id="currentLocation"
                      name="currentLocation"
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Clique para obter ou digite"
                      className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      required
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={isLocating}
                    className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300"
                  >
                    {isLocating ? (
                      <LoaderCircle className="animate-spin" />
                    ) : (
                      <MapPin />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label
                  htmlFor="packageCount"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Número de Pacotes
                </label>
                <div className="relative">
                  <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    id="packageCount"
                    name="packageCount"
                    type="number"
                    placeholder="Ex: 15"
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="deliveryRegion"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Região de Entrega dos Pacotes
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    id="deliveryRegion"
                    name="deliveryRegion"
                    type="text"
                    placeholder="Ex: Zona Leste, São Paulo"
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>
              </div>
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2 text-white bg-orange-600 rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors disabled:bg-orange-300"
                >
                  {isLoading ? (
                    <LoaderCircle className="animate-spin" />
                  ) : (
                    "Enviar Solicitação"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
