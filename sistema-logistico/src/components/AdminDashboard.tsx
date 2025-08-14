import { useState } from "react";
import { mockCalls, mockDrivers } from "../data/mockData";
import type { SupportCall, Driver, UrgencyLevel } from "../types/logistics";
import { AlertTriangle, Clock, CheckCircle, Users } from "lucide-react";
import { CallCard, DriverCard, SummaryCard, KanbanColumn } from "./UI";

export const AdminDashboard = () => {
  const [calls] = useState<SupportCall[]>(mockCalls);
  const [drivers] = useState<Driver[]>(mockDrivers);
  const [urgencyFilter, setUrgencyFilter] = useState<UrgencyLevel | "TODOS">(
    "TODOS"
  );

  const handleAcionarDriver = (driverId: string) => {
    const driver = drivers.find((d) => d.id === driverId);
    if (driver && driver.phone) {
      const message = encodeURIComponent(
        `Olá ${driver.name}, temos um chamado de apoio para você. Por favor, responda para mais detalhes.`
      );
      const whatsappUrl = `https://wa.me/55${driver.phone}?text=${message}`;
      window.open(whatsappUrl, "_blank");
      console.log(`Acionando ${driver.name} via WhatsApp.`);
    } else {
      console.error("Motorista não encontrado ou sem telefone!");
      alert("Não foi possível acionar o motorista. Verifique os dados.");
    }
  };

  const openCalls = calls.filter((c) => c.status === "ABERTO");
  const inProgressCalls = calls.filter((c) => c.status === "EM ANDAMENTO");
  const concludedCalls = calls.filter((c) => c.status === "CONCLUIDO");
  const availableDrivers = drivers.filter((d) => d.status === "DISPONIVEL");

  const filteredOpenCalls =
    urgencyFilter === "TODOS"
      ? openCalls
      : openCalls.filter((call) => call.urgency === urgencyFilter);

  // O componente com os botões de filtro
  const filterControls = (
    <div className="flex space-x-1">
      {(["TODOS", "URGENTE", "ALTA", "MEDIA", "BAIXA"] as const).map(
        (level) => (
          <button
            key={level}
            onClick={() => setUrgencyFilter(level)}
            className={`px-2 py-0.5 text-xs rounded-md font-semibold transition-colors ${
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

  return (
    <div className="bg-orange-50 min-h-screen p-6 space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Sistema de Apoio Logístico
          </h1>
          <p className="text-gray-500">Painel Administrativo - SPX Shopee</p>
        </div>
      </header>

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
          title="Concluídos Hoje"
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
            />
          ))}
        </KanbanColumn>
      </main>
    </div>
  );
};
