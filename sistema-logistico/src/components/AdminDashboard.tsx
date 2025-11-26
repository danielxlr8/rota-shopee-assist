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
  LucideIcon,
  CalendarDays,
  ListFilter,
  ChevronDown,
  LayoutDashboard,
  CheckCheck,
  History,
  PanelLeft,
  PanelRight,
  Phone,
  User,
  Volume2,
  VolumeX,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Timestamp,
  doc,
  updateDoc,
  deleteField,
  // serverTimestamp removido pois não estava sendo usado
} from "firebase/firestore";
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

// --- NOVA FUNÇÃO DE CONTATO (WhatsApp) ---
const handleContactDriver = (phone: string | undefined) => {
  if (phone) {
    const message = encodeURIComponent(
      `Olá, estou entrando em contato referente a um chamado de apoio.`
    );
    window.open(`https://wa.me/55${phone}?text=${message}`, "_blank");
  } else {
    sonnerToast.error("Número de telefone não disponível.");
  }
};

// --- COMPONENTE: EnhancedDriverCard ---
const EnhancedDriverCard = ({
  driver,
  onInfoClick,
}: {
  driver: Driver;
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
        className="text-green-500 border-green-500/50 dark:text-green-400 dark:border-green-400/50"
      >
        Disponível
      </Badge>
      <Button
        onClick={() => handleContactDriver(driver.phone)}
        size="sm"
        className="h-7 text-xs rounded-lg"
      >
        Acionar
      </Button>
    </div>
  </Card>
);

// --- COMPONENTE: SearchableSelect ---
const SearchableSelect = ({
  options,
  value,
  onChange,
  placeholder,
  icon: Icon,
}: {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  icon: LucideIcon;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);
  const filteredOptions = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase();
    const allOption = options.find((option) =>
      option.toLowerCase().startsWith("todos")
    );
    const filtered = options.filter(
      (option) =>
        option.toLowerCase().includes(lowerSearch) &&
        !option.toLowerCase().startsWith("todos")
    );
    return allOption ? [allOption, ...filtered] : filtered;
  }, [options, searchTerm]);
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);
  const handleSelect = (option: string) => {
    onChange(option);
    setSearchTerm("");
    setIsOpen(false);
  };
  const displayValue = isOpen ? searchTerm : value;
  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="relative">
        <Icon
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          size={16}
        />
        <input
          type="text"
          placeholder={placeholder}
          value={displayValue}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (!isOpen) setIsOpen(true);
            if (e.target.value === "") {
              const allOption = options.find((opt) =>
                opt.toLowerCase().startsWith("todos")
              );
              if (allOption) onChange(allOption);
            }
          }}
          onFocus={() => {
            setSearchTerm("");
            setIsOpen(true);
          }}
          className="w-full pl-10 pr-8 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary font-sans"
        />
        <ChevronDown
          className={`absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          size={16}
        />
      </div>
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto text-sm">
          <ul>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <li
                  key={index}
                  onClick={() => handleSelect(option)}
                  className="px-4 py-2 hover:bg-muted cursor-pointer capitalize"
                >
                  {option.toLowerCase().replace(/_/g, " ")}
                </li>
              ))
            ) : (
              <li className="px-4 py-2 text-muted-foreground">
                Nenhuma opção encontrada.
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

// --- COMPONENTE: SearchInput ---
const SearchInput = ({
  value,
  onChange,
  placeholder,
  icon: Icon,
  type = "text",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  icon: LucideIcon;
  type?: string;
}) => (
  <div className="relative w-full">
    <Icon
      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
      size={16}
    />
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary font-sans"
    />
  </div>
);

// --- COMPONENTE: ConfirmationModal ---
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
      <Card className="w-full max-w-md bg-card">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-foreground">
            {title}
          </CardTitle>
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

// --- COMPONENTE: CallDetailsModal ---
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
  const cleanDescription = (desc: string) => {
    if (desc.includes("Aqui está a descrição")) {
      const parts = desc.split('"');
      return parts[1] || desc;
    }
    return desc;
  };
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg relative bg-card">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground"
        >
          <X size={20} />
        </button>
        <CardHeader>
          <CardTitle className="text-xl font-bold text-foreground">
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
          <div className="font-sans text-base font-medium text-foreground bg-muted/50 p-3 rounded-md whitespace-pre-wrap">
            {cleanDescription(call.description)}
          </div>
        </CardContent>
        <CardFooter className="mt-2 pt-4 border-t border-border flex flex-wrap justify-between items-center gap-4">
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

// --- COMPONENTE: CallCard ---
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
  const cleanDescription = (desc: string) => {
    if (desc.includes("Aqui está a descrição")) {
      const parts = desc.split('"');
      return parts[1] || desc;
    }
    return desc;
  };

  return (
    <div
      className={cn(
        "bg-card p-4 rounded-lg shadow-md border border-border space-y-3 hover:shadow-lg transition-shadow cursor-pointer",
        call.urgency === "URGENTE" && "animate-blink"
      )}
      onClick={() => onClick(call)}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-3">
          <AvatarComponent user={call.solicitante} />
          <div>
            <div className="flex items-center gap-2">
              <p className="font-bold text-foreground">
                {call.solicitante.name}
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(call);
                }}
                className="p-1 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                title="Excluir Solicitação"
              >
                <Trash2 size={14} />
              </button>
            </div>
            <p className="text-sm text-muted-foreground">Solicitante</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <UrgencyBadge urgency={call.urgency} />
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 rounded-full text-green-500 hover:bg-green-500/10 hover:text-green-600"
            onClick={(e) => {
              e.stopPropagation();
              handleContactDriver(call.solicitante.phone);
            }}
          >
            <Phone size={16} />
          </Button>
        </div>
      </div>
      <div className="text-sm text-muted-foreground space-y-2">
        <div className="flex items-center space-x-2">
          <Ticket size={16} className="text-primary" />
          <span>{call.routeId || "N/A"}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Building size={16} className="text-primary" />
          <span>{call.hub || "N/A"}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Clock size={16} className="text-muted-foreground" />
          <span>{timeAgo}</span>
        </div>
        <div className="flex items-center space-x-2">
          <MapPin size={16} className="text-primary" />
          <span>{call.location}</span>
        </div>
      </div>
      <p className="font-sans text-base font-medium text-foreground bg-muted/50 p-3 rounded-md whitespace-pre-wrap">
        {cleanDescription(call.description)}
      </p>
    </div>
  );
};

// --- COMPONENTE: ApprovalCard ---
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
  const cleanDescription = (desc: string) => {
    if (desc.includes("Aqui está a descrição")) {
      const parts = desc.split('"');
      return parts[1] || desc;
    }
    return desc;
  };

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
          <div className="flex flex-col items-end gap-2">
            <UrgencyBadge urgency={call.urgency} />
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 rounded-full text-green-500 hover:bg-green-500/10 hover:text-green-600"
              onClick={(e) => {
                e.stopPropagation();
                handleContactDriver(call.solicitante.phone);
              }}
            >
              <Phone size={16} />
            </Button>
          </div>
        </div>
        {assignedDriver && (
          <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground pl-1 pt-3">
            <div className="flex items-center gap-3">
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
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 rounded-full text-green-500 hover:bg-green-500/10 hover:text-green-600"
              onClick={(e) => {
                e.stopPropagation();
                handleContactDriver(assignedDriver.phone);
              }}
            >
              <Phone size={16} />
            </Button>
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
        <p className="font-sans text-base font-medium text-foreground bg-muted/50 p-3 rounded-md whitespace-pre-wrap">
          {cleanDescription(call.description)}
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

const viewTitles: Record<string, string> = {
  kanban: "Acompanhamento Operacional",
  approvals: "Aprovações Pendentes",
  excluded: "Solicitações Excluídas (Lixeira)",
  history: "Histórico de Solicitações",
  profile: "Perfil e Configurações",
};

type AdminView = "kanban" | "approvals" | "excluded" | "history" | "profile";

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  calls,
  drivers,
  updateCall,
  onDeleteCall,
  onDeletePermanently,
  onDeleteAllExcluded,
}) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [urgencyFilter, setUrgencyFilter] = useState<UrgencyLevel | "TODOS">(
    "TODOS"
  );
  const [adminView, setAdminView] = useState<AdminView>("kanban");
  const [infoModalDriver, setInfoModalDriver] = useState<Driver | null>(null);
  const [callToConfirm, setCallToConfirm] = useState<SupportCall | null>(null);
  const [confirmationType, setConfirmationType] = useState<
    "soft-delete" | "permanent-delete" | "clear-all" | null
  >(null);
  const [excludedNameFilter, setExcludedNameFilter] = useState("");
  const [excludedHubFilter, setExcludedHubFilter] = useState("Todos os Hubs");
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

  const toggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    localStorage.setItem("notificationsMuted", String(newMutedState));
    if (!newMutedState) {
      const audio = new Audio("/shopee-ringtone.mp3");
      audio.volume = 0.3;
      audio.play().catch(() => {});
    }
    sonnerToast.success(
      newMutedState
        ? "Som das notificações desativado."
        : "Som das notificações ativado."
    );
  };

  useEffect(() => {
    const savedMutePreference = localStorage.getItem("notificationsMuted");
    setIsMuted(savedMutePreference === "true");
  }, []);

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
      return (
        call.status === "ABERTO" &&
        prevStatus !== "ABERTO" &&
        !notifiedCallIds.current.has(call.id)
      );
    });

    if (newOpenCalls.length > 0) {
      if (!isMuted) {
        const audio = new Audio("/shopee-ringtone.mp3");
        audio.play().catch((e) => console.error("Erro ao tocar o som:", e));
      }

      newOpenCalls.forEach((newCall) => {
        sonnerToast.custom(
          (t) => (
            <div className="flex w-full max-w-sm items-center gap-4 rounded-lg bg-card p-4 shadow-lg ring-1 ring-border">
              <AlertTriangle size={32} className="text-primary flex-shrink-0" />
              <div className="flex-1">
                <p className="text-lg font-bold text-foreground">
                  Novo Chamado Aberto!
                </p>
                <p className="text-base text-muted-foreground">
                  {newCall.solicitante.name} do hub{" "}
                  {newCall.hub || "desconhecido"} precisa de apoio.
                </p>
              </div>
              <button
                onClick={() => sonnerToast.dismiss(t)}
                className="absolute top-2 right-2 p-1 rounded-md text-muted-foreground opacity-70 hover:opacity-100 hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <X size={16} />
              </button>
            </div>
          ),
          { duration: 10000 }
        );
        notifiedCallIds.current.add(newCall.id);
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
  }, [calls, isMuted]);

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
      sonnerToast.success("Chamado movido para a lixeira.");
    } else if (confirmationType === "permanent-delete" && callToConfirm) {
      onDeletePermanently(callToConfirm.id);
      sonnerToast.success("Chamado excluído permanentemente.");
    } else if (confirmationType === "clear-all") {
      onDeleteAllExcluded();
      sonnerToast.success("Lixeira esvaziada com sucesso.");
    }
    closeModal();
  };
  const closeModal = () => {
    setCallToConfirm(null);
    setConfirmationType(null);
  };

  const handleRestore = (callId: string) => {
    updateCall(callId, { status: "ABERTO", deletedAt: deleteField() });
    notifiedCallIds.current.add(callId);
    sonnerToast.custom((t) => (
      <div className="flex w-full max-w-sm items-center gap-4 rounded-lg bg-card p-4 shadow-lg ring-1 ring-border">
        <RotateCcw size={28} className="text-green-500 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-base font-semibold text-foreground">
            Chamado Restaurado
          </p>
          <p className="text-sm text-muted-foreground">
            O chamado foi movido de volta para "Abertos".
          </p>
        </div>
        <button
          onClick={() => sonnerToast.dismiss(t)}
          className="p-1 rounded-md text-muted-foreground opacity-70 hover:opacity-100 hover:bg-muted"
        >
          <X size={16} />
        </button>
      </div>
    ));
  };

  const handleUpdateStatus = (
    callId: string,
    updates: Partial<Omit<SupportCall, "id">>
  ) => {
    updateCall(callId, updates);
    const status = (updates.status || "").replace("_", " ");
    sonnerToast.info(`Chamado movido para ${status}`);
    setSelectedCall(null);
  };

  const filteredCalls = useMemo(
    () =>
      calls.filter(
        (call) =>
          globalHubFilter === "Todos os Hubs" || call.hub === globalHubFilter
      ),
    [calls, globalHubFilter]
  );
  const filteredDrivers = useMemo(
    () =>
      drivers.filter(
        (driver) =>
          globalHubFilter === "Todos os Hubs" || driver.hub === globalHubFilter
      ),
    [drivers, globalHubFilter]
  );
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
        ...new Set(drivers.map((d) => d.hub).filter((h): h is string => !!h)),
      ].sort(),
    [drivers]
  );
  const allHubsForFilter = useMemo(
    () =>
      [
        "Todos os Hubs",
        ...new Set(calls.map((c) => c.hub).filter((h): h is string => !!h)),
      ].sort(),
    [calls]
  );
  const allHubs = useMemo(
    () =>
      [
        "Todos",
        ...new Set(calls.map((c) => c.hub).filter((h): h is string => !!h)),
      ].sort(),
    [calls]
  );
  const vehicleTypes = useMemo(
    () =>
      [
        "Todos os Veículos",
        ...new Set(
          drivers.map((d) => d.vehicleType).filter((v): v is string => !!v)
        ),
      ].sort(),
    [drivers]
  );
  const excludedCallHubs = useMemo(
    () =>
      [
        "Todos os Hubs",
        ...new Set(
          excludedCalls.map((c) => c.hub).filter((h): h is string => !!h)
        ),
      ] as string[],
    [excludedCalls]
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
          (call.status === "CONCLUIDO" || call.status === "ARQUIVADO")
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
  const filteredExcludedCalls = useMemo(() => {
    return excludedCalls
      .filter(
        (call) =>
          excludedNameFilter === "" ||
          call.solicitante.name
            .toLowerCase()
            .includes(excludedNameFilter.toLowerCase())
      )
      .filter((call) =>
        excludedHubFilter === "" || excludedHubFilter === "Todos os Hubs"
          ? true
          : call.hub === excludedHubFilter
      );
  }, [excludedCalls, excludedNameFilter, excludedHubFilter]);

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
    <div className="flex flex-col gap-3 w-full">
      <SearchableSelect
        options={availableDriverHubs}
        value={driverHubFilter}
        onChange={setDriverHubFilter}
        placeholder="Filtrar por Hub..."
        icon={Building}
      />
      <SearchableSelect
        options={vehicleTypes}
        value={driverVehicleFilter}
        onChange={setDriverVehicleFilter}
        placeholder="Filtrar por Veículo..."
        icon={Truck}
      />
    </div>
  );
  const activeCallForDriver = infoModalDriver
    ? calls.find(
        (c) =>
          c.assignedTo === infoModalDriver.uid &&
          (c.status === "EM ANDAMENTO" || c.status === "AGUARDANDO_APROVACAO")
      ) || null
    : null;

  return (
    <TooltipProvider>
      <div className="flex min-h-screen bg-background text-foreground">
        <aside
          className={cn(
            
            isSidebarCollapsed ? "w-20" : "w-64"
          )}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                className={cn(
                  "absolute top-4 -right-4 z-20 rounded-full w-8 h-8",
                  !isSidebarCollapsed && "text-primary"
                )}
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              >
                {isSidebarCollapsed ? (
                  <PanelRight size={18} />
                ) : (
                  <PanelLeft size={18} />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {isSidebarCollapsed ? "Expandir menu" : "Recolher menu"}
            </TooltipContent>
          </Tooltip>

          <div
            className={cn(
              "flex items-center gap-3 px-2 transition-all",
              isSidebarCollapsed && "justify-center"
            )}
          >
            <img
              src={spxLogo}
              alt="SPX Logo"
              className="w-10 h-10 flex-shrink-0"
            />
            <div
              className={cn(
                "overflow-hidden transition-all duration-200",
                isSidebarCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
              )}
            >
              <h1 className="text-xl font-bold text-primary whitespace-nowrap">
                Central SPX
              </h1>
              <p className="text-muted-foreground text-xs">Apoio Logístico</p>
            </div>
          </div>

          <nav className="flex flex-col gap-2 flex-grow">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={adminView === "kanban" ? "secondary" : "ghost"}
                  className={cn(
                    "gap-2",
                    adminView === "kanban" && "text-primary font-semibold",
                    isSidebarCollapsed ? "justify-center" : "justify-start"
                  )}
                  onClick={() => setAdminView("kanban")}
                >
                  <LayoutDashboard size={18} />
                  <span
                    className={cn(
                      "transition-opacity",
                      isSidebarCollapsed && "opacity-0 hidden"
                    )}
                  >
                    Acompanhamento
                  </span>
                </Button>
              </TooltipTrigger>
              {isSidebarCollapsed && (
                <TooltipContent side="right">Acompanhamento</TooltipContent>
              )}
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={adminView === "approvals" ? "secondary" : "ghost"}
                  className={cn(
                    "gap-2 relative",
                    adminView === "approvals" && "text-primary font-semibold",
                    isSidebarCollapsed ? "justify-center" : "justify-start"
                  )}
                  onClick={() => setAdminView("approvals")}
                >
                  <CheckCheck size={18} />
                  <span
                    className={cn(
                      "transition-opacity",
                      isSidebarCollapsed && "opacity-0 hidden"
                    )}
                  >
                    Aprovações
                  </span>
                  {pendingApprovalCalls.length > 0 && (
                    <Badge
                      variant="destructive"
                      className={cn(
                        "absolute right-3 top-1/2 -translate-y-1/2 h-5 px-1.5 text-xs",
                        isSidebarCollapsed && "top-0 -right-1"
                      )}
                    >
                      {pendingApprovalCalls.length}
                    </Badge>
                  )}
                </Button>
              </TooltipTrigger>
              {isSidebarCollapsed && (
                <TooltipContent side="right">Aprovações</TooltipContent>
              )}
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={adminView === "excluded" ? "secondary" : "ghost"}
                  className={cn(
                    "gap-2",
                    adminView === "excluded" && "text-primary font-semibold",
                    isSidebarCollapsed ? "justify-center" : "justify-start"
                  )}
                  onClick={() => setAdminView("excluded")}
                >
                  <Trash2 size={18} />
                  <span
                    className={cn(
                      "transition-opacity",
                      isSidebarCollapsed && "opacity-0 hidden"
                    )}
                  >
                    Lixeira
                  </span>
                </Button>
              </TooltipTrigger>
              {isSidebarCollapsed && (
                <TooltipContent side="right">Lixeira</TooltipContent>
              )}
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={adminView === "history" ? "secondary" : "ghost"}
                  className={cn(
                    "gap-2",
                    adminView === "history" && "text-primary font-semibold",
                    isSidebarCollapsed ? "justify-center" : "justify-start"
                  )}
                  onClick={() => setAdminView("history")}
                >
                  <History size={18} />
                  <span
                    className={cn(
                      "transition-opacity",
                      isSidebarCollapsed && "opacity-0 hidden"
                    )}
                  >
                    Histórico
                  </span>
                </Button>
              </TooltipTrigger>
              {isSidebarCollapsed && (
                <TooltipContent side="right">Histórico</TooltipContent>
              )}
            </Tooltip>
          </nav>

          <div className="mt-auto">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={adminView === "profile" ? "secondary" : "ghost"}
                  className={cn(
                    "gap-2 w-full",
                    adminView === "profile" && "text-primary font-semibold",
                    isSidebarCollapsed ? "justify-center" : "justify-start"
                  )}
                  onClick={() => setAdminView("profile")}
                >
                  <User size={18} />
                  <span
                    className={cn(
                      "transition-opacity",
                      isSidebarCollapsed && "opacity-0 hidden"
                    )}
                  >
                    Perfil
                  </span>
                </Button>
              </TooltipTrigger>
              {isSidebarCollapsed && (
                <TooltipContent side="right">Perfil</TooltipContent>
              )}
            </Tooltip>
          </div>
        </aside>

        <div className="flex-1 flex flex-col overflow-y-auto">
          <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border p-4 sm:p-6 flex justify-between items-center">
            <h2 className="text-xl font-semibold">{viewTitles[adminView]}</h2>
            <div className="w-full sm:w-auto sm:min-w-[250px]">
              <SearchableSelect
                options={allHubsForFilter}
                value={globalHubFilter}
                onChange={setGlobalHubFilter}
                placeholder="Filtrar Hub Global..."
                icon={Building}
              />
            </div>
          </header>
          <main className="flex-grow p-4 sm:p-6 space-y-6">
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
                  className="flex-grow rounded-xl border border-border bg-transparent shadow-sm min-h-[600px]"
                >
                  <ResizablePanel defaultSize={25} minSize={15}>
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
                      {inProgressCalls.map((call) => (
                        <CallCard
                          key={call.id}
                          call={call}
                          onDelete={handleDeleteClick}
                          onClick={setSelectedCall}
                        />
                      ))}
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
                      {concludedCalls.map((call) => (
                        <CallCard
                          key={call.id}
                          call={call}
                          onDelete={handleDeleteClick}
                          onClick={setSelectedCall}
                        />
                      ))}
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
                          onInfoClick={() => setInfoModalDriver(driver)}
                        />
                      ))}
                    </KanbanColumn>
                  </ResizablePanel>
                </ResizablePanelGroup>
              </div>
            )}
            {adminView === "approvals" && (
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
            )}
            {adminView === "history" && (
              <div className="space-y-6">
                <Card className="shadow-lg bg-card">
                  <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 items-end">
                    <div className="lg:col-span-1">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Data Início
                      </label>
                      <SearchInput
                        value={tempHistoryFilters.start}
                        onChange={(value) =>
                          handleHistoryFilterChange("start", value)
                        }
                        placeholder="Data de Início"
                        icon={CalendarDays}
                        type="date"
                      />
                    </div>
                    <div className="lg:col-span-1">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Data Fim
                      </label>
                      <SearchInput
                        value={tempHistoryFilters.end}
                        onChange={(value) =>
                          handleHistoryFilterChange("end", value)
                        }
                        placeholder="Data Final"
                        icon={CalendarDays}
                        type="date"
                      />
                    </div>
                    <div className="lg:col-span-1">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Hub
                      </label>
                      <SearchableSelect
                        options={allHubs}
                        value={tempHistoryFilters.hub}
                        onChange={(value) =>
                          handleHistoryFilterChange("hub", value)
                        }
                        placeholder="Filtrar por Hub..."
                        icon={Building}
                      />
                    </div>
                    <div className="lg:col-span-1">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        ID da Rota
                      </label>
                      <SearchInput
                        value={tempHistoryFilters.routeId}
                        onChange={(value) =>
                          handleHistoryFilterChange("routeId", value)
                        }
                        placeholder="Pesquisar ID da Rota..."
                        icon={Ticket}
                      />
                    </div>
                    <div className="lg:col-span-1">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Status
                      </label>
                      <SearchableSelect
                        options={["Todos", "Concluidas", "Nao Concluidas"]}
                        value={tempHistoryFilters.status}
                        onChange={(value) =>
                          handleHistoryFilterChange("status", value)
                        }
                        placeholder="Filtrar por Status..."
                        icon={ListFilter}
                      />
                    </div>
                    <Button
                      onClick={handleApplyHistoryFilters}
                      className="rounded-lg h-10 w-full xl:w-auto"
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
                                  : new Date(
                                      (callTimestamp as any).seconds * 1000
                                    ),
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
                              <td className="px-6 py-4">
                                {call.status.replace("_", " ")}
                              </td>
                              <td className="px-6 py-4">{formattedDate}</td>
                              <td className="px-6 py-4">
                                {call.approvedBy || "N/A"}
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
                    <SearchInput
                      value={excludedNameFilter}
                      onChange={setExcludedNameFilter}
                      placeholder="Filtrar por nome..."
                      icon={Search}
                    />
                    <SearchableSelect
                      options={excludedCallHubs}
                      value={excludedHubFilter}
                      onChange={setExcludedHubFilter}
                      placeholder="Filtrar por hub..."
                      icon={Building}
                    />
                  </div>
                </Card>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredExcludedCalls.length > 0 ? (
                    filteredExcludedCalls.map((call) => {
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
                          className="p-4 shadow-md bg-card flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
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
                              className="text-green-500 border-green-500/50 dark:text-green-400 dark:border-green-400/50 hover:bg-green-500/10"
                            >
                              <RotateCcw size={14} className="mr-1.5" />{" "}
                              Restaurar
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
            {adminView === "profile" && (
              <div className="space-y-6 max-w-2xl">
                <Card className="shadow-lg bg-card">
                  <CardHeader>
                    <CardTitle>Configurações do Painel</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        {isMuted ? (
                          <VolumeX size={20} />
                        ) : (
                          <Volume2 size={20} />
                        )}
                        <label
                          htmlFor="mute-toggle"
                          className="text-base font-medium"
                        >
                          Som das Notificações
                        </label>
                      </div>
                      <Button
                        id="mute-toggle"
                        onClick={toggleMute}
                        variant={isMuted ? "secondary" : "default"}
                        size="sm"
                        className="w-28"
                      >
                        {isMuted ? "Ativar Som" : "Mutar Som"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-lg bg-card">
                  <CardHeader>
                    <CardTitle>Editar Perfil</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      (Em breve) Aqui você poderá editar seu nome, foto e
                      alterar sua senha.
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </main>
        </div>

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
          onUpdateStatus={handleUpdateStatus}
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
            <strong>{callToConfirm?.solicitante.name}</strong>? Esta ação pode
            ser revertida.
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
    </TooltipProvider>
  );
};
