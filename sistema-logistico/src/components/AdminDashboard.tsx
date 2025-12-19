import React, { useState, useMemo, useRef, useEffect } from "react";
import type {
  SupportCall as OriginalSupportCall,
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
  LucideIcon,
  CalendarDays,
  ListFilter,
  ChevronDown,
  LayoutDashboard,
  History,
  PanelLeft,
  PanelRight,
  Phone,
  User,
  Volume2,
  VolumeX,
  Package,
  MapPin,
  Weight,
  ExternalLink,
  Settings2,
  GripVertical,
  AlertOctagon,
  Sun,
  Moon,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Timestamp, doc, updateDoc, deleteField, getDoc, setDoc } from "firebase/firestore";
import { db, auth, storage } from "../firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { Camera, Save, Mail, Linkedin, MessageCircle, Briefcase, FileText, Home, Hash } from "lucide-react";
import { Loading } from "./ui/loading";
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
import { TooltipProvider } from "./ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Switch } from "./ui/switch";

// --- DND KIT IMPORTS ---
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// --- TIPOS ---
interface SupportCall extends OriginalSupportCall {
  reason?: string;
  packageCount?: number;
  deliveryRegions?: string[];
}

type ColumnId =
  | "abertos"
  | "em_andamento"
  | "aprovacao"
  | "devolucao"
  | "concluidos"
  | "motoristas";

interface ColumnConfig {
  id: ColumnId;
  label: string;
  isVisible: boolean;
  colorClass: string;
}

// --- ITEM SORTABLE PARA O MENU ---
const SortableItem = ({
  id,
  label,
  isVisible,
  onToggle,
}: {
  id: string;
  label: string;
  isVisible: boolean;
  onToggle: () => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-2 mb-2 bg-muted/30 rounded-md border border-border"
    >
      <div className="flex items-center gap-2">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab hover:text-primary active:cursor-grabbing p-1"
        >
          <GripVertical size={16} className="text-muted-foreground" />
        </button>
        <span className="text-sm font-medium">{label}</span>
      </div>
      <Switch checked={isVisible} onCheckedChange={onToggle} />
    </div>
  );
};

// --- FUNÇÕES AUXILIARES ---
const showNotification = (
  type: "success" | "error" | "warning" | "info",
  title: string,
  message: string
) => {
  const styles = {
    success: { icon: CheckCircle, color: "text-green-600", bg: "bg-green-100" },
    error: { icon: AlertTriangle, color: "text-red-600", bg: "bg-red-100" },
    warning: {
      icon: AlertTriangle,
      color: "text-orange-600",
      bg: "bg-orange-100",
    },
    info: { icon: CheckCircle, color: "text-blue-600", bg: "bg-blue-100" },
  };

  const { icon: Icon, color, bg } = styles[type];

  sonnerToast.custom((t) => (
    <div className="flex w-full max-w-sm items-start gap-4 rounded-xl bg-card p-4 shadow-lg border border-border ring-1 ring-black/5 transition-all animate-in slide-in-from-top-2">
      <div className={cn("p-2 rounded-full shrink-0", bg, color)}>
        <Icon size={20} />
      </div>
      <div className="flex-1 pt-0.5">
        <p className="font-semibold text-sm text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground mt-1">{message}</p>
      </div>
      <button
        onClick={() => sonnerToast.dismiss(t)}
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  ));
};

const handleContactDriver = (phone: string | undefined) => {
  if (phone) {
    const message = encodeURIComponent(
      `Olá, estou entrando em contato referente a um chamado de apoio.`
    );
    window.open(`https://wa.me/55${phone}?text=${message}`, "_blank");
  } else {
    showNotification(
      "error",
      "Contato Indisponível",
      "O número de telefone deste motorista não está cadastrado."
    );
  }
};

// --- COMPONENTES VISUAIS ---

const EnhancedDriverCard = ({
  driver,
  onInfoClick,
}: {
  driver: Driver;
  onInfoClick: (driver: Driver) => void;
}) => (
  <div
    className="p-4 rounded-xl flex items-center justify-between gap-3 group transition-all cursor-pointer"
    style={{
      background: "linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%)",
      backdropFilter: "blur(20px)",
      border: "1px solid rgba(16, 185, 129, 0.2)",
      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.borderColor = "rgba(16, 185, 129, 0.4)";
      e.currentTarget.style.boxShadow = "0 8px 32px rgba(16, 185, 129, 0.2)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.borderColor = "rgba(16, 185, 129, 0.2)";
      e.currentTarget.style.boxShadow = "0 4px 20px rgba(0, 0, 0, 0.2)";
    }}
  >
    <div className="flex items-center gap-3 flex-1 min-w-0">
      <div onClick={() => onInfoClick(driver)} className="cursor-pointer">
        <AvatarComponent user={driver} />
      </div>
      <div className="flex-1 min-w-0">
        <p
          className="font-bold text-white cursor-pointer truncate text-sm"
          onClick={() => onInfoClick(driver)}
          title={driver.name}
        >
          {driver.name}
        </p>
        <div className="text-xs text-slate-400 flex flex-col sm:flex-row sm:items-center sm:gap-3 mt-1.5">
          <div className="flex items-center gap-1.5 truncate" title={driver.hub}>
            <Building size={12} className="text-orange-400" />
            <span className="truncate">{driver.hub?.split("_")[2] || "N/A"}</span>
          </div>
          <div className="flex items-center gap-1.5 capitalize">
            <Truck size={12} className="text-orange-400" />
            <span>{driver.vehicleType || "N/A"}</span>
          </div>
        </div>
      </div>
    </div>
    <div className="flex flex-col items-end gap-2">
      <Badge
        className="px-2.5 py-1 text-xs font-semibold"
        style={{
          background: "rgba(16, 185, 129, 0.15)",
          border: "1px solid rgba(16, 185, 129, 0.3)",
          color: "#10b981",
        }}
      >
        Disponível
      </Badge>
      <Button
        onClick={() => handleContactDriver(driver.phone)}
        size="sm"
        className="h-8 text-xs rounded-lg font-semibold"
        style={{
          background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
          boxShadow: "0 4px 20px -5px rgba(249, 115, 22, 0.4)",
        }}
      >
        Acionar
      </Button>
    </div>
  </div>
);

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
      case "DEVOLUCAO":
        return "text-red-500";
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
      <Card className="w-full max-w-lg relative bg-card max-h-[90vh] overflow-y-auto">
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AvatarComponent user={call.solicitante} />
              <div>
                <p className="font-semibold text-foreground">
                  {call.solicitante.name}
                </p>
                <p className="text-sm text-muted-foreground">Solicitante</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-green-600 border-green-200 hover:bg-green-50"
              onClick={() => handleContactDriver(call.solicitante.phone)}
            >
              <Phone size={16} className="mr-2" /> WhatsApp
            </Button>
          </div>

          <p
            className={`font-bold text-sm uppercase ${getStatusColor(
              call.status
            )}`}
          >
            {call.status.replace("_", " ")}
          </p>

          <div className="grid grid-cols-2 gap-3 text-sm">
            {call.reason && (
              <div className="col-span-2 bg-red-50 dark:bg-red-900/10 p-2 rounded border border-red-100 dark:border-red-900/30">
                <span className="font-semibold text-red-600 dark:text-red-400">
                  Motivo:
                </span>{" "}
                {call.reason}
              </div>
            )}
            <div className="flex items-center gap-2">
              <Package size={16} className="text-primary" />
              <span>{call.packageCount || "N/A"} Pacotes</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck size={16} className="text-primary" />
              <span className="capitalize">{call.vehicleType || "N/A"}</span>
            </div>
            {call.isBulky && (
              <div className="flex items-center gap-2 text-orange-600">
                <Weight size={16} />
                <span>Volumoso</span>
              </div>
            )}

            <div className="col-span-2">
              <a
                href={call.location}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-600 hover:underline hover:text-blue-800 transition-colors p-2 rounded bg-blue-50 dark:bg-blue-900/10"
              >
                <MapPin size={16} className="shrink-0" />
                <span className="truncate">{call.location}</span>
                <ExternalLink size={12} className="ml-auto opacity-50" />
              </a>
            </div>

            {call.deliveryRegions && call.deliveryRegions.length > 0 && (
              <div className="col-span-2">
                <span className="font-semibold text-muted-foreground block mb-1">
                  Regiões:
                </span>
                <div className="flex flex-wrap gap-1">
                  {call.deliveryRegions.map((region, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {region}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="font-sans text-base font-medium text-foreground bg-muted/50 p-3 rounded-md whitespace-pre-wrap">
            {cleanDescription(call.description)}
          </div>
        </CardContent>
        <CardFooter className="mt-2 pt-4 border-t border-border flex flex-wrap justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">Mover para:</p>
          <div className="flex gap-2 flex-wrap justify-end">
            {call.status === "EM ANDAMENTO" && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onUpdateStatus(call.id, { status: "ABERTO" })}
                >
                  <ArrowLeft size={16} className="mr-1.5" /> Aberto
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="bg-red-100 text-red-700 hover:bg-red-200 border-red-200"
                  onClick={() =>
                    onUpdateStatus(call.id, { status: "DEVOLUCAO" })
                  }
                >
                  <AlertOctagon size={16} className="mr-1.5" /> Devolução
                </Button>
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
              </>
            )}

            {call.status === "DEVOLUCAO" && (
              <Button
                variant="default"
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() =>
                  onUpdateStatus(call.id, { status: "EM ANDAMENTO" })
                }
              >
                <RotateCcw size={16} className="mr-1.5" /> Retomar Rota
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
          </div>
        </CardFooter>
      </Card>
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
  const formatTime = (timestamp: any): string => {
    if (!timestamp) return "--:--";
    let date;
    if (timestamp instanceof Timestamp) {
      date = timestamp.toDate();
    } else if (timestamp && typeof timestamp.seconds === "number") {
      date = new Date(timestamp.seconds * 1000);
    } else {
      return "--:--";
    }
    if (isNaN(date.getTime())) return "--:--";
    return format(date, "HH:mm", { locale: ptBR });
  };

  const timeString = formatTime(call.timestamp);

  const urgencyColor =
    {
      BAIXA: "border-l-blue-400",
      MEDIA: "border-l-yellow-400",
      ALTA: "border-l-orange-500",
      URGENTE: "border-l-red-600",
    }[call.urgency] || "border-l-gray-300";

  return (
    <div
      className={cn(
        "bg-card p-3 rounded-md shadow-sm border border-border hover:shadow-md transition-all cursor-pointer group relative flex flex-col gap-2",
        "border-l-4",
        urgencyColor
      )}
      onClick={() => onClick(call)}
    >
      <div className="flex justify-between items-center pr-7">
        <div className="flex items-center gap-1.5 min-w-0">
          <Ticket size={14} className="text-muted-foreground flex-shrink-0" />
          <span className="text-xs font-bold font-mono text-primary truncate">
            {call.routeId || "SEM ID"}
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
          <Clock size={12} />
          <span>{timeString}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-primary/50"></div>
        <span className="text-sm font-semibold text-foreground truncate leading-none">
          {call.solicitante.name}
        </span>
      </div>

      {call.reason && (
        <div className="mt-1">
          <Badge
            variant="outline"
            className="text-[10px] py-0 h-5 border-red-200 text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-300 dark:border-red-900/50 truncate max-w-full"
          >
            {call.reason}
          </Badge>
        </div>
      )}

      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
        <div className="flex items-center gap-1" title="Pacotes">
          <Package size={12} />
          <span>{call.packageCount || "?"}</span>
        </div>
        <div className="flex items-center gap-1 capitalize" title="Veículo">
          <Truck size={12} />
          <span className="truncate max-w-[60px]">
            {call.vehicleType?.split(" ")[0] || "?"}
          </span>
        </div>
        {call.isBulky && (
          <div
            className="flex items-center gap-1 text-orange-600"
            title="Volumoso"
          >
            <Weight size={12} />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate max-w-[50%]">
          <Building size={12} className="shrink-0" />
          <span className="truncate" title={call.hub}>
            {call.hub || "Hub..."}
          </span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (call.location) window.open(call.location, "_blank");
              else
                showNotification(
                  "error",
                  "Erro",
                  "Localização não disponível para este chamado."
                );
            }}
            className="p-1.5 rounded hover:bg-blue-100 text-blue-600 transition-colors"
            title="Abrir no Maps"
          >
            <MapPin size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleContactDriver(call.solicitante.phone);
            }}
            className="p-1.5 rounded hover:bg-green-100 text-green-600 transition-colors"
            title="Chamar no WhatsApp"
          >
            <Phone size={14} />
          </button>
        </div>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(call);
        }}
        className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
        title="Excluir"
      >
        <Trash2 size={14} />
      </button>
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
        {call.reason && (
          <Badge
            variant="outline"
            className="w-full justify-center border-red-200 text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-300 dark:border-red-900/50"
          >
            {call.reason}
          </Badge>
        )}
        <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Package size={14} className="text-primary" />
            <span>{call.packageCount || "N/A"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Truck size={14} className="text-primary" />
            <span className="capitalize">{call.vehicleType || "N/A"}</span>
          </div>
          <div className="col-span-2 flex items-center gap-2">
            <Building size={14} className="text-primary" />
            <span>{call.hub || "N/A"}</span>
          </div>
        </div>
        <p className="font-sans text-sm font-medium text-foreground bg-muted/50 p-3 rounded-md whitespace-pre-wrap">
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

type AdminView = "kanban" | "excluded" | "history" | "profile";

const viewTitles: Record<string, string> = {
  kanban: "Acompanhamento Operacional",
  excluded: "Solicitações Excluídas (Lixeira)",
  history: "Histórico de Solicitações",
  profile: "Perfil e Configurações",
};

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
  const [adminView, setAdminView] = useState<AdminView>("kanban");
  const [currentDateTime, setCurrentDateTime] = useState<Date>(new Date());
  
  // Estados do perfil do admin
  const [adminProfile, setAdminProfile] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    state: "",
    avatar: "",
    initials: "",
    address: "",
    zipCode: "",
    department: "",
    position: "",
    bio: "",
    linkedin: "",
    whatsapp: "",
  });
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("theme");
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      return (saved as "light" | "dark") || (isDark ? "dark" : "light");
    }
    return "light";
  });

  // Atualizar data/hora do Brasil
  useEffect(() => {
    const updateDateTime = () => {
      // Fuso horário do Brasil (America/Sao_Paulo)
      const brazilTime = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
      setCurrentDateTime(brazilTime);
    };
    
    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Sincronizar tema com o sistema
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    
    // Aplicar tema imediatamente para animação
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  // Carregar perfil do admin
  useEffect(() => {
    const loadAdminProfile = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        setIsLoadingProfile(true);
        const adminDocRef = doc(db, "admins_pre_aprovados", user.uid);
        const adminDocSnap = await getDoc(adminDocRef);

        if (adminDocSnap.exists()) {
          const data = adminDocSnap.data();
          const name = data.name || "";
          const initials = name
            .split(" ")
            .map((n: string) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);

          setAdminProfile({
            name: data.name || "",
            email: data.email || user.email || "",
            phone: data.phone || "",
            city: data.city || "",
            state: data.state || "",
            avatar: data.avatar || "",
            initials: initials || user.email?.[0].toUpperCase() || "A",
            address: data.address || "",
            zipCode: data.zipCode || "",
            department: data.department || "",
            position: data.position || "",
            bio: data.bio || "",
            linkedin: data.linkedin || "",
            whatsapp: data.whatsapp || "",
          });
          setAvatarPreview(data.avatar || null);
        } else {
          // Criar perfil inicial se não existir
          const name = user.displayName || user.email?.split("@")[0] || "Admin";
          const initials = name
            .split(" ")
            .map((n: string) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);

          const initialData = {
            uid: user.uid,
            email: user.email || "",
            name: name,
            phone: "",
            city: "",
            state: "",
            avatar: "",
            initials: initials || "A",
            role: "admin",
          };

          await setDoc(adminDocRef, initialData);
          setAdminProfile({
            name: initialData.name,
            email: initialData.email,
            phone: "",
            city: "",
            state: "",
            avatar: "",
            initials: initialData.initials,
            address: "",
            zipCode: "",
            department: "",
            position: "",
            bio: "",
            linkedin: "",
            whatsapp: "",
          });
        }
      } catch (error) {
        console.error("Erro ao carregar perfil:", error);
        sonnerToast.error("Erro ao carregar perfil");
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadAdminProfile();
  }, []);

  // Upload de avatar
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const user = auth.currentUser;
    if (!user) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith("image/")) {
      sonnerToast.error("Por favor, selecione uma imagem");
      return;
    }

    // Validar tamanho (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      sonnerToast.error("A imagem deve ter no máximo 5MB");
      return;
    }

    try {
      setIsUploadingAvatar(true);
      const photoRef = ref(
        storage,
        `admin-avatars/${user.uid}/${Date.now()}_${file.name}`
      );
      await uploadBytesResumable(photoRef, file);
      const photoURL = await getDownloadURL(photoRef);

      setAdminProfile((prev) => ({ ...prev, avatar: photoURL }));
      setAvatarPreview(photoURL);

      // Salvar no Firestore
      const adminDocRef = doc(db, "admins_pre_aprovados", user.uid);
      await updateDoc(adminDocRef, { avatar: photoURL });

      sonnerToast.success("Foto atualizada com sucesso!");
    } catch (error: any) {
      console.error("Erro ao fazer upload:", error);
      sonnerToast.error("Erro ao fazer upload da foto: " + error.message);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Salvar perfil
  const handleSaveProfile = async () => {
    const user = auth.currentUser;
    if (!user) return;

    if (!adminProfile.name.trim()) {
      sonnerToast.error("O nome é obrigatório");
      return;
    }

    try {
      setIsSavingProfile(true);
      const adminDocRef = doc(db, "admins_pre_aprovados", user.uid);

      const initials = adminProfile.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

      await updateDoc(adminDocRef, {
        name: adminProfile.name.trim(),
        phone: adminProfile.phone.replace(/\D/g, ""),
        city: adminProfile.city.trim(),
        state: adminProfile.state.trim(),
        initials: initials,
        address: adminProfile.address.trim(),
        zipCode: adminProfile.zipCode.replace(/\D/g, ""),
        department: adminProfile.department.trim(),
        position: adminProfile.position.trim(),
        bio: adminProfile.bio.trim(),
        linkedin: adminProfile.linkedin.trim(),
        whatsapp: adminProfile.whatsapp.replace(/\D/g, ""),
      });

      setAdminProfile((prev) => ({ ...prev, initials }));
      sonnerToast.success("Perfil atualizado com sucesso!");
    } catch (error: any) {
      console.error("Erro ao salvar perfil:", error);
      sonnerToast.error("Erro ao salvar perfil: " + error.message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const [urgencyFilter, setUrgencyFilter] = useState<UrgencyLevel | "TODOS">(
    "TODOS"
  );

  const [infoModalDriver, setInfoModalDriver] = useState<Driver | null>(null);
  const [callToConfirm, setCallToConfirm] = useState<SupportCall | null>(null);
  const [confirmationType, setConfirmationType] = useState<
    "soft-delete" | "permanent-delete" | "clear-all" | null
  >(null);
  const [selectedCall, setSelectedCall] = useState<SupportCall | null>(null);

  const [excludedNameFilter, setExcludedNameFilter] = useState("");
  const [excludedHubFilter, setExcludedHubFilter] = useState("Todos os Hubs");
  const [globalHubFilter, setGlobalHubFilter] =
    useState<string>("Todos os Hubs");
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

  const notifiedCallIds = useRef(new Set<string>());
  const prevCallsRef = useRef<SupportCall[]>([]);

  // --- CONFIGURAÇÃO DE COLUNAS (Drag & Drop) ---
  const [columns, setColumns] = useState<ColumnConfig[]>([
    { id: "abertos", label: "Abertos", isVisible: true, colorClass: "#F59E0B" },
    {
      id: "em_andamento",
      label: "Em Andamento",
      isVisible: true,
      colorClass: "#3B82F6",
    },
    {
      id: "aprovacao",
      label: "Aprovação",
      isVisible: true,
      colorClass: "#8B5CF6",
    },
    {
      id: "devolucao",
      label: "Devolução",
      isVisible: true,
      colorClass: "#EF4444",
    },
    {
      id: "concluidos",
      label: "Concluídos",
      isVisible: true,
      colorClass: "#10B981",
    },
    {
      id: "motoristas",
      label: "Motoristas",
      isVisible: true,
      colorClass: "#6B7280",
    },
  ]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setColumns((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const toggleColumn = (id: string) => {
    setColumns((prev) =>
      prev.map((col) =>
        col.id === id ? { ...col, isVisible: !col.isVisible } : col
      )
    );
  };

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
    showNotification(
      "info",
      "Filtros Aplicados",
      "Os filtros do histórico foram atualizados com sucesso."
    );
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
    showNotification(
      "info",
      newMutedState ? "Silenciado" : "Som Ativado",
      newMutedState ? "Notificações silenciadas." : "Alertas sonoros ativos."
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
          if (urgencyLevels[newUrgencyIndex] !== call.urgency) {
            updateCall(call.id, { urgency: urgencyLevels[newUrgencyIndex] });
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
      calls
        .filter(
          (call) => !["ARQUIVADO", "EXCLUIDO", "ABERTO"].includes(call.status)
        )
        .forEach((call) => {
          if (call.timestamp) {
            const callDate =
              call.timestamp instanceof Timestamp
                ? call.timestamp.toDate()
                : new Date((call.timestamp as any).seconds * 1000);
            if (callDate < twentyFourHoursAgo) {
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
        audio.play().catch((e) => console.error("Erro som:", e));
      }
      newOpenCalls.forEach((newCall) => {
        showNotification(
          "warning",
          "Novo Chamado!",
          `${newCall.solicitante.name} precisa de apoio.`
        );
        notifiedCallIds.current.add(newCall.id);
      });
    }
    prevCallsRef.current = calls;
    const openCallIds = new Set(
      calls.filter((c) => c.status === "ABERTO").map((c) => c.id)
    );
    notifiedCallIds.current.forEach((id) => {
      if (!openCallIds.has(id)) notifiedCallIds.current.delete(id);
    });
  }, [calls, isMuted]);

  const handleApprove = async (call: SupportCall) => {
    try {
      const updates = { status: "CONCLUIDO", approvedBy: "Admin" };
      await updateCall(call.id, updates as any);
      if (call.solicitante.id)
        await updateDriver(call.solicitante.id, { status: "DISPONIVEL" });
      if (call.assignedTo)
        await updateDriver(call.assignedTo, { status: "DISPONIVEL" });
      showNotification("success", "Aprovado", "Chamado concluído com sucesso.");
    } catch (error) {
      showNotification("error", "Erro", "Falha ao aprovar.");
    }
  };

  const handleReject = async (call: SupportCall) => {
    try {
      await updateCall(call.id, { status: "EM ANDAMENTO" });
      showNotification(
        "warning",
        "Rejeitado",
        "Chamado voltou para Em Andamento."
      );
    } catch (error) {
      showNotification("error", "Erro", "Falha ao rejeitar.");
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
  const closeModal = () => {
    setCallToConfirm(null);
    setConfirmationType(null);
  };

  const confirmAction = () => {
    if (confirmationType === "soft-delete" && callToConfirm) {
      onDeleteCall(callToConfirm.id);
      showNotification("success", "Lixeira", "Chamado movido para lixeira.");
    } else if (confirmationType === "permanent-delete" && callToConfirm) {
      onDeletePermanently(callToConfirm.id);
      showNotification(
        "success",
        "Excluído",
        "Chamado excluído permanentemente."
      );
    } else if (confirmationType === "clear-all") {
      onDeleteAllExcluded();
      showNotification("success", "Limpo", "Lixeira esvaziada.");
    }
    closeModal();
  };

  const handleRestore = (callId: string) => {
    updateCall(callId, { status: "ABERTO", deletedAt: deleteField() });
    showNotification("success", "Restaurado", "Chamado voltou para Abertos.");
  };

  const filteredCalls = useMemo(
    () =>
      calls.filter(
        (call) =>
          globalHubFilter === "Todos os Hubs" || call.hub === globalHubFilter
      ),
    [calls, globalHubFilter]
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
  const pendingApprovalCalls = useMemo(
    () => activeCalls.filter((c) => c.status === "AGUARDANDO_APROVACAO"),
    [activeCalls]
  );
  const devolutionCalls = useMemo(
    () => activeCalls.filter((c) => c.status === "DEVOLUCAO"),
    [activeCalls]
  );
  const concludedCalls = useMemo(
    () => activeCalls.filter((c) => c.status === "CONCLUIDO"),
    [activeCalls]
  );

  const filteredDrivers = useMemo(
    () =>
      drivers.filter(
        (driver) =>
          globalHubFilter === "Todos os Hubs" || driver.hub === globalHubFilter
      ),
    [drivers, globalHubFilter]
  );
  const availableDrivers = useMemo(
    () =>
      filteredDrivers.filter((d) => {
        const isAvailable = d.status === "DISPONIVEL";
        const hubMatch =
          driverHubFilter === "Todos os Hubs" || d.hub === driverHubFilter;
        const vehicleMatch =
          driverVehicleFilter === "Todos os Veículos" ||
          d.vehicleType === driverVehicleFilter;
        return isAvailable && hubMatch && vehicleMatch;
      }),
    [filteredDrivers, driverHubFilter, driverVehicleFilter]
  );

  const filteredOpenCalls = useMemo(
    () =>
      urgencyFilter === "TODOS"
        ? openCalls
        : openCalls.filter((call) => call.urgency === urgencyFilter),
    [openCalls, urgencyFilter]
  );

  const filteredExcludedCalls = useMemo(
    () =>
      excludedCalls.filter(
        (call) =>
          (excludedNameFilter === "" ||
            call.solicitante.name
              .toLowerCase()
              .includes(excludedNameFilter.toLowerCase())) &&
          (excludedHubFilter === "Todos os Hubs" ||
            call.hub === excludedHubFilter)
      ),
    [excludedCalls, excludedNameFilter, excludedHubFilter]
  );

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

        const callDate =
          call.timestamp instanceof Timestamp
            ? call.timestamp.toDate()
            : new Date((call.timestamp as any).seconds * 1000);
        if (
          appliedHistoryFilters.start &&
          callDate < new Date(appliedHistoryFilters.start)
        )
          return false;
        if (appliedHistoryFilters.end) {
          const end = new Date(appliedHistoryFilters.end);
          end.setHours(23, 59, 59, 999);
          if (callDate > end) return false;
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

  // Listas de Dropdowns
  const allHubs = useMemo(
    () =>
      [
        "Todos",
        ...new Set(calls.map((c) => c.hub).filter((h): h is string => !!h)),
      ].sort(),
    [calls]
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

  const filterControls = (
    <div className="flex flex-wrap gap-1">
      {(["TODOS", "URGENTE", "ALTA", "MEDIA", "BAIXA"] as const).map(
        (level) => (
          <Button
            key={level}
            onClick={() => setUrgencyFilter(level)}
            variant={urgencyFilter === level ? "default" : "secondary"}
            size="sm"
            className="text-xs h-7 px-2.5 rounded-full"
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

  const getColumnData = (columnId: ColumnId) => {
    switch (columnId) {
      case "abertos":
        return filteredOpenCalls;
      case "em_andamento":
        return inProgressCalls;
      case "aprovacao":
        return pendingApprovalCalls;
      case "devolucao":
        return devolutionCalls;
      case "concluidos":
        return concludedCalls;
      case "motoristas":
        return availableDrivers;
      default:
        return [];
    }
  };

  const renderColumnContent = (columnId: ColumnId, data: any[]) => {
    if (columnId === "motoristas") {
      return (
        <KanbanColumn
          title="Motoristas"
          count={data.length}
          colorClass="#6B7280"
          headerControls={driverFilterControls}
        >
          {data.map((driver) => (
            <EnhancedDriverCard
              key={driver.uid}
              driver={driver}
              onInfoClick={() => setInfoModalDriver(driver)}
            />
          ))}
        </KanbanColumn>
      );
    }
    if (columnId === "aprovacao") {
      return (
        <KanbanColumn
          title="Aprovação"
          count={data.length}
          colorClass="#8B5CF6"
        >
          {data.map((call) => (
            <ApprovalCard
              key={call.id}
              call={call}
              onApprove={handleApprove}
              onReject={handleReject}
              onDelete={handleDeleteClick}
              drivers={drivers}
            />
          ))}
        </KanbanColumn>
      );
    }
    const titleMap = {
      abertos: "Abertos",
      em_andamento: "Em Andamento",
      devolucao: "Devolução",
      concluidos: "Concluídos",
    };
    const colorMap = {
      abertos: "#F59E0B",
      em_andamento: "#3B82F6",
      devolucao: "#EF4444",
      concluidos: "#10B981",
    };
    return (
      <KanbanColumn
        title={titleMap[columnId as keyof typeof titleMap]}
        count={data.length}
        colorClass={colorMap[columnId as keyof typeof colorMap]}
        headerControls={columnId === "abertos" ? filterControls : undefined}
      >
        {data.map((call) => (
          <CallCard
            key={call.id}
            call={call}
            onDelete={handleDeleteClick}
            onClick={setSelectedCall}
          />
        ))}
      </KanbanColumn>
    );
  };

  return (
    <TooltipProvider>
      <div className={cn(
        "flex min-h-screen text-foreground",
        theme === "dark" && "bg-[hsl(222_47%_8%)]"
      )}
        style={{
          background: theme === "light" 
            ? "linear-gradient(to bottom, hsl(30, 100%, 85%) 0%, hsl(28, 100%, 80%) 10%, hsl(25, 100%, 75%) 20%, hsl(22, 100%, 70%) 30%, hsl(20, 100%, 65%) 40%, hsl(18, 100%, 60%) 50%, hsl(15, 100%, 55%) 60%, hsl(12, 100%, 50%) 70%, hsl(10, 100%, 45%) 80%, hsl(8, 100%, 40%) 90%, hsl(5, 100%, 35%) 100%)"
            : undefined,
          backgroundAttachment: theme === "light" ? "fixed" : undefined,
        }}
      >
        <aside
          className={cn(
            "sticky top-0 h-screen flex-shrink-0 p-4 flex flex-col gap-6 transition-all duration-300 ease-in-out backdrop-blur-xl border-r border-border",
            isSidebarCollapsed ? "w-20" : "w-64",
            theme === "light"
              ? "bg-white/70 border-orange-200/50"
              : "bg-slate-900/95 border-slate-700/50"
          )}
        >
          <Button
            variant="secondary"
            size="icon"
            className="absolute top-4 -right-4 z-20 rounded-full w-8 h-8"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          >
            {isSidebarCollapsed ? (
              <PanelRight size={18} />
            ) : (
              <PanelLeft size={18} />
            )}
          </Button>
          <div
            className={cn(
              "flex items-center gap-3 px-2 transition-all",
              isSidebarCollapsed && "justify-center"
            )}
          >
            <img
              src={spxLogo}
              alt="spx-logo.png"
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
            </div>
          </div>
          <nav className="flex flex-col gap-2 flex-grow">
            <Button
              variant={adminView === "kanban" ? "secondary" : "ghost"}
              className={cn(
                "gap-2 justify-start",
                isSidebarCollapsed && "justify-center"
              )}
              onClick={() => setAdminView("kanban")}
            >
              <LayoutDashboard size={18} />{" "}
              <span className={cn(isSidebarCollapsed && "hidden")}>
                Quadro Geral
              </span>
            </Button>
            <Button
              variant={adminView === "excluded" ? "secondary" : "ghost"}
              className={cn(
                "gap-2 justify-start",
                isSidebarCollapsed && "justify-center"
              )}
              onClick={() => setAdminView("excluded")}
            >
              <Trash2 size={18} />{" "}
              <span className={cn(isSidebarCollapsed && "hidden")}>
                Lixeira
              </span>
            </Button>
            <Button
              variant={adminView === "history" ? "secondary" : "ghost"}
              className={cn(
                "gap-2 justify-start",
                isSidebarCollapsed && "justify-center"
              )}
              onClick={() => setAdminView("history")}
            >
              <History size={18} />{" "}
              <span className={cn(isSidebarCollapsed && "hidden")}>
                Histórico
              </span>
            </Button>
          </nav>
          <div className="mt-auto">
            <Button
              variant={adminView === "profile" ? "secondary" : "ghost"}
              className={cn(
                "gap-2 w-full justify-start",
                isSidebarCollapsed && "justify-center"
              )}
              onClick={() => setAdminView("profile")}
            >
              <User size={18} />{" "}
              <span className={cn(isSidebarCollapsed && "hidden")}>Perfil</span>
            </Button>
          </div>
        </aside>

        <div className="flex-1 flex flex-col overflow-y-auto">
          <header className={cn(
            "sticky top-0 z-10 p-4 sm:p-6 flex justify-between items-center backdrop-blur-xl border-b border-border transition-all duration-300",
            theme === "light"
              ? "bg-gradient-to-r from-orange-50/90 via-orange-100/80 to-orange-50/90"
              : "bg-background/95"
          )}>
            <div className="flex items-center gap-4">
              <h2 className={cn(
                "text-xl font-semibold",
                theme === "light" ? "text-slate-800" : "text-foreground"
              )}>
                {viewTitles[adminView]}
              </h2>
              {adminView === "kanban" && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Settings2 size={16} /> Configurar Painel
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-4" align="start">
                    <h4 className="font-medium mb-2 text-sm">
                      Exibir e Reordenar
                    </h4>
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={columns}
                        strategy={verticalListSortingStrategy}
                      >
                        {columns.map((col) => (
                          <SortableItem
                            key={col.id}
                            id={col.id}
                            label={col.label}
                            isVisible={col.isVisible}
                            onToggle={() => toggleColumn(col.id)}
                          />
                        ))}
                      </SortableContext>
                    </DndContext>
                  </PopoverContent>
                </Popover>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
                aria-label="Alternar tema"
              >
                {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
              </button>
              <div className="w-full sm:w-auto sm:min-w-[250px]">
                <SearchableSelect
                  options={allHubsForFilter}
                  value={globalHubFilter}
                  onChange={setGlobalHubFilter}
                  placeholder="Filtrar Hub Global..."
                  icon={Building}
                />
              </div>
            </div>
          </header>

          {/* Card de informações do admin */}
          <div className="px-4 sm:px-6 pt-4">
            <div
              className="w-full p-4 md:p-6 rounded-xl border border-orange-900/30 relative z-10"
              style={{
                backgroundColor: "#000000",
                background: "linear-gradient(to bottom, #000000 0%, #1a1a1a 100%)",
              }}
            >
              {/* Data e hora do Brasil no topo */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4 pb-4 border-b border-orange-900/20">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-white">
                    <Clock size={20} className="text-orange-500" />
                    <span className="text-xl md:text-2xl font-bold">
                      {format(currentDateTime, "HH:mm:ss", { locale: ptBR })}
                    </span>
                  </div>
                  <div className="text-sm md:text-base text-gray-300 ml-8">
                    {format(currentDateTime, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </div>
                </div>
              </div>
              
              {/* Informações do perfil */}
              <div className="flex items-center gap-4">
                {/* Foto de perfil */}
                <div className="relative flex-shrink-0">
                  {adminProfile.avatar ? (
                    <img
                      src={adminProfile.avatar}
                      alt={adminProfile.name}
                      className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover border-2 border-orange-500/50 shadow-lg"
                      onError={(e) => {
                        // Se a imagem falhar, mostra as iniciais
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                        const parent = target.parentElement;
                        if (parent) {
                          const fallback = parent.querySelector(".avatar-fallback") as HTMLElement;
                          if (fallback) fallback.style.display = "flex";
                        }
                      }}
                    />
                  ) : null}
                  <div 
                    className={`avatar-fallback w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center border-2 border-orange-500/50 shadow-lg ${adminProfile.avatar ? "hidden" : ""}`}
                    style={{ display: adminProfile.avatar ? "none" : "flex" }}
                  >
                    <span className="text-2xl md:text-3xl font-bold text-white">
                      {adminProfile.initials || "A"}
                    </span>
                  </div>
                </div>
                
                {/* Nome e cidade */}
                <div className="flex flex-col flex-1 min-w-0">
                  <h3 className="text-lg md:text-xl font-bold text-white mb-1 truncate">
                    {adminProfile.name || "Admin Shopee"}
                  </h3>
                  <div className="flex items-center gap-1.5 text-sm md:text-base text-gray-300">
                    <MapPin size={16} className="text-orange-500 flex-shrink-0" />
                    <span className="truncate">{adminProfile.city || "Não informado"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <main className="flex-grow p-4 sm:p-6 space-y-6 relative z-10">
            <div className="tab-content-enter">
              {adminView === "kanban" && (
                <div className="flex-grow flex flex-col space-y-4 h-[calc(100vh-140px)]">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <SummaryCard
                    title="Abertos"
                    value={openCalls.length}
                    icon={<AlertTriangle />}
                    subtext="Fila"
                    colorClass="#F59E0B"
                  />
                  <SummaryCard
                    title="Pendentes"
                    value={pendingApprovalCalls.length}
                    icon={<Clock />}
                    subtext="Aprovação"
                    colorClass="#8B5CF6"
                  />
                  <SummaryCard
                    title="Andamento"
                    value={inProgressCalls.length}
                    icon={<Truck />}
                    subtext="Rota"
                    colorClass="#3B82F6"
                  />
                  <SummaryCard
                    title="Devoluções"
                    value={devolutionCalls.length}
                    icon={<AlertOctagon />}
                    subtext="Problemas"
                    colorClass="#EF4444"
                  />
                  <SummaryCard
                    title="Disponíveis"
                    value={availableDrivers.length}
                    icon={<Users />}
                    subtext="Motoristas"
                    colorClass="#10B981"
                  />
                </div>

                <ResizablePanelGroup
                  direction="horizontal"
                  className="flex-grow rounded-xl min-h-[500px]"
                  style={{
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
                  }}
                >
                  {columns
                    .filter((c) => c.isVisible)
                    .map((col, index, visibleCols) => (
                      <React.Fragment key={col.id}>
                        <ResizablePanel
                          defaultSize={100 / visibleCols.length}
                          minSize={10}
                        >
                          <div
                            className="h-full p-2 overflow-hidden flex flex-col"
                            style={{
                              background: `linear-gradient(135deg, ${col.colorClass}08 0%, ${col.colorClass}03 100%)`,
                            }}
                          >
                            {renderColumnContent(col.id, getColumnData(col.id))}
                          </div>
                        </ResizablePanel>
                        {index < visibleCols.length - 1 && (
                          <ResizableHandle 
                            className="w-1 transition-colors"
                            style={{
                              background: "rgba(255, 255, 255, 0.1)",
                            }}
                            onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                              e.currentTarget.style.background = "rgba(249, 115, 22, 0.5)";
                            }}
                            onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
                              e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                            }}
                          />
                        )}
                      </React.Fragment>
                    ))}
                </ResizablePanelGroup>
                </div>
              )}

              {adminView === "excluded" && (
                <div className="tab-content-enter space-y-6">
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
                              className="text-green-500 border-green-500/50 hover:bg-green-500/10"
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

              {adminView === "history" && (
                <div className="tab-content-enter space-y-6">
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
                          <th className="px-6 py-3">Solicitante</th>
                          <th className="px-6 py-3">Apoio</th>
                          <th className="px-6 py-3">Hub</th>
                          <th className="px-6 py-3">Status</th>
                          <th className="px-6 py-3">Data</th>
                          <th className="px-6 py-3">Aprovado Por</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredHistoryCalls.map((call) => {
                          const assignedDriver = drivers.find(
                            (d) => d.uid === call.assignedTo
                          );
                          const formattedDate = call.timestamp
                            ? format(
                                call.timestamp instanceof Timestamp
                                  ? call.timestamp.toDate()
                                  : new Date(
                                      (call.timestamp as any).seconds * 1000
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

              {adminView === "profile" && (
                <div className="tab-content-enter space-y-6 w-full relative z-10">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Coluna Esquerda - Foto e Informações Básicas */}
                    <div className="lg:col-span-1 space-y-6">
                      {/* Foto de Perfil */}
                      <Card className={cn(
                        "shadow-lg border",
                        theme === "dark"
                          ? "bg-slate-800/90 border-orange-500/30"
                          : "bg-white/80 border-orange-200/50"
                      )}>
                        <CardHeader>
                          <CardTitle className={cn(
                            theme === "dark" ? "text-white" : "text-slate-800"
                          )}>
                            Foto de Perfil
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center gap-4">
                          {isLoadingProfile ? (
                            <div className="flex items-center justify-center py-12">
                              <Loading size="lg" variant="spinner" />
                            </div>
                          ) : (
                            <>
                              <div className="relative group">
                                <div className={cn(
                                  "w-40 h-40 rounded-full overflow-hidden border-4 flex items-center justify-center",
                                  theme === "dark"
                                    ? "border-orange-500/30 bg-slate-700/50"
                                    : "border-orange-200/50 bg-orange-50/80"
                                )}>
                                  {avatarPreview || adminProfile.avatar ? (
                                    <img
                                      src={avatarPreview || adminProfile.avatar}
                                      alt={adminProfile.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <span className={cn(
                                      "text-5xl font-bold",
                                      theme === "dark" ? "text-white" : "text-slate-800"
                                    )}>
                                      {adminProfile.initials}
                                    </span>
                                  )}
                                  {isUploadingAvatar && (
                                    <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center">
                                      <Loading size="md" variant="spinner" className="text-white" />
                                    </div>
                                  )}
                                </div>
                                <label className="absolute bottom-0 right-0 p-3 rounded-full cursor-pointer transition-all hover:scale-110 shadow-lg"
                                  style={{
                                    background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                                  }}
                                >
                                  <Camera size={22} className="text-white" />
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAvatarUpload}
                                    className="hidden"
                                    disabled={isUploadingAvatar}
                                  />
                                </label>
                              </div>
                              <p className={cn(
                                "text-sm text-center",
                                theme === "dark" ? "text-slate-300" : "text-slate-600"
                              )}>
                                Clique na câmera para alterar a foto
                              </p>
                            </>
                          )}
                        </CardContent>
                      </Card>

                      {/* Configurações do Painel */}
                      <Card className={cn(
                        "shadow-lg border",
                        theme === "dark"
                          ? "bg-slate-800/90 border-orange-500/30"
                          : "bg-white/80 border-orange-200/50"
                      )}>
                        <CardHeader>
                          <CardTitle className={cn(
                            theme === "dark" ? "text-white" : "text-slate-800"
                          )}>
                            Configurações do Painel
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className={cn(
                            "flex items-center justify-between p-4 rounded-lg border",
                            theme === "dark"
                              ? "bg-slate-700/50 border-orange-500/30"
                              : "bg-orange-50/80 border-orange-200/50"
                          )}>
                            <div className="flex items-center gap-3">
                              {isMuted ? (
                                <VolumeX size={20} className={theme === "dark" ? "text-slate-300" : "text-slate-600"} />
                              ) : (
                                <Volume2 size={20} className={theme === "dark" ? "text-slate-300" : "text-slate-600"} />
                              )}
                              <label
                                htmlFor="mute-toggle"
                                className={cn(
                                  "text-sm font-medium",
                                  theme === "dark" ? "text-white" : "text-slate-800"
                                )}
                              >
                                Som das Notificações
                              </label>
                            </div>
                            <Button
                              id="mute-toggle"
                              onClick={toggleMute}
                              variant={isMuted ? "secondary" : "default"}
                              size="sm"
                              className="w-24 text-xs"
                            >
                              {isMuted ? "Ativar" : "Mutar"}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Coluna Direita - Formulário Completo */}
                    <div className="lg:col-span-2">
                      <Card className={cn(
                        "shadow-lg border",
                        theme === "dark"
                          ? "bg-slate-800/90 border-orange-500/30"
                          : "bg-white/80 border-orange-200/50"
                      )}>
                        <CardHeader>
                          <CardTitle className={cn(
                            theme === "dark" ? "text-white" : "text-slate-800"
                          )}>
                            Perfil do Administrador
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          {isLoadingProfile ? (
                            <div className="flex items-center justify-center py-12">
                              <Loading size="lg" variant="spinner" />
                            </div>
                          ) : (
                            <>
                              {/* Informações Pessoais */}
                              <div className="space-y-4">
                                <h3 className={cn(
                                  "text-lg font-bold pb-2 border-b",
                                  theme === "dark" 
                                    ? "text-white border-orange-500/30" 
                                    : "text-slate-800 border-orange-200/50"
                                )}>
                                  Informações Pessoais
                                </h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {/* Nome */}
                                  <div className="md:col-span-2 space-y-2">
                                    <label className={cn(
                                      "text-sm font-semibold flex items-center gap-2",
                                      theme === "dark" ? "text-slate-300" : "text-slate-700"
                                    )}>
                                      <User size={16} />
                                      Nome Completo *
                                    </label>
                                    <input
                                      type="text"
                                      value={adminProfile.name}
                                      onChange={(e) =>
                                        setAdminProfile((prev) => ({ ...prev, name: e.target.value }))
                                      }
                                      className={cn(
                                        "w-full p-3 rounded-xl border outline-none transition-all",
                                        theme === "dark"
                                          ? "bg-orange-500/20 border-orange-500/30 text-white placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500/50"
                                          : "bg-white border-orange-200/50 text-slate-800 placeholder:text-slate-500 focus:ring-2 focus:ring-orange-500/50"
                                      )}
                                      placeholder="Digite seu nome completo"
                                      required
                                    />
                                  </div>

                                  {/* Email (readonly) */}
                                  <div className="space-y-2">
                                    <label className={cn(
                                      "text-sm font-semibold flex items-center gap-2",
                                      theme === "dark" ? "text-slate-300" : "text-slate-700"
                                    )}>
                                      <Mail size={16} />
                                      E-mail
                                    </label>
                                    <input
                                      type="email"
                                      value={adminProfile.email}
                                      disabled
                                      className={cn(
                                        "w-full p-3 rounded-xl border outline-none cursor-not-allowed opacity-60",
                                        theme === "dark"
                                          ? "bg-slate-700/50 border-orange-500/30 text-slate-400"
                                          : "bg-slate-100 border-orange-200/50 text-slate-600"
                                      )}
                                    />
                                  </div>

                                  {/* Telefone */}
                                  <div className="space-y-2">
                                    <label className={cn(
                                      "text-sm font-semibold flex items-center gap-2",
                                      theme === "dark" ? "text-slate-300" : "text-slate-700"
                                    )}>
                                      <Phone size={16} />
                                      Telefone
                                    </label>
                                    <input
                                      type="tel"
                                      value={adminProfile.phone}
                                      onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, "");
                                        let formatted = value;
                                        if (value.length > 10) {
                                          formatted = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7, 11)}`;
                                        } else if (value.length > 6) {
                                          formatted = `(${value.slice(0, 2)}) ${value.slice(2, 6)}-${value.slice(6)}`;
                                        } else if (value.length > 2) {
                                          formatted = `(${value.slice(0, 2)}) ${value.slice(2)}`;
                                        }
                                        setAdminProfile((prev) => ({ ...prev, phone: formatted }));
                                      }}
                                      className={cn(
                                        "w-full p-3 rounded-xl border outline-none transition-all",
                                        theme === "dark"
                                          ? "bg-orange-500/20 border-orange-500/30 text-white placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500/50"
                                          : "bg-white border-orange-200/50 text-slate-800 placeholder:text-slate-500 focus:ring-2 focus:ring-orange-500/50"
                                      )}
                                      placeholder="(00) 00000-0000"
                                      maxLength={15}
                                    />
                                  </div>

                                  {/* WhatsApp */}
                                  <div className="space-y-2">
                                    <label className={cn(
                                      "text-sm font-semibold flex items-center gap-2",
                                      theme === "dark" ? "text-slate-300" : "text-slate-700"
                                    )}>
                                      <MessageCircle size={16} />
                                      WhatsApp
                                    </label>
                                    <input
                                      type="tel"
                                      value={adminProfile.whatsapp}
                                      onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, "");
                                        let formatted = value;
                                        if (value.length > 10) {
                                          formatted = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7, 11)}`;
                                        } else if (value.length > 6) {
                                          formatted = `(${value.slice(0, 2)}) ${value.slice(2, 6)}-${value.slice(6)}`;
                                        } else if (value.length > 2) {
                                          formatted = `(${value.slice(0, 2)}) ${value.slice(2)}`;
                                        }
                                        setAdminProfile((prev) => ({ ...prev, whatsapp: formatted }));
                                      }}
                                      className={cn(
                                        "w-full p-3 rounded-xl border outline-none transition-all",
                                        theme === "dark"
                                          ? "bg-orange-500/20 border-orange-500/30 text-white placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500/50"
                                          : "bg-white border-orange-200/50 text-slate-800 placeholder:text-slate-500 focus:ring-2 focus:ring-orange-500/50"
                                      )}
                                      placeholder="(00) 00000-0000"
                                      maxLength={15}
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Informações Profissionais */}
                              <div className="space-y-4">
                                <h3 className={cn(
                                  "text-lg font-bold pb-2 border-b",
                                  theme === "dark" 
                                    ? "text-white border-orange-500/30" 
                                    : "text-slate-800 border-orange-200/50"
                                )}>
                                  Informações Profissionais
                                </h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {/* Departamento */}
                                  <div className="space-y-2">
                                    <label className={cn(
                                      "text-sm font-semibold flex items-center gap-2",
                                      theme === "dark" ? "text-slate-300" : "text-slate-700"
                                    )}>
                                      <Building size={16} />
                                      Departamento
                                    </label>
                                    <input
                                      type="text"
                                      value={adminProfile.department}
                                      onChange={(e) =>
                                        setAdminProfile((prev) => ({ ...prev, department: e.target.value }))
                                      }
                                      className={cn(
                                        "w-full p-3 rounded-xl border outline-none transition-all",
                                        theme === "dark"
                                          ? "bg-orange-500/20 border-orange-500/30 text-white placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500/50"
                                          : "bg-white border-orange-200/50 text-slate-800 placeholder:text-slate-500 focus:ring-2 focus:ring-orange-500/50"
                                      )}
                                      placeholder="Ex: Logística, Operações"
                                    />
                                  </div>

                                  {/* Cargo */}
                                  <div className="space-y-2">
                                    <label className={cn(
                                      "text-sm font-semibold flex items-center gap-2",
                                      theme === "dark" ? "text-slate-300" : "text-slate-700"
                                    )}>
                                      <Briefcase size={16} />
                                      Cargo
                                    </label>
                                    <input
                                      type="text"
                                      value={adminProfile.position}
                                      onChange={(e) =>
                                        setAdminProfile((prev) => ({ ...prev, position: e.target.value }))
                                      }
                                      className={cn(
                                        "w-full p-3 rounded-xl border outline-none transition-all",
                                        theme === "dark"
                                          ? "bg-orange-500/20 border-orange-500/30 text-white placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500/50"
                                          : "bg-white border-orange-200/50 text-slate-800 placeholder:text-slate-500 focus:ring-2 focus:ring-orange-500/50"
                                      )}
                                      placeholder="Ex: Gerente, Coordenador"
                                    />
                                  </div>

                                  {/* LinkedIn */}
                                  <div className="md:col-span-2 space-y-2">
                                    <label className={cn(
                                      "text-sm font-semibold flex items-center gap-2",
                                      theme === "dark" ? "text-slate-300" : "text-slate-700"
                                    )}>
                                      <Linkedin size={16} />
                                      LinkedIn
                                    </label>
                                    <input
                                      type="url"
                                      value={adminProfile.linkedin}
                                      onChange={(e) =>
                                        setAdminProfile((prev) => ({ ...prev, linkedin: e.target.value }))
                                      }
                                      className={cn(
                                        "w-full p-3 rounded-xl border outline-none transition-all",
                                        theme === "dark"
                                          ? "bg-orange-500/20 border-orange-500/30 text-white placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500/50"
                                          : "bg-white border-orange-200/50 text-slate-800 placeholder:text-slate-500 focus:ring-2 focus:ring-orange-500/50"
                                      )}
                                      placeholder="https://linkedin.com/in/seu-perfil"
                                    />
                                  </div>

                                  {/* Biografia */}
                                  <div className="md:col-span-2 space-y-2">
                                    <label className={cn(
                                      "text-sm font-semibold flex items-center gap-2",
                                      theme === "dark" ? "text-slate-300" : "text-slate-700"
                                    )}>
                                      <FileText size={16} />
                                      Biografia
                                    </label>
                                    <textarea
                                      value={adminProfile.bio}
                                      onChange={(e) =>
                                        setAdminProfile((prev) => ({ ...prev, bio: e.target.value }))
                                      }
                                      rows={4}
                                      className={cn(
                                        "w-full p-3 rounded-xl border outline-none transition-all resize-none",
                                        theme === "dark"
                                          ? "bg-orange-500/20 border-orange-500/30 text-white placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500/50"
                                          : "bg-white border-orange-200/50 text-slate-800 placeholder:text-slate-500 focus:ring-2 focus:ring-orange-500/50"
                                      )}
                                      placeholder="Conte um pouco sobre você..."
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Endereço */}
                              <div className="space-y-4">
                                <h3 className={cn(
                                  "text-lg font-bold pb-2 border-b",
                                  theme === "dark" 
                                    ? "text-white border-orange-500/30" 
                                    : "text-slate-800 border-orange-200/50"
                                )}>
                                  Endereço
                                </h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {/* CEP */}
                                  <div className="space-y-2">
                                    <label className={cn(
                                      "text-sm font-semibold flex items-center gap-2",
                                      theme === "dark" ? "text-slate-300" : "text-slate-700"
                                    )}>
                                      <Hash size={16} />
                                      CEP
                                    </label>
                                    <input
                                      type="text"
                                      value={adminProfile.zipCode}
                                      onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, "");
                                        let formatted = value;
                                        if (value.length > 5) {
                                          formatted = `${value.slice(0, 5)}-${value.slice(5, 8)}`;
                                        }
                                        setAdminProfile((prev) => ({ ...prev, zipCode: formatted }));
                                      }}
                                      className={cn(
                                        "w-full p-3 rounded-xl border outline-none transition-all",
                                        theme === "dark"
                                          ? "bg-orange-500/20 border-orange-500/30 text-white placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500/50"
                                          : "bg-white border-orange-200/50 text-slate-800 placeholder:text-slate-500 focus:ring-2 focus:ring-orange-500/50"
                                      )}
                                      placeholder="00000-000"
                                      maxLength={9}
                                    />
                                  </div>

                                  {/* Cidade */}
                                  <div className="space-y-2">
                                    <label className={cn(
                                      "text-sm font-semibold flex items-center gap-2",
                                      theme === "dark" ? "text-slate-300" : "text-slate-700"
                                    )}>
                                      <MapPin size={16} />
                                      Cidade
                                    </label>
                                    <input
                                      type="text"
                                      value={adminProfile.city}
                                      onChange={(e) =>
                                        setAdminProfile((prev) => ({ ...prev, city: e.target.value }))
                                      }
                                      className={cn(
                                        "w-full p-3 rounded-xl border outline-none transition-all",
                                        theme === "dark"
                                          ? "bg-orange-500/20 border-orange-500/30 text-white placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500/50"
                                          : "bg-white border-orange-200/50 text-slate-800 placeholder:text-slate-500 focus:ring-2 focus:ring-orange-500/50"
                                      )}
                                      placeholder="Digite a cidade"
                                    />
                                  </div>

                                  {/* Estado */}
                                  <div className="space-y-2">
                                    <label className={cn(
                                      "text-sm font-semibold flex items-center gap-2",
                                      theme === "dark" ? "text-slate-300" : "text-slate-700"
                                    )}>
                                      <Building size={16} />
                                      Estado
                                    </label>
                                    <input
                                      type="text"
                                      value={adminProfile.state}
                                      onChange={(e) =>
                                        setAdminProfile((prev) => ({ ...prev, state: e.target.value.toUpperCase() }))
                                      }
                                      className={cn(
                                        "w-full p-3 rounded-xl border outline-none transition-all",
                                        theme === "dark"
                                          ? "bg-orange-500/20 border-orange-500/30 text-white placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500/50"
                                          : "bg-white border-orange-200/50 text-slate-800 placeholder:text-slate-500 focus:ring-2 focus:ring-orange-500/50"
                                      )}
                                      placeholder="UF"
                                      maxLength={2}
                                    />
                                  </div>

                                  {/* Endereço Completo */}
                                  <div className="md:col-span-2 space-y-2">
                                    <label className={cn(
                                      "text-sm font-semibold flex items-center gap-2",
                                      theme === "dark" ? "text-slate-300" : "text-slate-700"
                                    )}>
                                      <Home size={16} />
                                      Endereço Completo
                                    </label>
                                    <input
                                      type="text"
                                      value={adminProfile.address}
                                      onChange={(e) =>
                                        setAdminProfile((prev) => ({ ...prev, address: e.target.value }))
                                      }
                                      className={cn(
                                        "w-full p-3 rounded-xl border outline-none transition-all",
                                        theme === "dark"
                                          ? "bg-orange-500/20 border-orange-500/30 text-white placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500/50"
                                          : "bg-white border-orange-200/50 text-slate-800 placeholder:text-slate-500 focus:ring-2 focus:ring-orange-500/50"
                                      )}
                                      placeholder="Rua, número, complemento"
                                    />
                                  </div>
                                </div>
                              </div>
                            </>
                          )}
                        </CardContent>
                        <CardFooter className="flex justify-end gap-3 pt-6 border-t border-border">
                          <Button
                            onClick={handleSaveProfile}
                            disabled={isSavingProfile || isLoadingProfile}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md px-8"
                            size="lg"
                          >
                            {isSavingProfile ? (
                              <>
                                <Loading size="sm" variant="spinner" className="mr-2" />
                                Salvando...
                              </>
                            ) : (
                              <>
                                <Save size={18} className="mr-2" />
                                Salvar Alterações
                              </>
                            )}
                          </Button>
                        </CardFooter>
                      </Card>
                    </div>
                  </div>
                </div>
              )}
            </div>
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
          onUpdateStatus={(id, updates) => {
            updateCall(id, updates);
            setSelectedCall(null);
          }}
        />
        <ConfirmationModal
          isOpen={!!confirmationType}
          onClose={() => setConfirmationType(null)}
          onConfirm={confirmAction}
          title="Confirmar"
          confirmText="Sim"
        >
          Confirmar ação?
        </ConfirmationModal>
      </div>
    </TooltipProvider>
  );
};
