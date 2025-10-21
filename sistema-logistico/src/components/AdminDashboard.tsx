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
  ArrowRight,
  ArrowLeft,
  X,
  Search,
  Building,
  Truck,
  Ticket,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale"; // CORREÇÃO: importação correta do ptBR
import { Timestamp, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import {
  AvatarComponent,
  UrgencyBadge,
  SummaryCard,
  KanbanColumn,
  DriverInfoModal,
} from "./UI"; // Componentes do seu arquivo UI.tsx (mantidos)
import {
  Panel as ResizablePanel,
  PanelGroup as ResizablePanelGroup,
  PanelResizeHandle as ResizableHandle,
} from "react-resizable-panels";
import { toast as sonnerToast } from "sonner";
import spxLogo from "/spx-logo.png";
import SupportCallCard from "@/components/ui/SupportCallCard";

// --- IMPORTAÇÕES SHADCN/UI (Apenas os que existem) ---
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "./ui/card";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/button";
// Input e Select são usados como HTML padrão

// --- COMPONENTE: EnhancedDriverCard (Reestilizado) ---
const EnhancedDriverCard = ({
  driver,
  onAction,
  onInfoClick,
}: {
  driver: Driver;
  onAction: (driverId: string) => void;
  onInfoClick: (driver: Driver) => void;
}) => (
  <Card className="p-3 rounded-xl shadow-lg flex items-center justify-between gap-2 border-l-4 border-green-500 bg-card">
    <div className="flex items-center gap-3 flex-1 min-w-0">
      <AvatarComponent user={driver} onClick={() => onInfoClick(driver)} />
      <div className="flex-1 min-w-0">
        <p
          className="font-semibold text-foreground cursor-pointer truncate"
          onClick={() => onInfoClick(driver)}
          title={driver.name}
        >
          {driver.name}
        </p>
        <div className="text-xs text-muted-foreground flex flex-col sm:flex-row sm:items-center sm:gap-3 mt-1">
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
    <div className="flex flex-col items-end gap-2">
      <Badge
        variant="outline"
        className="text-green-600 border-green-500 text-xs"
      >
        Disponível
      </Badge>
      <Button
        onClick={() => onAction(driver.uid)}
        size="sm"
        className="h-7 text-xs rounded-lg"
      >
        Acionar
      </Button>
    </div>
  </Card>
);

// --- Componente de Busca Reutilizável (ComboBox) (Reestilizado com <input> normal) ---
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
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
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
          className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
        />
      </div>
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => (
              <li
                key={index}
                onClick={() => handleSelect(option)}
                className="px-4 py-2 hover:bg-primary/10 cursor-pointer text-sm"
              >
                {option}
              </li>
            ))
          ) : (
            <li className="px-4 py-2 text-muted-foreground text-sm">
              Nenhuma opção encontrada.
            </li>
          )}
        </div>
      )}
    </div>
  );
};

// --- Modal de Confirmação (Reestilizado com <Card>) ---
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl font-bold">{title}</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">{children}</CardContent>
        <CardFooter className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            className={`${confirmColor} hover:opacity-90`}
          >
            {confirmText}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

// --- Modal de Detalhes (Reestilizado com <Card>) ---
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
        return "text-yellow-500";
      case "EM ANDAMENTO":
        return "text-blue-500";
      case "CONCLUIDO":
        return "text-green-500";
      case "AGUARDANDO_APROVACAO":
        return "text-purple-500";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground"
        >
          <X size={20} />
        </button>
        <CardHeader>
          <CardTitle className="text-xl font-bold">
            Detalhes do Chamado
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <AvatarComponent user={call.solicitante} />
            <div>
              <p className="font-semibold text-foreground">
                {call.solicitante.name}
              </p>
              <p className="text-sm text-muted-foreground">Solicitante</p>
            </div>
          </div>
          <p
            className={`font-bold text-sm uppercase ${getStatusColor(
              call.status
            )}`}
          >
            {call.status.replace("_", " ")}
          </p>
          <div className="text-sm text-foreground bg-muted/50 p-3 rounded-md whitespace-pre-wrap">
            {call.description}
          </div>
        </CardContent>
        <CardFooter className="mt-2 pt-4 border-t flex flex-wrap justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">Mover para:</p>
          <div className="flex gap-2">
            {call.status === "EM ANDAMENTO" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onUpdateStatus(call.id, { status: "ABERTO" })}
              >
                <ArrowLeft size={16} className="mr-1.5" /> Aberto
              </Button>
            )}
            {call.status === "CONCLUIDO" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  onUpdateStatus(call.id, { status: "EM ANDAMENTO" })
                }
              >
                <ArrowLeft size={16} className="mr-1.5" /> Em Andamento
              </Button>
            )}
            {call.status === "ABERTO" && (
              <Button
                variant="default"
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() =>
                  onUpdateStatus(call.id, { status: "EM ANDAMENTO" })
                }
              >
                Em Andamento <ArrowRight size={16} className="ml-1.5" />
              </Button>
            )}
            {call.status === "EM ANDAMENTO" && (
              <Button
                variant="default"
                size="sm"
                className="bg-purple-600 hover:bg-purple-700"
                onClick={() =>
                  onUpdateStatus(call.id, { status: "AGUARDANDO_APROVACAO" })
                }
              >
                Aguard. Aprovação <ArrowRight size={16} className="ml-1.5" />
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

// --- Card de Aprovação (Reestilizado) ---
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
    <Card className="overflow-hidden shadow-lg border-l-8 border-purple-500 rounded-xl bg-card">
      <CardHeader className="p-4 bg-purple-500/10">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-3">
            <AvatarComponent user={call.solicitante} />
            <div>
              <p className="font-bold text-foreground">
                {call.solicitante.name}
              </p>
              <p className="text-sm text-muted-foreground">Solicitante</p>
            </div>
          </div>
          <UrgencyBadge urgency={call.urgency} />
        </div>
        {assignedDriver && (
          <div className="flex items-center gap-3 text-sm text-muted-foreground pl-1 pt-3">
            <ArrowRight size={16} className="text-muted-foreground/50" />
            <AvatarComponent user={assignedDriver} />
            <div>
              <p className="font-semibold text-foreground">
                {assignedDriver.name}
              </p>
              <p className="text-xs text-muted-foreground">
                Prestador do Apoio
              </p>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-4 space-y-3">
        <div className="text-sm text-muted-foreground space-y-2">
          <div className="flex items-center space-x-2">
            <Ticket size={16} className="text-primary" />
            <span>{call.routeId || "N/A"}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Building size={16} className="text-primary" />
            <span>{call.hub || "N/A"}</span>
          </div>
        </div>
        <p className="text-foreground bg-muted/50 p-3 rounded-md whitespace-pre-wrap text-sm">
          {call.description}
        </p>
      </CardContent>

      <CardFooter className="mt-2 pt-3 border-t bg-muted/30 p-4 flex justify-end gap-3">
        <Button
          onClick={() => onDelete(call)}
          variant="ghost"
          size="icon"
          className="text-destructive hover:bg-destructive/10"
          title="Excluir Solicitação"
        >
          <Trash2 size={16} />
        </Button>
        <Button
          onClick={() => onReject(call)}
          variant="destructive"
          size="sm"
          className="rounded-lg"
        >
          <X size={16} className="mr-1.5" /> Rejeitar
        </Button>
        <Button
          onClick={() => onApprove(call)}
          variant="default"
          size="sm"
          className="bg-green-600 hover:bg-green-700 rounded-lg"
        >
          <CheckCircle size={16} className="mr-1.5" /> Aprovar
        </Button>
      </CardFooter>
    </Card>
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

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  calls,
  drivers,
  updateCall,
  onDeleteCall,
  onDeletePermanently,
  onDeleteAllExcluded,
}) => {
  // ... (Estados)
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

  // ... (Funções)
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

  const handleContactDriver = (phone: string) => {
    if (!phone) {
      sonnerToast.error("Número de telefone não disponível.");
      return;
    }
    const message = encodeURIComponent(
      `Olá, preciso de informações sobre um chamado de apoio.`
    );
    window.open(`https://wa.me/55${phone}?text=${message}`, "_blank");
  };

  const handleUpdateStatus = (
    callId: string,
    updates: Partial<Omit<SupportCall, "id">>
  ) => {
    updateCall(callId, updates);
    const status = (updates.status || "").replace("_", " ");
    sonnerToast.info(`Chamado movido para ${status}`);
  };

  // ... (Memos)
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

  // *** CORREÇÃO: Variáveis movidas para o escopo correto ***
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

  // --- Controles de Filtro (Reestilizados) ---
  const filterControls = (
    <div className="flex flex-wrap gap-1">
      {(["TODOS", "URGENTE", "ALTA", "MEDIA", "BAIXA"] as const).map(
        (level) => (
          <Button
            key={level}
            onClick={() => setUrgencyFilter(level)}
            variant={urgencyFilter === level ? "default" : "secondary"}
            size="sm"
            className={`text-xs h-7 px-2.5 rounded-full ${
              urgencyFilter === level ? "shadow-sm" : "text-muted-foreground"
            }`}
          >
            {level === "TODOS"
              ? "Todos"
              : level.charAt(0) + level.slice(1).toLowerCase()}
          </Button>
        )
      )}
    </div>
  );

  const driverFilterControls = (
    <div className="flex flex-col gap-2 w-full">
      <select
        value={driverHubFilter}
        onChange={(e) => setDriverHubFilter(e.target.value)}
        className="w-full p-2 border border-border rounded-md text-sm bg-background text-foreground focus:ring-primary focus:border-primary"
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
        className="w-full p-2 border border-border rounded-md text-sm bg-background text-foreground capitalize focus:ring-primary focus:border-primary"
      >
        {vehicleTypes.map((v) => (
          <option key={v} value={v} className="capitalize">
            {v}
          </option>
        ))}
      </select>
    </div>
  );

  // --- RETURN PRINCIPAL (JSX Reestilizado) ---
  return (
    <div className="bg-background min-h-screen font-sans flex flex-col">
      <header className="p-4 sm:p-6 border-b border-border sticky top-0 bg-background z-20">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <img src={spxLogo} alt="SPX Logo" className="w-10 h-10" />
            <div>
              <h1 className="text-2xl font-bold text-primary">
                Painel do Admin
              </h1>
              <p className="text-muted-foreground text-sm">
                Sistema de Apoio Logístico - SPX
              </p>
            </div>
          </div>
          <div className="w-full sm:w-auto sm:min-w-[250px]">
            <select
              value={globalHubFilter}
              onChange={(e) => setGlobalHubFilter(e.target.value)}
              className="w-full p-2 border border-border rounded-md text-sm bg-background text-foreground shadow-sm focus:ring-primary focus:border-primary"
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

      <nav className="px-4 sm:px-6 border-b border-border sticky top-[calc(theme(spacing.24)-1px)] sm:top-[calc(theme(spacing.24)+1px)] bg-background z-20">
        <div className="flex space-x-1 sm:space-x-4 overflow-x-auto">
          <button
            onClick={() => setAdminView("kanban")}
            className={`py-3 px-2 text-sm font-semibold whitespace-nowrap transition-colors ${
              adminView === "kanban"
                ? "border-b-2 border-primary text-primary"
                : "border-b-2 border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Acompanhamento
          </button>
          <button
            onClick={() => setAdminView("approvals")}
            className={`py-3 px-2 text-sm font-semibold whitespace-nowrap relative transition-colors ${
              adminView === "approvals"
                ? "border-b-2 border-primary text-primary"
                : "border-b-2 border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Aprovações
            {pendingApprovalCalls.length > 0 && (
              <span className="absolute top-2 -right-3 w-5 h-5 bg-destructive text-destructive-foreground text-xs font-bold rounded-full flex items-center justify-center">
                {pendingApprovalCalls.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setAdminView("excluded")}
            className={`py-3 px-2 text-sm font-semibold whitespace-nowrap transition-colors ${
              adminView === "excluded"
                ? "border-b-2 border-primary text-primary"
                : "border-b-2 border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Lixeira
          </button>
          <button
            onClick={() => setAdminView("history")}
            className={`py-3 px-2 text-sm font-semibold whitespace-nowrap transition-colors ${
              adminView === "history"
                ? "border-b-2 border-primary text-primary"
                : "border-b-2 border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Histórico
          </button>
        </div>
      </nav>

      <main className="flex-grow bg-muted/20 dark:bg-black/20 p-4 sm:p-6">
        {adminView === "kanban" && (
          <div className="flex-grow flex flex-col space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <SummaryCard
                title="Abertos"
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
                title="Drivers Disponíveis"
                value={availableDrivers.length}
                icon={<Users />}
                subtext="Prontos para apoio"
                colorClass="#8B5CF6"
              />
            </div>

            <ResizablePanelGroup
              direction="horizontal"
              className="flex-grow rounded-xl border border-border bg-card shadow-sm min-h-[600px]"
            >
              <ResizablePanel defaultSize={25} minSize={15}>
                <KanbanColumn
                  title="Chamados Abertos"
                  count={filteredOpenCalls.length}
                  colorClass="#F59E0B"
                  headerControls={filterControls}
                >
                  {filteredOpenCalls.map((call) => {
                    const requester = drivers.find(
                      (d) => d.uid === call.solicitante.id
                    );
                    if (!requester) return null;
                    const assignedDriver = call.assignedTo
                      ? drivers.find((d) => d.uid === call.assignedTo)
                      : undefined;
                    return (
                      <SupportCallCard
                        key={call.id}
                        call={call}
                        requester={requester}
                        assignedDriver={assignedDriver}
                        onContactRequester={() =>
                          requester.phone &&
                          handleContactDriver(requester.phone)
                        }
                        onContactAssigned={() =>
                          assignedDriver?.phone &&
                          handleContactDriver(assignedDriver.phone)
                        }
                        onCardClick={() => setSelectedCall(call)}
                        statusColorClass="border-orange-500"
                      />
                    );
                  })}
                </KanbanColumn>
              </ResizablePanel>
              <ResizableHandle className="w-2 bg-muted hover:bg-primary/20 transition-colors flex items-center justify-center">
                <div className="w-1 h-10 bg-border rounded-full" />
              </ResizableHandle>
              <ResizablePanel defaultSize={25} minSize={15}>
                <KanbanColumn
                  title="Em Andamento"
                  count={inProgressCalls.length}
                  colorClass="#3B82F6"
                >
                  {inProgressCalls.map((call) => {
                    const requester = drivers.find(
                      (d) => d.uid === call.solicitante.id
                    );
                    if (!requester) return null;
                    const assignedDriver = call.assignedTo
                      ? drivers.find((d) => d.uid === call.assignedTo)
                      : undefined;
                    return (
                      <SupportCallCard
                        key={call.id}
                        call={call}
                        requester={requester}
                        assignedDriver={assignedDriver}
                        onContactRequester={() =>
                          requester.phone &&
                          handleContactDriver(requester.phone)
                        }
                        onContactAssigned={() =>
                          assignedDriver?.phone &&
                          handleContactDriver(assignedDriver.phone)
                        }
                        onCardClick={() => setSelectedCall(call)}
                        statusColorClass="border-blue-500"
                      />
                    );
                  })}
                </KanbanColumn>
              </ResizablePanel>
              <ResizableHandle className="w-2 bg-muted hover:bg-primary/20 transition-colors flex items-center justify-center">
                <div className="w-1 h-10 bg-border rounded-full" />
              </ResizableHandle>
              <ResizablePanel defaultSize={25} minSize={15}>
                <KanbanColumn
                  title="Concluídos"
                  count={concludedCalls.length}
                  colorClass="#10B981"
                >
                  {concludedCalls.map((call) => {
                    const requester = drivers.find(
                      (d) => d.uid === call.solicitante.id
                    );
                    if (!requester) return null;
                    const assignedDriver = call.assignedTo
                      ? drivers.find((d) => d.uid === call.assignedTo)
                      : undefined;
                    return (
                      <SupportCallCard
                        key={call.id}
                        call={call}
                        requester={requester}
                        assignedDriver={assignedDriver}
                        onContactRequester={() =>
                          requester.phone &&
                          handleContactDriver(requester.phone)
                        }
                        onContactAssigned={() =>
                          assignedDriver?.phone &&
                          handleContactDriver(assignedDriver.phone)
                        }
                        onCardClick={() => setSelectedCall(call)}
                        statusColorClass="border-green-500"
                      />
                    );
                  })}
                </KanbanColumn>
              </ResizablePanel>
              <ResizableHandle className="w-2 bg-muted hover:bg-primary/20 transition-colors flex items-center justify-center">
                <div className="w-1 h-10 bg-border rounded-full" />
              </ResizableHandle>
              <ResizablePanel defaultSize={25} minSize={15}>
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
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        )}

        {adminView === "approvals" && (
          <div>
            <h2 className="text-xl font-bold text-foreground mb-4">
              Aprovações Pendentes
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                <Card className="md:col-span-2 lg:col-span-3 text-center py-10 px-4 shadow-sm bg-card">
                  <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-semibold text-foreground">
                    Tudo certo!
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Não há solicitações pendentes de aprovação.
                  </p>
                </Card>
              )}
            </div>
          </div>
        )}

        {adminView === "history" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-foreground">
              Histórico de Solicitações
            </h2>
            <Card className="shadow-lg bg-card">
              <CardContent className="p-4 flex flex-wrap gap-4 items-end">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Data Início
                  </label>
                  <input
                    type="date"
                    value={tempHistoryFilters.start}
                    onChange={(e) =>
                      handleHistoryFilterChange("start", e.target.value)
                    }
                    className="w-full p-2 border border-border rounded-md bg-background text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Data Fim
                  </label>
                  <input
                    type="date"
                    value={tempHistoryFilters.end}
                    onChange={(e) =>
                      handleHistoryFilterChange("end", e.target.value)
                    }
                    className="w-full p-2 border border-border rounded-md bg-background text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Hub
                  </label>
                  <select
                    value={tempHistoryFilters.hub}
                    onChange={(e) =>
                      handleHistoryFilterChange("hub", e.target.value)
                    }
                    className="w-full sm:w-[200px] p-2 border border-border rounded-md bg-background text-sm"
                  >
                    {allHubs.map((hub) => (
                      <option key={hub} value={hub}>
                        {hub}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    ID da Rota
                  </label>
                  <input
                    type="text"
                    placeholder="Digite o ID da rota..."
                    value={tempHistoryFilters.routeId}
                    onChange={(e) =>
                      handleHistoryFilterChange("routeId", e.target.value)
                    }
                    className="w-full sm:w-[200px] p-2 border border-border rounded-md bg-background text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Status
                  </label>
                  <select
                    value={tempHistoryFilters.status}
                    onChange={(e) =>
                      handleHistoryFilterChange("status", e.target.value)
                    }
                    className="w-full sm:w-[180px] p-2 border border-border rounded-md bg-background text-sm"
                  >
                    <option value="Todos">Todos</option>
                    <option value="Concluidas">Concluídas</option>
                    <option value="Nao Concluidas">Não Concluídas</option>
                  </select>
                </div>
                <Button
                  onClick={handleApplyHistoryFilters}
                  className="rounded-lg h-10"
                >
                  <Search size={16} className="mr-1.5" /> Filtrar
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-lg bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-foreground">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
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
                            "dd/MM/yy HH:mm",
                            { locale: ptBR }
                          )
                        : "N/A";

                      return (
                        <tr
                          key={call.id}
                          className="bg-card border-b border-border hover:bg-muted/50"
                        >
                          <td className="px-6 py-4 font-medium text-foreground whitespace-nowrap">
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
            </Card>
          </div>
        )}

        {adminView === "excluded" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-foreground">
                Solicitações Excluídas
              </h2>
              {excludedCalls.length > 0 && (
                <Button
                  onClick={handleClearAllClick}
                  variant="destructive"
                  size="sm"
                  className="rounded-lg"
                >
                  <Trash2 size={14} className="mr-1.5" /> Limpar Tudo
                </Button>
              )}
            </div>
            <Card className="p-4 bg-card shadow-md">
              <div className="flex flex-col sm:flex-row gap-4">
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
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            : new Date(
                                (deletedTimestamp as any).seconds * 1000
                              ),
                          "dd/MM/yyyy 'às' HH:mm",
                          { locale: ptBR }
                        )
                      : "Data indisponível";
                    return (
                      <Card
                        key={call.id}
                        className="p-4 shadow-md bg-card flex flex-col sm:flex-row justify-between items-start gap-4"
                      >
                        <div className="flex-grow">
                          <p className="font-semibold text-foreground">
                            {call.solicitante.name}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {call.description}
                          </p>
                          {call.deletedAt && (
                            <p className="text-xs text-muted-foreground/70 mt-1">
                              Excluído em: {formattedDeletedDate}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            onClick={() => handleRestore(call.id)}
                            variant="outline"
                            size="sm"
                            className="text-green-600 border-green-500 hover:bg-green-100 hover:text-green-700"
                          >
                            <RotateCcw size={14} className="mr-1.5" /> Restaurar
                          </Button>
                          <Button
                            onClick={() => handlePermanentDeleteClick(call)}
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:bg-destructive/10"
                            title="Excluir Permanentemente"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </Card>
                    );
                  })
              ) : (
                <Card className="md:col-span-2 text-center py-10 px-4 shadow-sm bg-card">
                  <Trash2 className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-semibold text-foreground">
                    Lixeira vazia
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Não há solicitações excluídas.
                  </p>
                </Card>
              )}
            </div>
          </div>
        )}
      </main>

      {/* --- Modais --- */}
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
        onUpdateStatus={handleUpdateStatus} // CORREÇÃO: Passando a função correta
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
