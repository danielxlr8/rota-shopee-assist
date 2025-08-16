import { useState, useEffect, useMemo } from "react";
import type { SupportCall, Driver, UrgencyLevel } from "../types/logistics";
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  Users,
  Check,
  X,
  Search,
  ChevronDown,
  Settings,
} from "lucide-react";
import {
  CallCard,
  DriverCard,
  SummaryCard,
  KanbanColumn,
  DriverInfoModal,
} from "./UI";
import { db } from "../firebase";
import {
  collection,
  onSnapshot,
  query,
  doc,
  updateDoc,
} from "firebase/firestore";

interface ColumnVisibility {
  inProgress: boolean;
  concluded: boolean;
  availableDrivers: boolean;
}

export const AdminDashboard = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [calls, setCalls] = useState<SupportCall[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [hubFilter, setHubFilter] = useState<string>("TODOS");

  const [urgencyFilter, setUrgencyFilter] = useState<UrgencyLevel | "TODOS">(
    "TODOS"
  );
  const [adminView, setAdminView] = useState<"kanban" | "approvals">("kanban");
  const [infoModalDriver, setInfoModalDriver] = useState<Driver | null>(null);
  const [isUrgencyDropdownOpen, setIsUrgencyDropdownOpen] = useState(false);

  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>({
    inProgress: true,
    concluded: true,
    availableDrivers: true,
  });

  useEffect(() => {
    const driversQuery = query(collection(db, "drivers"));
    const unsubscribeDrivers = onSnapshot(driversQuery, (snapshot) => {
      const driversData = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Driver)
      );
      setDrivers(driversData);
    });

    const callsQuery = query(collection(db, "supportCalls"));
    const unsubscribeCalls = onSnapshot(callsQuery, (snapshot) => {
      const callsData = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as SupportCall)
      );
      setCalls(callsData);
    });

    return () => {
      unsubscribeDrivers();
      unsubscribeCalls();
    };
  }, []);

  const allHubs = useMemo(() => {
    const hubs = drivers.map((d) => d.region).filter(Boolean);
    return ["TODOS", ...Array.from(new Set(hubs))];
  }, [drivers]);

  const filteredData = useMemo(() => {
    const lowercasedSearch = searchTerm.toLowerCase();

    let filteredDrivers = drivers.filter((driver) => {
      const matchesHub = hubFilter === "TODOS" || driver.region === hubFilter;
      const matchesSearch = driver.name
        .toLowerCase()
        .includes(lowercasedSearch);
      return matchesHub && matchesSearch;
    });

    let filteredCalls = calls.filter((call) => {
      const driverOfCall = drivers.find((d) => d.id === call.solicitante.id);
      const matchesHub =
        hubFilter === "TODOS" ||
        (driverOfCall && driverOfCall.region === hubFilter);
      const matchesSearch = call.solicitante.name
        .toLowerCase()
        .includes(lowercasedSearch);
      return matchesHub && matchesSearch;
    });

    return { drivers: filteredDrivers, calls: filteredCalls };
  }, [drivers, calls, searchTerm, hubFilter]);

  const updateCall = async (
    id: string,
    updates: Partial<Omit<SupportCall, "id">>
  ) => {
    const callDocRef = doc(db, "supportCalls", id);
    await updateDoc(callDocRef, updates);
  };

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
      console.error(
        "Não foi possível acionar o motorista. Telefone não encontrado."
      );
    }
  };

  const openCalls = filteredData.calls.filter((c) => c.status === "ABERTO");
  const inProgressCalls = filteredData.calls.filter(
    (c) => c.status === "EM ANDAMENTO"
  );
  const concludedCalls = filteredData.calls.filter(
    (c) => c.status === "CONCLUIDO" || c.status === "APROVADO"
  );
  const pendingApprovalCalls = filteredData.calls.filter(
    (c) => c.status === "AGUARDANDO_APROVACAO"
  );
  const availableDrivers = filteredData.drivers.filter(
    (d) => d.status === "DISPONIVEL"
  );

  const openCallsWithUrgency =
    urgencyFilter === "TODOS"
      ? openCalls
      : openCalls.filter((call) => call.urgency === urgencyFilter);

  const filterControls = (
    <div className="relative w-full">
      <button
        onClick={() => setIsUrgencyDropdownOpen(!isUrgencyDropdownOpen)}
        className="w-full flex justify-between items-center bg-white border border-gray-300 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-semibold text-left"
      >
        <span>
          {urgencyFilter === "TODOS"
            ? "Todos os Níveis"
            : urgencyFilter.charAt(0) + urgencyFilter.slice(1).toLowerCase()}
        </span>
        <ChevronDown
          size={16}
          className={`transition-transform duration-200 ${
            isUrgencyDropdownOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      {isUrgencyDropdownOpen && (
        <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-20">
          {(["TODOS", "URGENTE", "ALTA", "MEDIA", "BAIXA"] as const).map(
            (level) => (
              <button
                key={level}
                onClick={() => {
                  setUrgencyFilter(level);
                  setIsUrgencyDropdownOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                  urgencyFilter === level
                    ? "bg-orange-500 text-white"
                    : "hover:bg-orange-100"
                }`}
              >
                {level === "TODOS"
                  ? "Todos os Níveis"
                  : level.charAt(0) + level.slice(1).toLowerCase()}
              </button>
            )
          )}
        </div>
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

          <div className="flex flex-col md:flex-row gap-4 items-center p-4 bg-white rounded-lg shadow">
            <div className="relative flex-grow w-full md:w-auto">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Pesquisar por nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div className="relative w-full md:w-auto">
              <select
                value={hubFilter}
                onChange={(e) => setHubFilter(e.target.value)}
                className="w-full appearance-none bg-gray-100 border-gray-300 border rounded-lg py-2 px-4 pr-8 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {allHubs.map((hub) => (
                  <option key={hub} value={hub}>
                    {hub === "TODOS" ? "Todos os Hubs" : hub}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                size={20}
              />
            </div>
            <div className="relative group">
              <button className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200">
                <Settings size={20} className="text-gray-600" />
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 opacity-0 group-hover:opacity-100 transition-opacity p-2 space-y-1">
                <label className="flex items-center space-x-2 p-1 hover:bg-gray-100 rounded-md">
                  <input
                    type="checkbox"
                    checked={columnVisibility.inProgress}
                    onChange={() =>
                      setColumnVisibility((prev) => ({
                        ...prev,
                        inProgress: !prev.inProgress,
                      }))
                    }
                  />
                  <span>Em Andamento</span>
                </label>
                <label className="flex items-center space-x-2 p-1 hover:bg-gray-100 rounded-md">
                  <input
                    type="checkbox"
                    checked={columnVisibility.concluded}
                    onChange={() =>
                      setColumnVisibility((prev) => ({
                        ...prev,
                        concluded: !prev.concluded,
                      }))
                    }
                  />
                  <span>Concluídos</span>
                </label>
                <label className="flex items-center space-x-2 p-1 hover:bg-gray-100 rounded-md">
                  <input
                    type="checkbox"
                    checked={columnVisibility.availableDrivers}
                    onChange={() =>
                      setColumnVisibility((prev) => ({
                        ...prev,
                        availableDrivers: !prev.availableDrivers,
                      }))
                    }
                  />
                  <span>Motoristas</span>
                </label>
              </div>
            </div>
          </div>

          <main className="flex flex-col lg:flex-row gap-6 overflow-x-auto pb-4">
            <KanbanColumn
              className="bg-orange-100 rounded-lg flex-1 min-w-[300px]"
              title="Chamados Abertos"
              count={openCallsWithUrgency.length}
              colorClass="#F59E0B"
            >
              <div className="mb-4">{filterControls}</div>
              {openCallsWithUrgency.map((call) => (
                <CallCard key={call.id} call={call} />
              ))}
            </KanbanColumn>

            {columnVisibility.inProgress && (
              <KanbanColumn
                className="bg-blue-100 rounded-lg flex-1 min-w-[300px]"
                title="Em Andamento"
                count={inProgressCalls.length}
                colorClass="#3B82F6"
              >
                {inProgressCalls.map((call) => (
                  <CallCard key={call.id} call={call} />
                ))}
              </KanbanColumn>
            )}
            {columnVisibility.concluded && (
              <KanbanColumn
                className="bg-green-100 rounded-lg flex-1 min-w-[300px]"
                title="Concluídos"
                count={concludedCalls.length}
                colorClass="#10B981"
              >
                {concludedCalls.map((call) => (
                  <CallCard key={call.id} call={call} />
                ))}
              </KanbanColumn>
            )}
            {columnVisibility.availableDrivers && (
              <KanbanColumn
                className="bg-violet-100 rounded-lg flex-1 min-w-[300px]"
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
            )}
          </main>
        </div>
      ) : (
        <ApprovalView
          pendingCalls={pendingApprovalCalls}
          onApprove={handleApprove}
          onReject={handleReject}
          allHubs={allHubs}
          drivers={drivers}
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

// --- COMPONENTE APPROVALVIEW ATUALIZADO ---
const ApprovalView = ({
  pendingCalls,
  onApprove,
  onReject,
  allHubs,
  drivers,
}: {
  pendingCalls: SupportCall[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  allHubs: string[];
  drivers: Driver[];
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [hubFilter, setHubFilter] = useState("TODOS");

  const filteredCalls = useMemo(() => {
    return pendingCalls.filter((call) => {
      const driverOfCall = drivers.find((d) => d.id === call.solicitante.id);
      const matchesHub =
        hubFilter === "TODOS" ||
        (driverOfCall && driverOfCall.region === hubFilter);
      const matchesSearch = call.solicitante.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      return matchesHub && matchesSearch;
    });
  }, [pendingCalls, searchTerm, hubFilter, drivers]);

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row gap-4 items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800 flex-shrink-0">
          Transferências Aguardando Aprovação
        </h2>
        <div className="flex-grow w-full flex flex-col md:flex-row gap-4 items-center">
          <div className="relative w-full">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Pesquisar por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div className="relative w-full md:w-64">
            <select
              value={hubFilter}
              onChange={(e) => setHubFilter(e.target.value)}
              className="w-full appearance-none bg-gray-100 border-gray-300 border rounded-lg py-2 px-4 pr-8 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {allHubs.map((hub) => (
                <option key={hub} value={hub}>
                  {hub === "TODOS" ? "Filtrar por Hub" : hub}
                </option>
              ))}
            </select>
            <ChevronDown
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
              size={20}
            />
          </div>
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
