import { useState } from "react";
import type { SupportCall, Driver, UrgencyLevel } from "../types/logistics";
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  Users,
  Check,
  X,
  Search,
} from "lucide-react";
import {
  CallCard,
  DriverCard,
  SummaryCard,
  KanbanColumn,
  DriverInfoModal,
} from "./UI";

interface AdminDashboardProps {
  calls: SupportCall[];
  drivers: Driver[];
  updateCall: (id: string, updates: Partial<Omit<SupportCall, "id">>) => void;
}

export const AdminDashboard = ({
  calls,
  drivers,
  updateCall,
}: AdminDashboardProps) => {
  const [urgencyFilter, setUrgencyFilter] = useState<UrgencyLevel | "TODOS">(
    "TODOS"
  );
  const [adminView, setAdminView] = useState<"kanban" | "approvals">("kanban");
  const [infoModalDriver, setInfoModalDriver] = useState<Driver | null>(null);

  const handleApprove = (callId: string) =>
    updateCall(callId, { status: "APROVADO" });
  const handleReject = (callId: string) =>
    updateCall(callId, { status: "EM ANDAMENTO" });

  const handleAcionarDriver = (driverId: string) => {
    const driver = drivers.find((d) => d.id === driverId);
    if (driver && driver.phone) {
      const message = encodeURIComponent(
        `Olá ${driver.name}, temos um chamado de apoio para você.`
      );
      const whatsappUrl = `https://wa.me/55${driver.phone}?text=${message}`;
      window.open(whatsappUrl, "_blank");
    } else {
      alert("Não foi possível acionar o motorista.");
    }
  };

  const openCalls = calls.filter((c) => c.status === "ABERTO");
  const inProgressCalls = calls.filter((c) => c.status === "EM ANDAMENTO");
  const concludedCalls = calls.filter(
    (c) => c.status === "CONCLUIDO" || c.status === "APROVADO"
  );
  const pendingApprovalCalls = calls.filter(
    (c) => c.status === "AGUARDANDO_APROVACAO"
  );
  const availableDrivers = drivers.filter((d) => d.status === "DISPONIVEL");
  const filteredOpenCalls =
    urgencyFilter === "TODOS"
      ? openCalls
      : openCalls.filter((call) => call.urgency === urgencyFilter);

  const filterControls = (
    <div className="flex space-x-1">
      {(["TODOS", "URGENTE", "ALTA", "MEDIA", "BAIXA"] as const).map(
        (level) => (
          <button
            key={level}
            onClick={() => setUrgencyFilter(level)}
            className={`px-2 py-0.5 text-xs rounded-md font-semibold ${
              urgencyFilter === level
                ? "bg-orange-600 text-white"
                : "bg-gray-300 text-gray-700 hover:bg-gray-400"
            }`}
          >
            {level === "TODOS"
              ? "Todos"
              : level.charAt(0) + level.slice(1).toLowerCase()}
          </button>
        )
      )}
    </div>
  );

  const activeCallForDriver = infoModalDriver
    ? calls.find(
        (c) =>
          c.assignedTo === infoModalDriver.id &&
          (c.status === "EM ANDAMENTO" || c.status === "AGUARDANDO_APROVACAO")
      ) || null
    : null;

  return (
    <div className="bg-orange-50 min-h-screen">
      <header className="p-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Sistema de Apoio Logístico
        </h1>
        <p className="text-gray-500">Painel Administrativo - SPX Shopee</p>
      </header>
      <nav className="px-6 border-b border-gray-200">
        <div className="flex space-x-4">
          <button
            onClick={() => setAdminView("kanban")}
            className={`py-2 px-1 text-sm font-semibold ${
              adminView === "kanban"
                ? "border-b-2 border-orange-600 text-orange-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Painel de Chamados
          </button>
          <button
            onClick={() => setAdminView("approvals")}
            className={`py-2 px-1 text-sm font-semibold relative ${
              adminView === "approvals"
                ? "border-b-2 border-orange-600 text-orange-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Aprovações Pendentes
            {pendingApprovalCalls.length > 0 && (
              <span className="absolute top-1 -right-3 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {pendingApprovalCalls.length}
              </span>
            )}
          </button>
        </div>
      </nav>
      {adminView === "kanban" ? (
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <SummaryCard
              title="Chamados Abertos"
              value={openCalls.length}
              icon={<AlertTriangle />}
              subtext="Aguardando atendimento"
              colorClass="#F59E0B"
            />
            <SummaryCard
              title="Em Andamento"
              value={inProgressCalls.length}
              icon={<Clock />}
              subtext="Sendo atendidos"
              colorClass="#3B82F6"
            />
            <SummaryCard
              title="Concluídos"
              value={concludedCalls.length}
              icon={<CheckCircle />}
              subtext="Finalizados"
              colorClass="#10B981"
            />
            <SummaryCard
              title="Motoristas Disponíveis"
              value={availableDrivers.length}
              icon={<Users />}
              subtext="Prontos para apoio"
              colorClass="#8B5CF6"
            />
          </div>
          <main className="flex flex-col lg:flex-row gap-6 overflow-x-auto pb-4">
            <KanbanColumn
              title="Chamados Abertos"
              count={filteredOpenCalls.length}
              colorClass="#F59E0B"
              headerControls={filterControls}
            >
              {filteredOpenCalls.map((call) => (
                <CallCard key={call.id} call={call} />
              ))}
            </KanbanColumn>
            <KanbanColumn
              title="Em Andamento"
              count={inProgressCalls.length}
              colorClass="#3B82F6"
            >
              {inProgressCalls.map((call) => (
                <CallCard key={call.id} call={call} />
              ))}
            </KanbanColumn>
            <KanbanColumn
              title="Concluídos"
              count={concludedCalls.length}
              colorClass="#10B981"
            >
              {concludedCalls.map((call) => (
                <CallCard key={call.id} call={call} />
              ))}
            </KanbanColumn>
            <KanbanColumn
              title="Motoristas Disponíveis"
              count={availableDrivers.length}
              colorClass="#8B5CF6"
            >
              {availableDrivers.map((driver) => (
                <DriverCard
                  key={driver.id}
                  driver={driver}
                  onAction={handleAcionarDriver}
                  onInfoClick={() => setInfoModalDriver(driver)}
                />
              ))}
            </KanbanColumn>
          </main>
        </div>
      ) : (
        <ApprovalView
          pendingCalls={pendingApprovalCalls}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
      {infoModalDriver && (
        <DriverInfoModal
          driver={infoModalDriver}
          call={activeCallForDriver}
          onClose={() => setInfoModalDriver(null)}
        />
      )}
    </div>
  );
};

const ApprovalView = ({
  pendingCalls,
  onApprove,
  onReject,
}: {
  pendingCalls: SupportCall[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const filteredCalls = pendingCalls.filter((call) =>
    call.solicitante.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">
          Transferências Aguardando Aprovação
        </h2>
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Pesquisar por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
      </div>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Solicitante
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Descrição
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredCalls.length > 0 ? (
              filteredCalls.map((call) => (
                <tr key={call.id}>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <img
                        className="h-10 w-10 rounded-full"
                        src={call.solicitante.avatar}
                        alt=""
                      />
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {call.solicitante.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    Transferência de pacotes finalizada. Aguardando aprovação.
                  </td>
                  <td className="px-6 py-4 space-x-2">
                    <button
                      onClick={() => onApprove(call.id)}
                      className="text-green-600 hover:text-green-900 p-2 rounded-full hover:bg-green-100"
                    >
                      <Check size={20} />
                    </button>
                    <button
                      onClick={() => onReject(call.id)}
                      className="text-red-600 hover:text-red-900 p-2 rounded-full hover:bg-red-100"
                    >
                      <X size={20} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                  Nenhuma solicitação encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
