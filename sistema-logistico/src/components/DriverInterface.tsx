import React, { useState, useMemo, useRef, useEffect } from "react";
import type {
  SupportCall,
  Driver,
  UrgencyLevel,
  CallStatus,
} from "../types/logistics";
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
  Building,
  Truck,
  Ticket,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { Timestamp, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import {
  AvatarComponent,
  UrgencyBadge,
  SummaryCard,
  KanbanColumn,
  DriverInfoModal,
} from "./UI";
import {
  Panel as ResizablePanel,
  PanelGroup as ResizablePanelGroup,
  PanelResizeHandle as ResizableHandle,
} from "react-resizable-panels";
import { toast as sonnerToast } from "sonner";
import spxLogo from "/spx-logo.png";

// --- NOVO COMPONENTE: EnhancedDriverCard ---
const EnhancedDriverCard = ({
  driver,
  onAction,
  onInfoClick,
}: {
  driver: Driver;
  onAction: (driverId: string) => void;
  onInfoClick: (driver: Driver) => void;
}) => (
  <div className="bg-white p-3 rounded-lg shadow flex items-center justify-between gap-2">
    <div className="flex items-center gap-3 flex-1 min-w-0">
      <AvatarComponent user={driver} onClick={() => onInfoClick(driver)} />
      <div className="flex-1 min-w-0">
        <p
          className="font-bold text-gray-800 cursor-pointer truncate"
          onClick={() => onInfoClick(driver)}
          title={driver.name}
        >
          {driver.name}
        </p>
        <div className="text-xs text-gray-500 flex flex-col sm:flex-row sm:items-center sm:gap-3 mt-1">
          <div className="flex items-center gap-1 truncate" title={driver.hub}>
            <Building size={12} />
            <span className="truncate">{driver.hub || "N/A"}</span>
          </div>
          <div className="flex items-center gap-1 capitalize">
            <Truck size={12} />
            <span>{driver.vehicleType || "N/A"}</span>
          </div>
        </div>
      </div>
    </div>
    <div className="flex flex-col items-end gap-1">
      <span className="px-2 py-0.5 text-xs font-semibold bg-green-100 text-green-700 rounded-full">
        Disponível
      </span>
      <button
        onClick={() => onAction(driver.uid)}
        className="px-3 py-1 text-xs font-semibold bg-blue-500 text-white rounded-md hover:bg-blue-600"
      >
        Acionar
      </button>
    </div>
  </div>
);

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

  const filteredOptions = options.filter((option) =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const getStatusColor = (status: CallStatus) => {
    switch (status) {
      case "ABERTO":
        return "text-yellow-600";
      case "EM ANDAMENTO":
        return "text-blue-600";
      case "CONCLUIDO":
        return "text-green-600";
      case "AGUARDANDO_APROVACAO":
        return "text-purple-600";
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
                onClick={() =>
                  onUpdateStatus(call.id, { status: "AGUARDANDO_APROVACAO" })
                }
                className="flex items-center gap-2 px-3 py-2 text-sm font-semibold bg-purple-500 text-white rounded-md hover:bg-purple-600"
              >
                Aguard. Aprovação <ArrowRight size={16} />
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
    if (timestamp instanceof Timestamp) {
      date = timestamp.toDate();
    } else if (timestamp && typeof timestamp.seconds === "number") {
      date = new Date(timestamp.seconds * 1000);
    } else {
      return "Data inválida";
    }
    if (isNaN(date.getTime())) return "Data inválida";
    return format(date, "dd/MM/yyyy HH:mm", { locale: ptBR });
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
          <Ticket size={16} className="text-gray-400" />
          <span>{call.routeId || "N/A"}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Building size={16} className="text-gray-400" />
          <span>{call.hub || "N/A"}</span>
        </div>
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

const ApprovalCard = ({
  call,
  onApprove,
  onReject,
  onDelete,
  drivers,
}: {
  call: SupportCall;
  onApprove: (call: SupportCall) => void;
  onReject: (call: SupportCall) => void;
  onDelete: (call: SupportCall) => void;
  drivers: Driver[];
}) => {
  const assignedDriver = drivers.find((d) => d.uid === call.assignedTo);

  return (
    <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-purple-500 space-y-3">
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-3">
          <AvatarComponent user={call.solicitante} />
          <div>
            <p className="font-bold text-gray-800">{call.solicitante.name}</p>
            <p className="text-sm text-gray-500">Solicitante</p>
          </div>
        </div>
        <UrgencyBadge urgency={call.urgency} />
      </div>

      {assignedDriver && (
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <ArrowRight size={16} className="text-gray-400" />
          <AvatarComponent user={assignedDriver} />
          <div>
            <p className="font-semibold">{assignedDriver.name}</p>
            <p className="text-xs text-gray-500">Prestador do Apoio</p>
          </div>
        </div>
      )}

      <div className="text-sm text-gray-600 space-y-2">
        <div className="flex items-center space-x-2">
          <Ticket size={16} className="text-gray-400" />
          <span>{call.routeId || "N/A"}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Building size={16} className="text-gray-400" />
          <span>{call.hub || "N/A"}</span>
        </div>
      </div>

      <p className="text-gray-700 bg-gray-50 p-3 rounded-md whitespace-pre-wrap">
        {call.description}
      </p>

      <div className="mt-2 pt-2 border-t flex justify-end gap-3">
        <button
          onClick={() => onDelete(call)}
          className="p-2 text-red-700 bg-red-100 rounded-md hover:bg-red-200 transition-colors"
          title="Excluir Solicitação"
        >
          <Trash2 size={16} />
        </button>
        <button
          onClick={() => onReject(call)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-red-500 text-white rounded-md hover:bg-red-600"
        >
          <X size={16} /> Rejeitar
        </button>
        <button
          onClick={() => onApprove(call)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-green-500 text-white rounded-md hover:bg-green-600"
        >
          <CheckCircle size={16} /> Aprovar
        </button>
      </div>
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
    "kanban" | "approvals" | "excluded" | "history"
  >("kanban");
  const [infoModalDriver, setInfoModalDriver] = useState<Driver | null>(null);
  const [callToConfirm, setCallToConfirm] = useState<SupportCall | null>(null);
  const [confirmationType, setConfirmationType] = useState<
    "soft-delete" | "permanent-delete" | "clear-all" | null
  >(null);
  const [excludedNameFilter, setExcludedNameFilter] = useState("");
  const [excludedHubFilter, setExcludedHubFilter] = useState("");
  const [selectedCall, setSelectedCall] = useState<SupportCall | null>(null);
  const notifiedCallIds = useRef(new Set<string>());
  const prevCallsRef = useRef<SupportCall[]>([]);

  const [tempHistoryFilters, setTempHistoryFilters] = useState({
    start: "",
    end: "",
    hub: "Todos",
    routeId: "",
    status: "Todos",
  });

  const [appliedHistoryFilters, setAppliedHistoryFilters] = useState({
    start: "",
    end: "",
    hub: "Todos",
    routeId: "",
    status: "Todos",
  });

  const [driverHubFilter, setDriverHubFilter] =
    useState<string>("Todos os Hubs");
  const [driverVehicleFilter, setDriverVehicleFilter] =
    useState<string>("Todos os Veículos");

  const [globalHubFilter, setGlobalHubFilter] =
    useState<string>("Todos os Hubs");

  const updateDriver = async (
    driverUid: string,
    updates: Partial<Omit<Driver, "uid">>
  ) => {
    if (!driverUid) return;
    const driverDocRef = doc(db, "motoristas_pre_aprovados", driverUid);
    await updateDoc(driverDocRef, updates);
  };

  const handleApplyHistoryFilters = () => {
    setAppliedHistoryFilters(tempHistoryFilters);
    sonnerToast.info("Filtros do histórico aplicados!");
  };

  const handleHistoryFilterChange = (
    filterName: keyof typeof tempHistoryFilters,
    value: string
  ) => {
    setTempHistoryFilters((prev) => ({ ...prev, [filterName]: value }));
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const urgencyLevels: UrgencyLevel[] = [
        "BAIXA",
        "MEDIA",
        "ALTA",
        "URGENTE",
      ];

      calls.forEach((call) => {
        if (call.status === "ABERTO" && call.timestamp) {
          const callTime =
            call.timestamp instanceof Timestamp
              ? call.timestamp.toMillis()
              : (call.timestamp as any).seconds * 1000;
          const minutesElapsed = (now - callTime) / 60000;

          const initialUrgencyIndex = urgencyLevels.indexOf(call.urgency);
          const escalationLevels = Math.floor(minutesElapsed / 30);

          const newUrgencyIndex = Math.min(
            initialUrgencyIndex + escalationLevels,
            urgencyLevels.length - 1
          );
          const newUrgency = urgencyLevels[newUrgencyIndex];

          if (newUrgency !== call.urgency) {
            updateCall(call.id, { urgency: newUrgency });
          }
        }
      });
    }, 60000);

    return () => clearInterval(interval);
  }, [calls, updateCall]);

  useEffect(() => {
    const archiveOldCalls = () => {
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const callsToCheck = calls.filter(
        (call) => !["ARQUIVADO", "EXCLUIDO", "ABERTO"].includes(call.status)
      );

      callsToCheck.forEach((call) => {
        if (call.timestamp) {
          const callDate =
            call.timestamp instanceof Timestamp
              ? call.timestamp.toDate()
              : new Date((call.timestamp as any).seconds * 1000);

          if (callDate < twentyFourHoursAgo) {
            console.log(`Arquivando chamado antigo: ${call.id}`);
            updateCall(call.id, { status: "ARQUIVADO" });
          }
        }
      });
    };

    const intervalId = setInterval(archiveOldCalls, 60 * 60 * 1000);
    archiveOldCalls();

    return () => clearInterval(intervalId);
  }, [calls, updateCall]);

  useEffect(() => {
    const prevCallsMap = new Map(
      prevCallsRef.current.map((c) => [c.id, c.status])
    );
    const newOpenCalls = calls.filter((call) => {
      const prevStatus = prevCallsMap.get(call.id);
      return call.status === "ABERTO" && prevStatus !== "ABERTO";
    });

    if (newOpenCalls.length > 0) {
      const audio = new Audio("/shopee-ringtone.mp3");
      audio.play().catch((e) => console.error("Erro ao tocar o som:", e));

      newOpenCalls.forEach((newCall) => {
        if (!notifiedCallIds.current.has(newCall.id)) {
          sonnerToast.custom(
            () => (
              <div className="flex items-center gap-3 bg-white p-4 rounded-lg shadow-lg border">
                <img src={spxLogo} alt="SPX Logo" className="w-10 h-10" />
                <div>
                  <p className="font-bold text-gray-800">
                    Novo Chamado Aberto!
                  </p>
                  <p className="text-sm text-gray-600">
                    {newCall.solicitante.name} do hub{" "}
                    {newCall.hub || "desconhecido"} precisa de apoio.
                  </p>
                </div>
              </div>
            ),
            { duration: 10000 }
          );
          notifiedCallIds.current.add(newCall.id);
        }
      });
    }

    prevCallsRef.current = calls;

    const openCallIds = new Set(
      calls.filter((c) => c.status === "ABERTO").map((c) => c.id)
    );
    notifiedCallIds.current.forEach((id) => {
      if (!openCallIds.has(id)) {
        notifiedCallIds.current.delete(id);
      }
    });
  }, [calls]);

  const handleApprove = async (call: SupportCall) => {
    try {
      const updates = { status: "CONCLUIDO", approvedBy: "Admin" };
      await updateCall(call.id, updates as Partial<Omit<SupportCall, "id">>);

      if (call.solicitante.id) {
        await updateDriver(call.solicitante.id, { status: "DISPONIVEL" });
      }
      if (call.assignedTo) {
        await updateDriver(call.assignedTo, { status: "DISPONIVEL" });
      }
      sonnerToast.success("Chamado aprovado e concluído com sucesso!");
    } catch (error) {
      console.error("Erro ao aprovar chamado:", error);
      sonnerToast.error("Falha ao aprovar o chamado.");
    }
  };

  const handleReject = async (call: SupportCall) => {
    try {
      await updateCall(call.id, { status: "EM ANDAMENTO" });
      sonnerToast.warning(
        "Aprovação rejeitada. O chamado voltou para 'Em Andamento'."
      );
    } catch (error) {
      console.error("Erro ao rejeitar chamado:", error);
      sonnerToast.error("Falha ao rejeitar o chamado.");
    }
  };

  const handleAcionarDriver = (driverUid: string) => {
    const driver = drivers.find((d) => d.uid === driverUid);
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
    if (confirmationType === "soft-delete" && callToConfirm)
      onDeleteCall(callToConfirm.id);
    else if (confirmationType === "permanent-delete" && callToConfirm)
      onDeletePermanently(callToConfirm.id);
    else if (confirmationType === "clear-all") onDeleteAllExcluded();
    closeModal();
  };

  const closeModal = () => {
    setCallToConfirm(null);
    setConfirmationType(null);
  };

  const handleRestore = (callId: string) => {
    updateCall(callId, { status: "ABERTO" });
  };

  const filteredCalls = useMemo(() => {
    return calls.filter(
      (call) =>
        globalHubFilter === "Todos os Hubs" || call.hub === globalHubFilter
    );
  }, [calls, globalHubFilter]);

  const filteredDrivers = useMemo(() => {
    return drivers.filter(
      (driver) =>
        globalHubFilter === "Todos os Hubs" || driver.hub === globalHubFilter
    );
  }, [drivers, globalHubFilter]);

  const activeCalls = useMemo(
    () =>
      filteredCalls.filter(
        (c) => !["EXCLUIDO", "ARQUIVADO"].includes(c.status)
      ),
    [filteredCalls]
  );
  const excludedCalls = useMemo(
    () => filteredCalls.filter((c) => c.status === "EXCLUIDO"),
    [filteredCalls]
  );
  const openCalls = useMemo(
    () => activeCalls.filter((c) => c.status === "ABERTO"),
    [activeCalls]
  );
  const inProgressCalls = useMemo(
    () => activeCalls.filter((c) => c.status === "EM ANDAMENTO"),
    [activeCalls]
  );
  const concludedCalls = useMemo(
    () => activeCalls.filter((c) => c.status === "CONCLUIDO"),
    [activeCalls]
  );
  const pendingApprovalCalls = useMemo(
    () => activeCalls.filter((c) => c.status === "AGUARDANDO_APROVACAO"),
    [activeCalls]
  );

  const availableDriverHubs = useMemo(
    () =>
      [
        "Todos os Hubs",
        ...new Set(drivers.map((d) => d.hub).filter(Boolean)),
      ].sort(),
    [drivers]
  );
  const allHubsForFilter = useMemo(
    () =>
      [
        "Todos os Hubs",
        ...new Set(calls.map((c) => c.hub).filter(Boolean)),
      ].sort(),
    [calls]
  );
  const allHubs = useMemo(
    () => ["Todos", ...new Set(calls.map((c) => c.hub).filter(Boolean))].sort(),
    [calls]
  );
  const vehicleTypes = useMemo(
    () =>
      [
        "Todos os Veículos",
        ...new Set(drivers.map((d) => d.vehicleType).filter(Boolean)),
      ].sort(),
    [drivers]
  );

  const availableDrivers = useMemo(() => {
    return filteredDrivers.filter((d) => {
      const isAvailable = d.status === "DISPONIVEL";
      const hubMatch =
        driverHubFilter === "Todos os Hubs" || d.hub === driverHubFilter;
      const vehicleMatch =
        driverVehicleFilter === "Todos os Veículos" ||
        d.vehicleType === driverVehicleFilter;
      return isAvailable && hubMatch && vehicleMatch;
    });
  }, [filteredDrivers, driverHubFilter, driverVehicleFilter]);

  const filteredHistoryCalls = useMemo(() => {
    return filteredCalls
      .filter((call) => {
        if (call.status === "EXCLUIDO") return false;

        if (
          appliedHistoryFilters.hub !== "Todos" &&
          call.hub !== appliedHistoryFilters.hub
        )
          return false;
        if (
          appliedHistoryFilters.routeId &&
          !call.routeId
            ?.toLowerCase()
            .includes(appliedHistoryFilters.routeId.toLowerCase())
        )
          return false;
        if (
          appliedHistoryFilters.status === "Concluidas" &&
          call.status !== "CONCLUIDO"
        )
          return false;
        if (
          appliedHistoryFilters.status === "Nao Concluidas" &&
          call.status === "CONCLUIDO"
        )
          return false;

        const callTimestamp = call.timestamp;
        if (!callTimestamp) return true;

        const callDate =
          callTimestamp instanceof Timestamp
            ? callTimestamp.toDate()
            : new Date((callTimestamp as any).seconds * 1000);

        if (appliedHistoryFilters.start) {
          const startDate = new Date(appliedHistoryFilters.start);
          startDate.setHours(0, 0, 0, 0);
          if (callDate < startDate) return false;
        }
        if (appliedHistoryFilters.end) {
          const endDate = new Date(appliedHistoryFilters.end);
          endDate.setHours(23, 59, 59, 999);
          if (callDate > endDate) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const timeA =
          a.timestamp instanceof Timestamp
            ? a.timestamp.toMillis()
            : (a.timestamp as any)?.seconds * 1000 || 0;
        const timeB =
          b.timestamp instanceof Timestamp
            ? b.timestamp.toMillis()
            : (b.timestamp as any)?.seconds * 1000 || 0;
        return timeB - timeA;
      });
  }, [filteredCalls, appliedHistoryFilters]);

  const filteredOpenCalls = useMemo(
    () =>
      urgencyFilter === "TODOS"
        ? openCalls
        : openCalls.filter((call) => call.urgency === urgencyFilter),
    [openCalls, urgencyFilter]
  );

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

  const driverFilterControls = (
    <div className="flex flex-col gap-2 w-full">
      <select
        value={driverHubFilter}
        onChange={(e) => setDriverHubFilter(e.target.value)}
        className="w-full p-2 border rounded-md text-sm bg-white"
      >
        {availableDriverHubs.map((hub) => (
          <option key={hub} value={hub}>
            {hub}
          </option>
        ))}
      </select>
      <select
        value={driverVehicleFilter}
        onChange={(e) => setDriverVehicleFilter(e.target.value)}
        className="w-full p-2 border rounded-md text-sm bg-white capitalize"
      >
        {vehicleTypes.map((v) => (
          <option key={v} value={v} className="capitalize">
            {v}
          </option>
        ))}
      </select>
    </div>
  );

  const activeCallForDriver = infoModalDriver
    ? calls.find(
        (c) =>
          c.assignedTo === infoModalDriver.uid &&
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
    <div className="bg-orange-100 min-h-screen font-sans flex flex-col">
      <header className="p-6">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-orange-600">
              Painel do Admin
            </h1>
            <p className="text-gray-900">Sistema de Apoio - SPX</p>
          </div>
          <div className="w-full sm:w-auto sm:min-w-[250px]">
            <select
              value={globalHubFilter}
              onChange={(e) => setGlobalHubFilter(e.target.value)}
              className="w-full p-2 border rounded-md text-sm bg-white shadow-sm"
            >
              {allHubsForFilter.map((hub) => (
                <option key={hub} value={hub}>
                  {hub}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>
      <nav className="px-6 border-b border--200">
        <div className="flex space-x-4">
          <button
            onClick={() => setAdminView("kanban")}
            className={`py-2 px-1 text-sm font-semibold transition-colors ${
              adminView === "kanban"
                ? "border-b-2 border-orange-600 text-orange-600"
                : "text-gray-900 hover:text-gray-500"
            }`}
          >
            Acompanhamento de chamados
          </button>
          <button
            onClick={() => setAdminView("approvals")}
            className={`py-2 px-1 text-sm font-semibold relative transition-colors ${
              adminView === "approvals"
                ? "border-b-2 border-orange-600 text-orange-600"
                : "text-gray-900 hover:text-gray-500"
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
                : "text-gray-900 hover:text-gray-500"
            }`}
          >
            Solicitações Excluídas
          </button>
          <button
            onClick={() => setAdminView("history")}
            className={`py-2 px-1 text-sm font-semibold transition-colors ${
              adminView === "history"
                ? "border-b-2 border-orange-600 text-orange-600"
                : "text-gray-900 hover:text-gray-500"
            }`}
          >
            Histórico
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
              subtext="Finalizados hoje"
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
                  headerControls={driverFilterControls}
                >
                  {availableDrivers.map((driver) => (
                    <EnhancedDriverCard
                      key={driver.uid}
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

      {adminView === "approvals" && (
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Aprovações Pendentes
          </h2>
          <div className="space-y-4">
            {pendingApprovalCalls.length > 0 ? (
              pendingApprovalCalls.map((call) => (
                <ApprovalCard
                  key={call.id}
                  call={call}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onDelete={handleDeleteClick}
                  drivers={drivers}
                />
              ))
            ) : (
              <p className="text-center text-gray-500 pt-8">
                Não há solicitações pendentes de aprovação.
              </p>
            )}
          </div>
        </div>
      )}

      {adminView === "history" && (
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Histórico de Solicitações
          </h2>
          <div className="bg-white p-4 rounded-lg shadow-md mb-4 flex flex-wrap gap-4 items-end">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Data Início
              </label>
              <input
                type="date"
                value={tempHistoryFilters.start}
                onChange={(e) =>
                  handleHistoryFilterChange("start", e.target.value)
                }
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
                Data Fim
              </label>
              <input
                type="date"
                value={tempHistoryFilters.end}
                onChange={(e) =>
                  handleHistoryFilterChange("end", e.target.value)
                }
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Hub</label>
              <select
                value={tempHistoryFilters.hub}
                onChange={(e) =>
                  handleHistoryFilterChange("hub", e.target.value)
                }
                className="w-full p-2 border rounded-md bg-white"
              >
                {allHubs.map((hub) => (
                  <option key={hub} value={hub}>
                    {hub}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
                ID da Rota
              </label>
              <input
                type="text"
                placeholder="Digite o ID da rota..."
                value={tempHistoryFilters.routeId}
                onChange={(e) =>
                  handleHistoryFilterChange("routeId", e.target.value)
                }
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                value={tempHistoryFilters.status}
                onChange={(e) =>
                  handleHistoryFilterChange("status", e.target.value)
                }
                className="w-full p-2 border rounded-md bg-white"
              >
                <option value="Todos">Todos</option>
                <option value="Concluidas">Concluídas</option>
                <option value="Nao Concluidas">Não Concluídas</option>
              </select>
            </div>
            <button
              onClick={handleApplyHistoryFilters}
              className="px-4 py-2 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition-colors"
            >
              Filtrar
            </button>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3">
                    Solicitante
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Apoio
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Hub
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Data
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Aprovado Por
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredHistoryCalls.map((call) => {
                  const assignedDriver = drivers.find(
                    (d) => d.uid === call.assignedTo
                  );
                  const callTimestamp = call.timestamp;
                  const formattedDate = callTimestamp
                    ? format(
                        callTimestamp instanceof Timestamp
                          ? callTimestamp.toDate()
                          : new Date((callTimestamp as any).seconds * 1000),
                        "dd/MM/yy HH:mm"
                      )
                    : "N/A";

                  return (
                    <tr
                      key={call.id}
                      className="bg-white border-b hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                        {call.solicitante.name}
                      </td>
                      <td className="px-6 py-4">
                        {assignedDriver?.name || "N/A"}
                      </td>
                      <td className="px-6 py-4">{call.hub || "N/A"}</td>
                      <td className="px-6 py-4">{call.status}</td>
                      <td className="px-6 py-4">{formattedDate}</td>
                      <td className="px-6 py-4">
                        {(call as any).approvedBy || "N/A"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {adminView === "excluded" && (
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
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
                .map((call) => {
                  const deletedTimestamp = call.deletedAt;
                  const formattedDeletedDate = deletedTimestamp
                    ? format(
                        deletedTimestamp instanceof Timestamp
                          ? deletedTimestamp.toDate()
                          : new Date((deletedTimestamp as any).seconds * 1000),
                        "dd/MM/yyyy 'às' HH:mm"
                      )
                    : "Data indisponível";
                  return (
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
                            Excluído em: {formattedDeletedDate}
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
                  );
                })
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
