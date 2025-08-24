import React, { useState, useMemo, useRef } from "react";
import type { SupportCall, Driver, UrgencyLevel } from "../types/logistics";
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  Users,
  Trash2,
  RotateCcw,
  MapPin,
  ArrowRight,
  ArrowLeft,
  X,
  Search,
  Check,
  Building,
  Truck,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { Timestamp } from "firebase/firestore";
import {
  AvatarComponent,
  UrgencyBadge,
  DriverCard, // Este componente será modificado no arquivo UI.tsx
  SummaryCard,
  KanbanColumn,
  DriverInfoModal,
} from "./UI";
import {
  Panel as ResizablePanel,
  PanelGroup as ResizablePanelGroup,
  PanelResizeHandle as ResizableHandle,
} from "react-resizable-panels";

// --- Componente de Busca Reutilizável (ComboBox) ---
const SearchableComboBox = ({
  options,
  value,
  onChange,
  placeholder,
}: {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter((option) =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);

  const handleSelect = (option: string) => {
    onChange(option);
    setSearchTerm(option);
    setIsOpen(false);
  };

  const displayValue = isOpen ? searchTerm : value;

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          size={18}
        />
        <input
          type="text"
          placeholder={placeholder}
          value={displayValue}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            setIsOpen(true);
          }}
          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>
      {isOpen && (
        <ul className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => (
              <li
                key={index}
                onClick={() => handleSelect(option)}
                className="px-4 py-2 hover:bg-orange-100 cursor-pointer"
              >
                {option}
              </li>
            ))
          ) : (
            <li className="px-4 py-2 text-gray-500">
              Nenhuma opção encontrada.
            </li>
          )}
        </ul>
      )}
    </div>
  );
};

// --- COMPONENTES AUXILIARES ---

// Modal de Confirmação Reutilizável
const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  children,
  confirmText,
  confirmColor = "bg-red-600",
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  children: React.ReactNode;
  confirmText: string;
  confirmColor?: string;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-gray-800">{title}</h2>
        <div className="text-gray-600 my-4">{children}</div>
        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-white font-semibold rounded-lg transition-colors ${confirmColor} hover:opacity-90`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

// Modal para Detalhes e Ações do Chamado
const CallDetailsModal = ({
  call,
  onClose,
  onUpdateStatus,
}: {
  call: SupportCall | null;
  onClose: () => void;
  onUpdateStatus: (
    id: string,
    updates: Partial<Omit<SupportCall, "id">>
  ) => void;
}) => {
  if (!call) return null;

  const getStatusColor = (status: SupportCall["status"]) => {
    switch (status) {
      case "ABERTO":
        return "text-yellow-600";
      case "EM ANDAMENTO":
        return "text-blue-600";
      case "CONCLUIDO":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-lg relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
        >
          <X size={24} />
        </button>
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Detalhes do Chamado
        </h2>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <AvatarComponent user={call.solicitante} />
            <div>
              <p className="font-bold">{call.solicitante.name}</p>
              <p className="text-sm text-gray-500">Solicitante</p>
            </div>
          </div>
          <p className={`font-bold text-sm ${getStatusColor(call.status)}`}>
            {call.status.replace("_", " ")}
          </p>
          <p className="text-gray-700 bg-gray-50 p-3 rounded-md whitespace-pre-wrap">
            {call.description}
          </p>
        </div>

        <div className="mt-6 pt-4 border-t flex justify-between items-center">
          <p className="text-sm text-gray-500">Mover para:</p>
          <div className="flex gap-2">
            {call.status === "EM ANDAMENTO" && (
              <button
                onClick={() => onUpdateStatus(call.id, { status: "ABERTO" })}
                className="flex items-center gap-2 px-3 py-2 text-sm font-semibold bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                <ArrowLeft size={16} /> Aberto
              </button>
            )}
            {call.status === "CONCLUIDO" && (
              <button
                onClick={() =>
                  onUpdateStatus(call.id, { status: "EM ANDAMENTO" })
                }
                className="flex items-center gap-2 px-3 py-2 text-sm font-semibold bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                <ArrowLeft size={16} /> Em Andamento
              </button>
            )}
            {call.status === "ABERTO" && (
              <button
                onClick={() =>
                  onUpdateStatus(call.id, { status: "EM ANDAMENTO" })
                }
                className="flex items-center gap-2 px-3 py-2 text-sm font-semibold bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Em Andamento <ArrowRight size={16} />
              </button>
            )}
            {call.status === "EM ANDAMENTO" && (
              <button
                onClick={() => onUpdateStatus(call.id, { status: "CONCLUIDO" })}
                className="flex items-center gap-2 px-3 py-2 text-sm font-semibold bg-green-500 text-white rounded-md hover:bg-green-600"
              >
                Concluído <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const CallCard = ({
  call,
  onDelete,
  onClick,
}: {
  call: SupportCall;
  onDelete: (call: SupportCall) => void;
  onClick: (call: SupportCall) => void;
}) => {
  const formatTimestamp = (timestamp: any): string => {
    if (!timestamp) return "Horário indisponível";
    let date;
    if (timestamp instanceof Timestamp) date = timestamp.toDate();
    else if (typeof timestamp === "object" && timestamp.seconds)
      date = new Timestamp(timestamp.seconds, timestamp.nanoseconds).toDate();
    else date = new Date(timestamp);
    if (isNaN(date.getTime())) return "Data inválida";
    return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
  };
  const timeAgo = formatTimestamp(call.timestamp);

  return (
    <div
      className="bg-white p-4 rounded-lg shadow-md border border-gray-200 space-y-3 hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => onClick(call)}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-3">
          <AvatarComponent user={call.solicitante} />
          <div>
            <div className="flex items-center gap-2">
              <p className="font-bold text-gray-800">{call.solicitante.name}</p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(call);
                }}
                className="p-1 rounded-full text-gray-400 hover:bg-red-100 hover:text-red-600 transition-colors"
                title="Excluir Solicitação"
              >
                <Trash2 size={14} />
              </button>
            </div>
            <p className="text-sm text-gray-500">Solicitante</p>
          </div>
        </div>
        <UrgencyBadge urgency={call.urgency} />
      </div>
      <div className="text-sm text-gray-600 space-y-2">
        <div className="flex items-center space-x-2">
          <Clock size={16} className="text-gray-400" />
          <span>{timeAgo}</span>
        </div>
        <div className="flex items-center space-x-2">
          <MapPin size={16} className="text-gray-400" />
          <span>{call.location}</span>
        </div>
      </div>
      <p className="text-gray-700 bg-gray-50 p-3 rounded-md whitespace-pre-wrap">
        {call.description}
      </p>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL DO PAINEL ---

interface AdminDashboardProps {
  calls: SupportCall[];
  drivers: Driver[];
  updateCall: (id: string, updates: Partial<Omit<SupportCall, "id">>) => void;
  onDeleteCall: (id: string) => void;
  onDeletePermanently: (id: string) => void;
  onDeleteAllExcluded: () => void;
}

export const AdminDashboard = ({
  calls,
  drivers,
  updateCall,
  onDeleteCall,
  onDeletePermanently,
  onDeleteAllExcluded,
}: AdminDashboardProps) => {
  const [urgencyFilter, setUrgencyFilter] = useState<UrgencyLevel | "TODOS">(
    "TODOS"
  );
  const [adminView, setAdminView] = useState<
    "kanban" | "approvals" | "excluded"
  >("kanban");
  const [infoModalDriver, setInfoModalDriver] = useState<Driver | null>(null);
  const [callToConfirm, setCallToConfirm] = useState<SupportCall | null>(null);
  const [confirmationType, setConfirmationType] = useState<
    "soft-delete" | "permanent-delete" | "clear-all" | null
  >(null);
  const [excludedNameFilter, setExcludedNameFilter] = useState("");
  const [excludedHubFilter, setExcludedHubFilter] = useState("");
  const [selectedCall, setSelectedCall] = useState<SupportCall | null>(null);

  // --- STATES PARA O FILTRO DE MOTORISTAS DISPONÍVEIS ---
  const [driverHubFilter, setDriverHubFilter] =
    useState<string>("Todos os Hubs");
  const [driverHubSearch, setDriverHubSearch] = useState<string>("");
  const [isDriverHubDropdownOpen, setIsDriverHubDropdownOpen] = useState(false);
  const [
    selectedDriverHubForConfirmation,
    setSelectedDriverHubForConfirmation,
  ] = useState<string>("Todos os Hubs");

  const handleAcionarDriver = (driverId: string) => {
    const driver = drivers.find((d) => d.id === driverId);
    if (driver?.phone) {
      const message = encodeURIComponent(
        `Olá ${driver.name}, temos um chamado de apoio para você.`
      );
      window.open(`https://wa.me/55${driver.phone}?text=${message}`, "_blank");
    }
  };

  const handleDeleteClick = (call: SupportCall) => {
    setCallToConfirm(call);
    setConfirmationType("soft-delete");
  };

  const handlePermanentDeleteClick = (call: SupportCall) => {
    setCallToConfirm(call);
    setConfirmationType("permanent-delete");
  };

  const handleClearAllClick = () => {
    setConfirmationType("clear-all");
  };

  const confirmAction = () => {
    if (confirmationType === "soft-delete" && callToConfirm) {
      onDeleteCall(callToConfirm.id);
    } else if (confirmationType === "permanent-delete" && callToConfirm) {
      onDeletePermanently(callToConfirm.id);
    } else if (confirmationType === "clear-all") {
      onDeleteAllExcluded();
    }
    closeModal();
  };

  const closeModal = () => {
    setCallToConfirm(null);
    setConfirmationType(null);
  };

  const handleRestore = (callId: string) => {
    updateCall(callId, { status: "ABERTO" });
  };

  const activeCalls = calls.filter((c) => c.status !== "EXCLUIDO");
  const excludedCalls = calls.filter((c) => c.status === "EXCLUIDO");
  const openCalls = activeCalls.filter((c) => c.status === "ABERTO");
  const inProgressCalls = activeCalls.filter(
    (c) => c.status === "EM ANDAMENTO"
  );
  const concludedCalls = activeCalls.filter(
    (c) => c.status === "CONCLUIDO" || c.status === "APROVADO"
  );
  const pendingApprovalCalls = activeCalls.filter(
    (c) => c.status === "AGUARDANDO_APROVACAO"
  );

  const availableDriverHubs = useMemo(() => {
    const hubs = new Set<string>();
    drivers.forEach((driver) => {
      if (driver.hub) {
        hubs.add(driver.hub);
      }
    });
    return ["Todos os Hubs", ...Array.from(hubs)];
  }, [drivers]);

  const availableDrivers = useMemo(() => {
    const baseDrivers = drivers.filter((d) => d.status === "DISPONIVEL");
    if (driverHubFilter === "Todos os Hubs") {
      return baseDrivers;
    }
    return baseDrivers.filter((driver) => driver.hub === driverHubFilter);
  }, [drivers, driverHubFilter]);

  const filteredOpenCalls =
    urgencyFilter === "TODOS"
      ? openCalls
      : openCalls.filter((call) => call.urgency === urgencyFilter);

  const filterControls = (
    <div className="flex flex-wrap gap-1">
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

  const activeCallForDriver = infoModalDriver
    ? calls.find(
        (c) =>
          c.assignedTo === infoModalDriver.id &&
          (c.status === "EM ANDAMENTO" || c.status === "AGUARDANDO_APROVACAO")
      ) || null
    : null;

  const excludedCallNames = useMemo(
    () => [...new Set(excludedCalls.map((c) => c.solicitante.name))],
    [excludedCalls]
  );
  const excludedCallHubs = useMemo(
    () =>
      [...new Set(excludedCalls.map((c) => c.hub).filter(Boolean))] as string[],
    [excludedCalls]
  );

  return (
    <div className="bg-orange-50 min-h-screen font-sans flex flex-col">
      <header className="p-6">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Sistema de Apoio Logístico
            </h1>
            <p className="text-gray-500">Painel Administrativo - SPX Shopee</p>
          </div>
        </div>
      </header>
      <nav className="px-6 border-b border-gray-200">
        <div className="flex space-x-4">
          <button
            onClick={() => setAdminView("kanban")}
            className={`py-2 px-1 text-sm font-semibold transition-colors ${
              adminView === "kanban"
                ? "border-b-2 border-orange-600 text-orange-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Painel de Chamados
          </button>
          <button
            onClick={() => setAdminView("approvals")}
            className={`py-2 px-1 text-sm font-semibold relative transition-colors ${
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
          <button
            onClick={() => setAdminView("excluded")}
            className={`py-2 px-1 text-sm font-semibold transition-colors ${
              adminView === "excluded"
                ? "border-b-2 border-orange-600 text-orange-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Solicitações Excluídas
          </button>
        </div>
      </nav>

      {adminView === "kanban" && (
        <div className="p-6 flex-grow flex flex-col space-y-6">
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

          <ResizablePanelGroup
            direction="horizontal"
            className="flex-grow rounded-lg border"
          >
            <ResizablePanel defaultSize={25} minSize={15}>
              <div className="bg-yellow-50 h-full rounded-lg p-2">
                <KanbanColumn
                  title="Chamados Abertos"
                  count={filteredOpenCalls.length}
                  colorClass="#F59E0B"
                  headerControls={filterControls}
                >
                  {filteredOpenCalls.map((call) => (
                    <CallCard
                      key={call.id}
                      call={call}
                      onDelete={handleDeleteClick}
                      onClick={setSelectedCall}
                    />
                  ))}
                </KanbanColumn>
              </div>
            </ResizablePanel>
            <ResizableHandle className="w-2 bg-gray-200 hover:bg-orange-500 transition-colors flex items-center justify-center">
              <div className="w-0.5 h-10 bg-gray-400 rounded-full" />
            </ResizableHandle>
            <ResizablePanel defaultSize={25} minSize={15}>
              <div className="bg-blue-50 h-full rounded-lg p-2">
                <KanbanColumn
                  title="Em Andamento"
                  count={inProgressCalls.length}
                  colorClass="#3B82F6"
                >
                  {inProgressCalls.map((call) => (
                    <CallCard
                      key={call.id}
                      call={call}
                      onDelete={handleDeleteClick}
                      onClick={setSelectedCall}
                    />
                  ))}
                </KanbanColumn>
              </div>
            </ResizablePanel>
            <ResizableHandle className="w-2 bg-gray-200 hover:bg-orange-500 transition-colors flex items-center justify-center">
              <div className="w-0.5 h-10 bg-gray-400 rounded-full" />
            </ResizableHandle>
            <ResizablePanel defaultSize={25} minSize={15}>
              <div className="bg-green-50 h-full rounded-lg p-2">
                <KanbanColumn
                  title="Concluídos"
                  count={concludedCalls.length}
                  colorClass="#10B981"
                >
                  {concludedCalls.map((call) => (
                    <CallCard
                      key={call.id}
                      call={call}
                      onDelete={handleDeleteClick}
                      onClick={setSelectedCall}
                    />
                  ))}
                </KanbanColumn>
              </div>
            </ResizablePanel>
            <ResizableHandle className="w-2 bg-gray-200 hover:bg-orange-500 transition-colors flex items-center justify-center">
              <div className="w-0.5 h-10 bg-gray-400 rounded-full" />
            </ResizableHandle>
            <ResizablePanel defaultSize={25} minSize={15}>
              <div className="bg-purple-50 h-full rounded-lg p-2">
                <KanbanColumn
                  title="Motoristas Disponíveis"
                  count={availableDrivers.length}
                  colorClass="#8B5CF6"
                  headerControls={
                    <div className="flex items-center gap-2 w-full">
                      <div className="relative flex-grow">
                        <input
                          type="text"
                          value={driverHubSearch}
                          onChange={(e) => {
                            setDriverHubSearch(e.target.value);
                            if (!isDriverHubDropdownOpen)
                              setIsDriverHubDropdownOpen(true);
                          }}
                          onFocus={() => setIsDriverHubDropdownOpen(true)}
                          onBlur={() =>
                            setTimeout(
                              () => setIsDriverHubDropdownOpen(false),
                              150
                            )
                          }
                          className="w-full p-2 border rounded-md pr-10 text-sm"
                          placeholder="Filtrar por Hub..."
                        />
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        {isDriverHubDropdownOpen && (
                          <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                            {availableDriverHubs
                              .filter((h) =>
                                h
                                  .toLowerCase()
                                  .includes(driverHubSearch.toLowerCase())
                              )
                              .map((h) => (
                                <div
                                  key={h}
                                  className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                                  onClick={() => {
                                    setSelectedDriverHubForConfirmation(h);
                                    setDriverHubSearch(h);
                                    setIsDriverHubDropdownOpen(false);
                                  }}
                                >
                                  {h}
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() =>
                          setDriverHubFilter(selectedDriverHubForConfirmation)
                        }
                        className="p-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-orange-300"
                      >
                        <Check size={20} />
                      </button>
                    </div>
                  }
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
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      )}

      {adminView === "excluded" && (
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              Solicitações Excluídas
            </h2>
            {excludedCalls.length > 0 && (
              <button
                onClick={handleClearAllClick}
                className="flex items-center gap-2 px-3 py-1 text-sm font-semibold bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                <Trash2 size={14} /> Limpar Tudo
              </button>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <SearchableComboBox
              options={excludedCallNames}
              value={excludedNameFilter}
              onChange={setExcludedNameFilter}
              placeholder="Filtrar por nome..."
            />
            <SearchableComboBox
              options={excludedCallHubs}
              value={excludedHubFilter}
              onChange={setExcludedHubFilter}
              placeholder="Filtrar por hub..."
            />
          </div>
          <div className="space-y-4">
            {excludedCalls.length > 0 ? (
              excludedCalls
                .filter((call) =>
                  call.solicitante.name.includes(excludedNameFilter)
                )
                .filter((call) =>
                  excludedHubFilter ? call.hub === excludedHubFilter : true
                )
                .map((call) => (
                  <div
                    key={call.id}
                    className="bg-white p-4 rounded-lg shadow-md flex justify-between items-center"
                  >
                    <div>
                      <p className="font-bold">{call.solicitante.name}</p>
                      <p className="text-sm text-gray-500">
                        {call.description}
                      </p>
                      {call.deletedAt && (
                        <p className="text-xs text-gray-400 mt-1">
                          Excluído em:{" "}
                          {format(
                            call.deletedAt.toDate(),
                            "dd/MM/yyyy 'às' HH:mm"
                          )}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRestore(call.id)}
                        className="flex items-center gap-2 px-3 py-1 text-sm font-semibold bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                      >
                        <RotateCcw size={14} /> Restaurar
                      </button>
                      <button
                        onClick={() => handlePermanentDeleteClick(call)}
                        className="p-2 text-red-700 bg-red-100 rounded-md hover:bg-red-200 transition-colors"
                        title="Excluir Permanentemente"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
            ) : (
              <p className="text-center text-gray-500">
                Não há solicitações excluídas.
              </p>
            )}
          </div>
        </div>
      )}

      {infoModalDriver && (
        <DriverInfoModal
          driver={infoModalDriver}
          call={activeCallForDriver}
          onClose={() => setInfoModalDriver(null)}
        />
      )}

      <CallDetailsModal
        call={selectedCall}
        onClose={() => setSelectedCall(null)}
        onUpdateStatus={updateCall}
      />

      <ConfirmationModal
        isOpen={confirmationType === "soft-delete"}
        onClose={closeModal}
        onConfirm={confirmAction}
        title="Confirmar Exclusão"
        confirmText="Excluir"
      >
        <p>
          Tem certeza de que deseja excluir a solicitação de{" "}
          <strong>{callToConfirm?.solicitante.name}</strong>? Esta ação pode ser
          revertida.
        </p>
      </ConfirmationModal>

      <ConfirmationModal
        isOpen={confirmationType === "permanent-delete"}
        onClose={closeModal}
        onConfirm={confirmAction}
        title="Confirmar Exclusão Permanente"
        confirmText="Excluir Permanentemente"
        confirmColor="bg-red-800"
      >
        <p>
          Tem certeza de que deseja excluir permanentemente a solicitação de{" "}
          <strong>{callToConfirm?.solicitante.name}</strong>?
        </p>
        <p className="font-bold text-red-700 mt-2">
          Esta ação não pode ser desfeita.
        </p>
      </ConfirmationModal>

      <ConfirmationModal
        isOpen={confirmationType === "clear-all"}
        onClose={closeModal}
        onConfirm={confirmAction}
        title="Limpar Todas as Solicitações"
        confirmText="Sim, Limpar Tudo"
        confirmColor="bg-red-800"
      >
        <p>
          Tem certeza de que deseja excluir permanentemente{" "}
          <strong>todas</strong> as solicitações da lixeira?
        </p>
        <p className="font-bold text-red-700 mt-2">
          Esta ação não pode ser desfeita.
        </p>
      </ConfirmationModal>
    </div>
  );
};
