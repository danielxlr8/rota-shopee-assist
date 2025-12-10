import React, { useState, useEffect, useMemo, useRef } from "react";
import type { Driver, SupportCall, UrgencyLevel } from "../types/logistics";
import {
  Clock,
  AlertTriangle,
  X,
  MapPin,
  Package,
  Building,
  LoaderCircle,
  Zap,
  CheckCircle,
  HelpCircle,
  Truck,
  Phone,
  XCircle,
  User,
  LogOut,
  Eye,
  EyeOff,
  Search,
  Camera,
  Ticket,
  Volume2,
  VolumeX,
  ExternalLink,
  CalendarClock,
  BookOpen,
  Calendar as CalendarIcon,
  Lock,
  Navigation as NavigationIcon,
  History as HistoryIcon,
  Sun,
  Moon,
  MinusCircle,
  PlusCircle,
  ArrowRightLeft,
} from "lucide-react";
import { auth, db, storage } from "../firebase";
import {
  doc,
  onSnapshot,
  updateDoc,
  collection,
  serverTimestamp,
  query,
  where,
  or,
  and,
  Timestamp,
  deleteField,
  getDocs,
  orderBy,
  addDoc,
} from "firebase/firestore";
import {
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { toast as sonnerToast } from "sonner";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Chatbot } from "./Chatbot";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DriverInterfaceProps {
  driver: Driver;
}

const hubs = [
  "LM Hub_PR_Londrina_Parque ABC II",
  "LM Hub_PR_Maringa",
  "LM Hub_PR_Foz do Iguaçu",
  "LM Hub_PR_Cascavel",
];

const supportReasons = [
  "Problemas Mecânicos",
  "Pneu Furado",
  "Acidente / Sinistro",
  "Roubo / Furto",
  "Problemas de Saúde",
  "Problemas Familiares",
  "Excesso de Pacotes",
  "Erro de Roteirização",
  "Outros",
];

const vehicleTypesList = ["moto", "carro passeio", "carro utilitario", "van"];
const sessionNotifiedCallIds = new Set<string>();

// --- FUNÇÕES AUXILIARES ---

const formatTimestamp = (
  timestamp: Timestamp | Date | null | undefined
): string => {
  if (!timestamp) return "N/A";
  const date = timestamp instanceof Timestamp ? timestamp.toDate() : timestamp;
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return "Data inválida";
  }
  return format(date, "dd/MM HH:mm", { locale: ptBR });
};

const formatPhoneNumber = (value: string) => {
  if (!value) return "";
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
};

const showNotification = (
  type: "success" | "error" | "warning" | "info",
  title: string,
  message: string
) => {
  const styles = {
    success: {
      icon: CheckCircle,
      color: "text-green-300",
      border: "border-l-4 border-green-500",
    },
    error: {
      icon: AlertTriangle,
      color: "text-red-300",
      border: "border-l-4 border-red-500",
    },
    warning: {
      icon: AlertTriangle,
      color: "text-orange-300",
      border: "border-l-4 border-orange-500",
    },
    info: {
      icon: CheckCircle,
      color: "text-blue-300",
      border: "border-l-4 border-blue-500",
    },
  };

  const { icon: Icon, color, border } = styles[type];

  sonnerToast.custom((t) => (
    <div
      className={cn(
        "flex w-full max-w-sm bg-slate-800/95 backdrop-blur-xl shadow-xl shadow-black/30 rounded-2xl overflow-hidden border border-white/20",
        border
      )}
    >
      <div className="p-4 flex items-start gap-3 w-full">
        <Icon size={20} className={cn("shrink-0 mt-0.5", color)} />
        <div className="flex-1">
          <p className="font-semibold text-sm text-white">{title}</p>
          <p className="text-xs text-white/70 mt-1">{message}</p>
        </div>
        <button
          onClick={() => sonnerToast.dismiss(t)}
          className="text-white/50 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  ));
};

const UrgencyBadge = ({ urgency }: { urgency: UrgencyLevel | undefined }) => {
  const styles = {
    BAIXA:
      "bg-white/60 dark:bg-white/10 text-muted-foreground dark:text-white/70 border-border dark:border-white/20 backdrop-blur-sm",
    MEDIA:
      "bg-blue-500/20 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-400/30 backdrop-blur-sm",
    ALTA: "bg-orange-500/20 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-400/30 backdrop-blur-sm",
    URGENTE:
      "bg-red-500/20 dark:bg-red-500/20 text-red-700 dark:text-red-300 border-red-400/30 backdrop-blur-sm",
  };
  const style = styles[urgency || "BAIXA"];

  return (
    <span
      className={cn(
        "text-[10px] font-bold px-2 py-0.5 rounded-xl border uppercase tracking-wide shadow-lg shadow-black/5 dark:shadow-black/10",
        style
      )}
    >
      {urgency || "Normal"}
    </span>
  );
};

// --- SUB-COMPONENTES ---

const ProfileHeaderCard = ({
  driver,
  onEditClick,
  isUploading,
  activeCall,
}: any) => {
  if (!driver) return null;

  const statusConfig = {
    DISPONIVEL: {
      label: "Disponível",
      color: "bg-green-500",
      text: "text-green-300",
      bg: "bg-green-500/20",
    },
    INDISPONIVEL: {
      label: "Indisponível",
      color: "bg-red-500",
      text: "text-red-300",
      bg: "bg-red-500/20",
    },
    EM_ROTA: {
      label: "Em Rota",
      color: "bg-blue-500",
      text: "text-blue-300",
      bg: "bg-blue-500/20",
    },
    OFFLINE: {
      label: "Offline",
      color: "bg-slate-400",
      text: "text-slate-300",
      bg: "bg-slate-500/20",
    },
  };

  const status =
    activeCall && activeCall.status === "ABERTO"
      ? {
          label: "Aguardando Apoio",
          color: "bg-orange-500",
          text: "text-orange-300",
          bg: "bg-orange-500/20",
        }
      : statusConfig[driver.status as keyof typeof statusConfig] ||
        statusConfig.OFFLINE;

  return (
    <Card className="border border-border dark:border-white/20 shadow-xl shadow-black/5 dark:shadow-black/20 bg-white/80 dark:bg-white/10 backdrop-blur-xl rounded-2xl overflow-hidden mb-6">
      <div className="h-24 bg-gradient-to-r from-[#FFCC33] via-[#FFA832] via-[#FE8330] via-[#FE5F2F] to-[#FD3A2D] relative">
        <div className="absolute inset-0 opacity-10 bg-[url('/spx-pattern.png')] bg-repeat" />
      </div>
      <div className="px-5 pb-5 relative">
        <div className="flex justify-between items-end -mt-10 mb-3">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-white/90 dark:bg-slate-800/80 backdrop-blur-xl p-1 shadow-xl shadow-black/10 dark:shadow-black/30 border border-border dark:border-white/20">
              <div className="w-full h-full rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700/60 relative group">
                {driver.avatar ? (
                  <img
                    src={driver.avatar}
                    alt={driver.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-200 dark:bg-slate-700/60 text-slate-600 dark:text-white/60 font-bold text-xl">
                    {driver.initials}
                  </div>
                )}
                <button
                  onClick={onEditClick}
                  className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm rounded-full"
                >
                  <Camera className="text-white w-6 h-6" />
                </button>
                {isUploading && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm rounded-full">
                    <LoaderCircle className="text-white animate-spin w-6 h-6" />
                  </div>
                )}
              </div>
            </div>
            <div
              className={cn(
                "absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-800",
                status.color
              )}
            />
          </div>
          <div
            className={cn(
              "px-3 py-1 rounded-xl text-xs font-bold border backdrop-blur-sm shadow-lg shadow-black/10 dark:shadow-black/20",
              status.bg,
              status.text,
              "border-border dark:border-white/20"
            )}
          >
            {status.label}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold text-foreground dark:text-white leading-tight">
            {driver.name}
          </h2>
          <p className="text-sm text-muted-foreground dark:text-white/70 flex items-center gap-1 mt-1">
            <Building size={14} />{" "}
            {driver.hub ? driver.hub.split("_")[2] : "Sem Hub"}
          </p>
          <div className="flex gap-4 mt-3 text-xs text-muted-foreground dark:text-white/80 flex-wrap">
            <div className="flex items-center gap-1.5 bg-white/60 dark:bg-white/10 backdrop-blur-xl px-2 py-1 rounded-xl border border-border dark:border-white/20">
              <Truck size={14} className="text-[#FA4F26]" />
              <span className="capitalize">{driver.vehicleType || "N/A"}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/60 dark:bg-white/10 backdrop-blur-xl px-2 py-1 rounded-xl border border-border dark:border-white/20">
              <Phone size={14} className="text-[#FA4F26]" />
              <span>{formatPhoneNumber(driver.phone)}</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

const DriverCallHistoryCard = ({
  call,
  userId,
  allDrivers,
  driver,
  onRequestApproval,
  onCancelSupport,
  onDeleteSupportRequest,
}: any) => {
  const isRequester = call.solicitante.id === userId;
  const otherPartyId = isRequester ? call.assignedTo : call.solicitante.id;
  const otherParty = allDrivers.find((d: Driver) => d.uid === otherPartyId);

  const handleWhatsAppClick = () => {
    if (!otherParty?.phone)
      return showNotification("error", "Erro", "Telefone indisponível.");
    const msg = encodeURIComponent(
      `Olá, sou ${driver.name} referente ao apoio logístico.`
    );
    window.open(`https://wa.me/55${otherParty.phone}?text=${msg}`, "_blank");
  };

  return (
    <Card className="border border-border dark:border-white/20 shadow-xl shadow-black/5 dark:shadow-black/20 hover:shadow-2xl hover:shadow-black/10 dark:hover:shadow-black/30 transition-all bg-white/80 dark:bg-white/10 backdrop-blur-xl rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-border dark:border-white/10">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "p-2 rounded-xl backdrop-blur-sm shadow-lg shadow-black/10",
              isRequester
                ? "bg-orange-500/20 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300 border border-orange-400/30"
                : "bg-blue-500/20 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-400/30"
            )}
          >
            {isRequester ? <Package size={18} /> : <Truck size={18} />}
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground dark:text-white">
              {isRequester
                ? "Minha Solicitação"
                : `Apoio para ${call.solicitante.name}`}
            </h3>
            <p className="text-xs text-muted-foreground dark:text-white/60 flex items-center gap-1">
              <CalendarClock size={12} /> {formatTimestamp(call.timestamp)}
            </p>
          </div>
        </div>
        <div className="text-right">
          <UrgencyBadge urgency={call.urgency} />
          <p className="text-[10px] font-medium text-muted-foreground dark:text-white/50 mt-1 uppercase tracking-wide">
            {call.status.replace("_", " ")}
          </p>
        </div>
      </div>

      <div className="p-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-[10px] uppercase font-bold text-muted-foreground dark:text-white/50 block mb-0.5">
            Rota ID
          </span>
          <span className="font-mono font-medium text-foreground dark:text-white bg-white/60 dark:bg-white/10 backdrop-blur-xl px-1.5 py-0.5 rounded-xl text-xs border border-border dark:border-white/20">
            {call.routeId || "N/A"}
          </span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-muted-foreground dark:text-white/50 block mb-0.5">
            Pacotes
          </span>
          <span className="font-medium text-foreground dark:text-white">
            {call.packageCount || 0} un.
          </span>
        </div>
        <div className="col-span-2">
          <span className="text-[10px] uppercase font-bold text-muted-foreground dark:text-white/50 block mb-0.5">
            Localização
          </span>
          <a
            href={call.location}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-blue-600 dark:text-blue-300 hover:text-blue-500 dark:hover:text-blue-200 hover:underline text-xs font-medium truncate transition-colors"
          >
            <MapPin size={12} /> {call.location} <ExternalLink size={10} />
          </a>
        </div>
      </div>

      {["EM ANDAMENTO", "ABERTO", "AGUARDANDO_APROVACAO"].includes(
        call.status
      ) && (
        <div className="p-3 bg-white/40 dark:bg-white/5 backdrop-blur-xl border-t border-border dark:border-white/10 flex justify-end gap-2 flex-wrap">
          {otherParty && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleWhatsAppClick}
              className="h-8 text-xs gap-1.5 border-green-400/30 text-green-300 hover:bg-green-500/20 hover:text-green-200 backdrop-blur-xl rounded-xl"
            >
              <Phone size={14} /> Contatar
            </Button>
          )}
          {!isRequester && call.status === "EM ANDAMENTO" && (
            <>
              <Button
                size="sm"
                onClick={() => onRequestApproval(call.id)}
                className="h-8 text-xs bg-[#FA4F26] hover:bg-[#EE4D2D] text-white rounded-xl shadow-lg shadow-orange-500/30"
              >
                <CheckCircle size={14} className="mr-1" /> Finalizar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCancelSupport(call.id)}
                className="h-8 text-xs text-red-300 hover:bg-red-500/20 rounded-xl"
              >
                Cancelar
              </Button>
            </>
          )}
          {isRequester && call.status !== "CONCLUIDO" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDeleteSupportRequest(call.id)}
              className="h-8 text-xs text-red-300 hover:bg-red-500/20 rounded-xl"
            >
              <XCircle size={14} className="mr-1" /> Cancelar Pedido
            </Button>
          )}
        </div>
      )}
    </Card>
  );
};

const OpenCallCard = ({ call, acceptingCallId, onAccept }: any) => {
  const isAccepting = acceptingCallId === call.id;

  return (
    <Card className="border-l-4 border-l-[#FA4F26] border-y border-r border-border dark:border-white/20 shadow-xl shadow-black/5 dark:shadow-black/20 bg-white/80 dark:bg-white/10 backdrop-blur-xl rounded-2xl group hover:shadow-2xl hover:shadow-black/10 dark:hover:shadow-black/30 transition-all">
      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/60 dark:bg-white/10 backdrop-blur-xl flex items-center justify-center text-[#FA4F26] font-bold text-sm border border-border dark:border-white/20 shadow-lg shadow-black/10 dark:shadow-black/20">
              {call.solicitante.initials}
            </div>
            <div>
              <h4 className="font-bold text-foreground dark:text-white text-sm">
                {call.solicitante.name}
              </h4>
              <div className="flex items-center gap-1 text-xs text-muted-foreground dark:text-white/60">
                <Building size={10} />
                <span className="truncate max-w-[150px]">
                  {call.hub?.split("_")[2]}
                </span>
              </div>
            </div>
          </div>
          <UrgencyBadge urgency={call.urgency} />
        </div>

        <div className="flex gap-2 mb-4">
          <div className="flex-1 bg-white/60 dark:bg-white/10 backdrop-blur-xl rounded-xl px-3 py-2 border border-border dark:border-white/20 shadow-lg shadow-black/5 dark:shadow-black/10">
            <span className="text-[10px] font-bold text-muted-foreground dark:text-white/50 uppercase block">
              Pacotes
            </span>
            <span className="font-bold text-foreground dark:text-white text-lg flex items-center gap-1">
              <Package size={16} className="text-[#FA4F26]" />{" "}
              {call.packageCount}
            </span>
          </div>
          <div className="flex-1 bg-white/60 dark:bg-white/10 backdrop-blur-xl rounded-xl px-3 py-2 border border-border dark:border-white/20 shadow-lg shadow-black/5 dark:shadow-black/10">
            <span className="text-[10px] font-bold text-muted-foreground dark:text-white/50 uppercase block">
              Veículo
            </span>
            <span className="font-bold text-foreground dark:text-white text-sm flex items-center gap-1 capitalize h-7">
              <Truck size={16} className="text-[#FA4F26]" /> {call.vehicleType}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex-1 flex items-center gap-2 text-xs text-muted-foreground dark:text-white/70 bg-white/60 dark:bg-white/10 backdrop-blur-xl p-2 rounded-xl border border-border dark:border-white/20 truncate shadow-lg shadow-black/5 dark:shadow-black/10 min-w-[200px]">
            <MapPin
              size={14}
              className="text-muted-foreground dark:text-white/50 shrink-0"
            />
            <span className="truncate">{call.location}</span>
          </div>
          <Button
            onClick={() => onAccept(call.id)}
            disabled={!!acceptingCallId}
            className="bg-[#FA4F26] hover:bg-[#EE4D2D] text-white font-bold text-xs h-9 px-4 rounded-xl shadow-lg shadow-orange-500/30 transition-transform active:scale-95"
          >
            {isAccepting ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              "ACEITAR"
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
};

// --- COMPONENTE PRINCIPAL ---

export const DriverInterface: React.FC<DriverInterfaceProps> = ({ driver }) => {
  // --- Estados ---
  const [allMyCalls, setAllMyCalls] = useState<SupportCall[]>([]);
  const [openSupportCalls, setOpenSupportCalls] = useState<SupportCall[]>([]);
  const [allDrivers, setAllDrivers] = useState<Driver[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [initialTabSet, setInitialTabSet] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Form States
  const [location, setLocation] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");
  const [packageCount, setPackageCount] = useState("");
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [deliveryRegions, setDeliveryRegions] = useState([""]);
  const [neededVehicles, setNeededVehicles] = useState([""]);
  const [hub, setHub] = useState("");
  const [isBulky, setIsBulky] = useState(false);

  // Profile States
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [hubSearch, setHubSearch] = useState("");
  const [isHubDropdownOpen, setIsHubDropdownOpen] = useState(false);
  const [shopeeId, setShopeeId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isReauthModalOpen, setIsReauthModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [reauthError, setReauthError] = useState("");
  const [isReauthenticating, setIsReauthenticating] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // UI States
  const [historyFilter, setHistoryFilter] = useState<
    "all" | "requester" | "provider" | "inProgress"
  >("all");
  const [startDate, setStartDate] = useState<Date | undefined>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d;
  });
  const [endDate, setEndDate] = useState<Date | undefined>(() => new Date());

  const [routeIdSearch, setRouteIdSearch] = useState("");
  // Removed unused state: setGlobalHubFilter
  const globalHubFilter = "Todos os Hubs";
  const [isMuted, setIsMuted] = useState(false);
  const [isProfileWarningVisible, setIsProfileWarningVisible] = useState(true);
  const [acceptingCallId, setAcceptingCallId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const userId = auth.currentUser?.uid;
  const isInitialOpenCallsLoad = useRef(true);

  const TABS = useMemo(
    () => [
      { id: "availability", label: "Status", icon: <Zap size={20} /> },
      { id: "support", label: "Apoio", icon: <AlertTriangle size={20} /> },
      { id: "activeCalls", label: "Chamados", icon: <Clock size={20} /> },
      { id: "tutorial", label: "Ajuda", icon: <BookOpen size={20} /> },
      { id: "profile", label: "Perfil", icon: <User size={20} /> },
    ],
    []
  );

  type TabId =
    | "availability"
    | "support"
    | "activeCalls"
    | "tutorial"
    | "profile";
  const [activeTab, setActiveTab] = useState<TabId>("profile");

  const tutorialsSolicitante = [
    {
      id: "sol-1",
      question: "Como iniciar uma transferência?",
      answer:
        "Vá em: Menu > Transferência de Pacotes > Minhas transferências > Iniciar transferência de pacotes, escolha o motivo no qual se encaixa sua ocorrencia'.",
    },
    {
      id: "sol-2",
      question: "O que é o 'Acionando Socorro'?",
      answer:
        "Se você tiver um impedimento para a entrega (ex: sinistro), você deve acionar o socorro no app para que outro entregador possa te apoiar e realizar a entrega.",
    },
    {
      id: "sol-3",
      question: "Como cancelar uma transferência que não foi recebida?",
      answer:
        "Vá em: Minhas Transferências > Transferência em andamento > Cancelar solicitação > Confirmar.",
    },
  ];
  const tutorialsPrestador = [
    {
      id: "pres-1",
      question: "Onde vejo os pacotes que devo receber?",
      answer:
        "No menu 'Transferência de Pacotes', vá para a aba 'Meus recebidos' para ver as transferências destinadas a você.",
    },
    {
      id: "pres-2",
      question: "Como eu recebo os pacotes no meu APP?",
      answer:
        "No menu  Meus recebidos > Receber pacotes de Transferências de pacotes > Bipe pacotes > Finalizar Bipes",
    },
    {
      id: "pres-3",
      question: "Como eu importo minhas rotas transferidas para o APP circuit?",
      answer: `Clique nos 3 pontinhos dentro do app (...) e após isso clique em 'importar planilha' e faça o upload do arquivo. \nSelecione a opção 'Sequencia' para roteirizar da forma correta, Após isto já estará organizado. :)`,
    },
  ];

  const isProfileComplete = useMemo(() => {
    if (!driver) return false;
    return !!(
      driver.hub &&
      driver.vehicleType &&
      driver.phone &&
      driver.name &&
      shopeeId &&
      !shopeeId.includes("Erro")
    );
  }, [driver, shopeeId]);

  const activeCallForDriver = useMemo(() => {
    return (
      allMyCalls.find(
        (call) => call.solicitante.id === userId && call.status === "ABERTO"
      ) || null
    );
  }, [allMyCalls, userId]);

  const filteredHubs = useMemo(() => {
    if (!hubSearch) return hubs;
    return hubs.filter((h) =>
      h.toLowerCase().includes(hubSearch.toLowerCase())
    );
  }, [hubSearch]);

  const filteredCalls = useMemo(() => {
    const active = allMyCalls.filter(
      (c) =>
        (globalHubFilter === "Todos os Hubs" || c.hub === globalHubFilter) &&
        c.status !== "EXCLUIDO"
    );
    if (historyFilter === "requester")
      return active.filter((c) => c.solicitante.id === userId);
    if (historyFilter === "provider")
      return active.filter((c) => c.assignedTo === userId);
    if (historyFilter === "inProgress")
      return active.filter((c) =>
        ["EM ANDAMENTO", "AGUARDANDO_APROVACAO"].includes(c.status)
      );
    return active;
  }, [allMyCalls, historyFilter, userId, globalHubFilter]);

  const filteredOpenCalls = useMemo(
    () =>
      openSupportCalls.filter(
        (c) =>
          (globalHubFilter === "Todos os Hubs" || c.hub === globalHubFilter) &&
          (!routeIdSearch ||
            c.routeId?.toLowerCase().includes(routeIdSearch.toLowerCase()))
      ),
    [openSupportCalls, routeIdSearch, globalHubFilter]
  );

  // Removed unused variable: allHubs

  // --- Efeitos ---
  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");
  }, []);

  const toggleTheme = () => {
    const root = window.document.documentElement;
    if (theme === "light") {
      root.classList.add("dark");
      setTheme("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      setTheme("light");
      localStorage.setItem("theme", "light");
    }
  };

  useEffect(() => {
    if (isProfileComplete && !initialTabSet) {
      setActiveTab("availability");
      setInitialTabSet(true);
    } else if (!isProfileComplete && !initialTabSet) {
      setActiveTab("profile");
      setInitialTabSet(true);
    }
  }, [isProfileComplete, initialTabSet]);

  useEffect(() => {
    if (driver) {
      setName(driver.name || "");
      setPhone(driver.phone || "");
      setHub(driver.hub || "");
      setVehicleType(driver.vehicleType || "");
      setHubSearch(driver.hub || "");
    }
  }, [driver]);

  useEffect(() => {
    const fetchShopeeId = async () => {
      if (driver?.uid) {
        setShopeeId("Carregando...");
        const driversRef = collection(db, "motoristas_pre_aprovados");
        const q = query(
          driversRef,
          or(
            where("uid", "==", driver.uid),
            where("googleUid", "==", driver.uid)
          )
        );
        try {
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            setShopeeId(querySnapshot.docs[0].id);
          } else {
            setShopeeId("Não encontrado");
          }
        } catch (error) {
          setShopeeId("Erro ao buscar");
        }
      }
    };
    fetchShopeeId();
  }, [driver?.uid]);

  const toggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    localStorage.setItem("notificationsMuted", String(newMutedState));
    if (!newMutedState) {
      const audio = new Audio("/shopee-ringtone.mp3");
      audio.volume = 0.3;
      audio.play().catch(() => {});
    }
    sonnerToast.custom((t) => (
      <div className="flex w-full max-w-sm items-center gap-4 rounded-xl bg-slate-800/95 backdrop-blur-xl p-4 shadow-xl border border-white/20 ring-1 ring-black/5">
        <div
          className={cn(
            "p-2 rounded-full",
            newMutedState
              ? "bg-red-500/20 text-red-300 border border-red-400/30"
              : "bg-green-500/20 text-green-300 border border-green-400/30"
          )}
        >
          {newMutedState ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm text-white">
            {newMutedState ? "Silenciado" : "Som Ativado"}
          </p>
        </div>
        <button
          onClick={() => sonnerToast.dismiss(t)}
          className="text-white/50 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>
      </div>
    ));
  };

  const triggerNotificationRef = useRef((_newCall: SupportCall) => {});

  useEffect(() => {
    triggerNotificationRef.current = (newCall: SupportCall) => {
      if (
        driver?.status !== "DISPONIVEL" ||
        sessionNotifiedCallIds.has(newCall.id)
      )
        return;
      if (!isMuted) {
        const audio = new Audio("/shopee-ringtone.mp3");
        audio.play().catch(() => {});
      }
      sonnerToast.custom((t) => (
        <div className="flex w-full bg-slate-800/95 backdrop-blur-xl border-l-4 border-[#FA4F26] p-4 rounded-xl shadow-xl shadow-black/30 border border-white/20">
          <div className="flex-1">
            <p className="font-bold text-white">Novo Apoio Solicitado</p>
            <p className="text-sm text-white/70">
              {newCall.solicitante.name} precisa de ajuda.
            </p>
          </div>
          <button
            onClick={() => sonnerToast.dismiss(t)}
            className="text-white/50 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>
      ));
      sessionNotifiedCallIds.add(newCall.id);
    };
  }, [driver?.status, isMuted]);

  useEffect(() => {
    if (!userId) return;
    const allDriversQuery = query(collection(db, "motoristas_pre_aprovados"));
    const unsubscribeAllDrivers = onSnapshot(allDriversQuery, (snapshot) => {
      const driversData = snapshot.docs.map(
        (doc) => ({ ...doc.data(), uid: doc.id } as Driver)
      );
      setAllDrivers(driversData);
    });

    const start = startDate ? new Date(startDate) : new Date(0);
    start.setHours(0, 0, 0, 0);
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    const myCallsQuery = query(
      collection(db, "supportCalls"),
      and(
        or(
          where("solicitante.id", "==", userId),
          where("assignedTo", "==", userId)
        ),
        where("timestamp", ">=", Timestamp.fromDate(start)),
        where("timestamp", "<=", Timestamp.fromDate(end))
      ),
      orderBy("timestamp", "desc")
    );

    const unsubscribeMyCalls = onSnapshot(myCallsQuery, (snapshot) => {
      const callsData = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as SupportCall)
      );
      setAllMyCalls(callsData);
    });

    const openCallsQuery = query(
      collection(db, "supportCalls"),
      where("status", "==", "ABERTO")
    );
    const unsubscribeOpenCalls = onSnapshot(openCallsQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const callData = {
          id: change.doc.id,
          ...change.doc.data(),
        } as SupportCall;
        if (callData.solicitante.id !== userId) {
          if (change.type === "added" && !isInitialOpenCallsLoad.current)
            triggerNotificationRef.current(callData);
          if (change.type === "removed")
            sessionNotifiedCallIds.delete(callData.id);
        }
      });
      isInitialOpenCallsLoad.current = false;
      const openCallsData = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as SupportCall)
      );
      setOpenSupportCalls(
        openCallsData.filter((call) => call.solicitante.id !== userId)
      );
    });

    return () => {
      unsubscribeMyCalls();
      unsubscribeOpenCalls();
      unsubscribeAllDrivers();
    };
  }, [userId, startDate, endDate]);

  const updateDriver = async (
    driverId: string,
    updates: Partial<Omit<Driver, "uid">>
  ) => {
    if (!driverId) return;
    await updateDoc(doc(db, "motoristas_pre_aprovados", driverId), updates);
  };

  const updateCall = async (
    id: string,
    updates: Partial<Omit<SupportCall, "id">>
  ) => {
    await updateDoc(doc(db, "supportCalls", id), updates as any);
  };

  const addNewCall = async (newCall: any) => {
    await addDoc(collection(db, "supportCalls"), {
      ...newCall,
      timestamp: serverTimestamp(),
    });
  };

  // --- HANDLERS ---

  const handleAddField = (
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setter((prev) => [...prev, ""]);
  };

  const handleRemoveField = (
    index: number,
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setter((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFieldChange = (
    index: number,
    value: string,
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setter((prev) => {
      const newValues = [...prev];
      newValues[index] = value;
      return newValues;
    });
  };

  const handleAvailabilityChange = (isAvailable: boolean) => {
    if (!isProfileComplete || !shopeeId)
      return showNotification(
        "error",
        "Perfil Incompleto",
        "Verifique seus dados."
      );
    updateDriver(shopeeId, {
      status: isAvailable ? "DISPONIVEL" : "INDISPONIVEL",
    });
  };

  const handleAcceptCall = async (callId: string) => {
    if (!isProfileComplete || !userId || !shopeeId)
      return showNotification("error", "Erro", "Perfil incompleto.");
    if (driver.status === "EM_ROTA")
      return showNotification("error", "Ocupado", "Você já está em rota.");
    setAcceptingCallId(callId);
    try {
      await updateCall(callId, { assignedTo: userId, status: "EM ANDAMENTO" });
      await updateDriver(shopeeId, { status: "EM_ROTA" });
    } catch {
      showNotification("error", "Erro", "Falha ao aceitar.");
    } finally {
      setAcceptingCallId(null);
    }
  };

  const handleRequestApproval = (id: string) => {
    updateCall(id, { status: "AGUARDANDO_APROVACAO" })
      .then(() =>
        showNotification("success", "Sucesso", "Solicitado aprovação.")
      )
      .catch(() => showNotification("error", "Erro", "Falha na solicitação."));
  };

  const handleCancelSupport = async (id: string) => {
    if (!userId || !shopeeId) return;
    await updateCall(id, {
      assignedTo: deleteField(),
      status: "ABERTO",
    } as any);
    await updateDriver(shopeeId, { status: "DISPONIVEL" });
    showNotification("success", "Cancelado", "Apoio cancelado.");
  };

  const onDeleteSupportRequest = async (id: string) => {
    await updateCall(id, {
      status: "EXCLUIDO",
      deletedAt: serverTimestamp(),
    } as any);
    showNotification("success", "Excluído", "Solicitação removida.");
  };

  const handleUpdateProfile = () => {
    if (!shopeeId) return;
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length !== 11)
      return showNotification("error", "Telefone", "Use DDD + 9 dígitos.");
    if (!hubs.includes(hub))
      return showNotification("error", "Hub", "Selecione um Hub válido.");
    updateDriver(shopeeId, { name, phone: cleanPhone, hub, vehicleType });
    showNotification("success", "Salvo", "Perfil atualizado.");
    setIsProfileWarningVisible(false);
  };

  const handleChangePassword = () => {
    if (newPassword !== confirmPassword) {
      showNotification("error", "Erro", "Senhas não conferem.");
      return;
    }
    if (newPassword.length < 6) {
      showNotification("error", "Erro", "Senha muito curta.");
      return;
    }
    setIsReauthModalOpen(true);
  };

  const handleReauthenticateAndChange = async () => {
    const user = auth.currentUser;
    if (!user || !user.email) return;
    setIsReauthenticating(true);
    try {
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword
      );
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      showNotification("success", "Sucesso", "Senha alterada.");
      setIsReauthModalOpen(false);
      setNewPassword("");
      setConfirmPassword("");
      setCurrentPassword("");
    } catch {
      setReauthError("Senha incorreta.");
    } finally {
      setIsReauthenticating(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !shopeeId) return;
    setIsUploading(true);
    if (driver.avatar) {
      try {
        await deleteObject(ref(storage, driver.avatar));
      } catch {}
    }
    const storageRef = ref(storage, `avatars/${shopeeId}/avatar.jpg`);
    const uploadTask = uploadBytesResumable(storageRef, file);
    uploadTask.on(
      "state_changed",
      null,
      (err) => {
        setIsUploading(false);
        showNotification("error", "Erro", err.message);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((url) => {
          updateDriver(shopeeId, { avatar: url });
          setIsUploading(false);
          showNotification("success", "Foto", "Atualizada com sucesso.");
        });
      }
    );
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setModalError("Geolocalização não suportada.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation(
          `http://googleusercontent.com/maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`
        );
        setIsLocating(false);
      },
      () => {
        setModalError("Erro ao obter localização.");
        setIsLocating(false);
      }
    );
  };

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setModalError("");
    const user = auth.currentUser;
    if (!user || !driver) {
      setIsSubmitting(false);
      return;
    }

    const pkg = Number(packageCount);
    const regions = deliveryRegions.filter(Boolean);
    const vehicles = neededVehicles.filter(Boolean);

    if (pkg < 20) {
      setModalError("Mínimo 20 pacotes.");
      setIsSubmitting(false);
      return;
    }
    if (
      !location ||
      !hub ||
      !reason ||
      !description ||
      regions.length === 0 ||
      vehicles.length === 0
    ) {
      setModalError("Preencha todos os campos.");
      setIsSubmitting(false);
      return;
    }

    const informalDesc = `MOTIVO: ${reason}. DETALHES: ${description}. Hub: ${hub}. Loc: ${location}. Qtd: ${pkg}. Regiões: ${regions.join(
      ", "
    )}. Veículos: ${vehicles.join(", ")}. ${isBulky ? "VOLUMOSO" : ""}`;

    try {
      const professionalDesc = informalDesc;

      let urgency: UrgencyLevel = "BAIXA";
      if (pkg >= 100) urgency = "URGENTE";
      else if (pkg >= 90) urgency = "ALTA";
      else if (pkg >= 60) urgency = "MEDIA";

      const newCall = {
        routeId: `SPX-${Date.now().toString().slice(-6)}`,
        description: professionalDesc,
        urgency,
        location,
        status: "ABERTO",
        vehicleType: vehicles.join(", "),
        isBulky,
        hub,
        packageCount: pkg,
        deliveryRegions: regions,
        solicitante: {
          id: driver.uid,
          name: driver.name,
          avatar: driver.avatar || null, // Garante que não seja undefined
          // CORREÇÃO: Valor padrão caso initials seja undefined
          initials:
            driver.initials || driver.name?.charAt(0).toUpperCase() || "M",
          phone: driver.phone,
        },
      };

      await addNewCall(newCall);
      setIsSupportModalOpen(false);
      setShowSuccessModal(true);
      setDeliveryRegions([""]);
      setNeededVehicles([""]);
      setReason("");
      setDescription("");
      setPackageCount("");
    } catch (err: any) {
      setModalError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- RENDER ---
  return (
    <div className="light-bg-gradient dark:dark-bg-gradient min-h-dvh font-sans text-foreground pb-20 transition-colors duration-300">
      {/* HEADER */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-white/5 backdrop-blur-md border-b border-border dark:border-white/10 px-4 sm:px-6 py-3 flex justify-between items-center shadow-lg shadow-black/5 dark:shadow-black/20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#EE4D2D] rounded-xl flex items-center justify-center text-white shadow-lg shadow-[#EE4D2D]/30">
            <ArrowRightLeft
              size={18}
              strokeWidth={3}
              className="sm:w-5 sm:h-5"
            />
          </div>
          <h1 className="font-bold text-foreground dark:text-white text-sm sm:text-base tracking-tight border-l border-border dark:border-white/20 pl-3 ml-1">
            Sistema Logístico
          </h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground dark:text-zinc-400 dark:hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Alternar tema"
          >
            {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <button
            onClick={() => auth.signOut()}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground dark:text-zinc-400 dark:hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Sair"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {!isProfileComplete && isProfileWarningVisible && (
        <div className="m-4 bg-[#EE4D2D]/10 dark:bg-[#EE4D2D]/20 backdrop-blur-md border-l-4 border-[#EE4D2D] p-4 rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 flex justify-between items-center border border-border dark:border-white/10">
          <div>
            <p className="font-bold text-[#EE4D2D] text-sm">Atenção</p>
            <p className="text-xs text-muted-foreground dark:text-zinc-400">
              Complete seu perfil para operar.
            </p>
          </div>
          <X
            size={16}
            className="text-muted-foreground dark:text-zinc-400 hover:text-foreground dark:hover:text-white cursor-pointer transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            onClick={() => setIsProfileWarningVisible(false)}
          />
        </div>
      )}

      <main className="p-4 sm:p-6 max-w-lg lg:max-w-4xl xl:max-w-6xl mx-auto space-y-6">
        <ProfileHeaderCard
          driver={driver}
          isUploading={isUploading}
          onEditClick={() => fileInputRef.current?.click()}
          activeCall={activeCallForDriver}
        />
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleAvatarUpload}
          className="hidden"
          accept="image/*"
        />

        {/* TABS NAVIGATION */}
        <div className="bg-white/80 dark:bg-white/10 backdrop-blur-xl p-1 rounded-2xl border border-border dark:border-white/20 flex justify-between shadow-xl shadow-black/5 dark:shadow-black/20 overflow-x-auto scrollbar-hide">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabId)}
              className={cn(
                "flex-1 flex flex-col items-center py-2 px-1 sm:px-2 rounded-xl text-[10px] sm:text-xs uppercase font-bold tracking-wide min-w-[60px] sm:min-w-[80px] transition-all duration-300 ease-in-out",
                activeTab === tab.id
                  ? "bg-[#FA4F26] text-white shadow-lg shadow-orange-500/30 transform scale-105"
                  : "text-muted-foreground dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/10 hover:text-foreground dark:hover:text-white hover:scale-102"
              )}
            >
              <div className="transition-transform duration-300 ease-in-out">
                {React.cloneElement(tab.icon, {
                  size: 18,
                  className: cn(
                    "mb-1 sm:w-5 sm:h-5 transition-all duration-300",
                    activeTab === tab.id && "scale-110"
                  ),
                })}
              </div>
              <span className="hidden sm:inline transition-opacity duration-300">
                {tab.label}
              </span>
              <span className="sm:hidden transition-opacity duration-300">
                {tab.label.split(" ")[0]}
              </span>
            </button>
          ))}
        </div>

        {/* TAB CONTENT AREAS */}
        <div className="min-h-[400px]">
          {activeTab === "availability" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white/80 dark:bg-white/10 backdrop-blur-xl rounded-2xl p-6 shadow-xl shadow-black/5 dark:shadow-black/20 border border-border dark:border-white/20 text-center">
                <h3 className="font-bold text-foreground dark:text-white mb-4">
                  Seu Status Atual
                </h3>
                <div className="flex gap-4 mb-4">
                  <button
                    onClick={() => handleAvailabilityChange(true)}
                    className={cn(
                      "flex-1 py-4 rounded-xl border-2 font-bold text-sm transition-all flex flex-col items-center gap-2 backdrop-blur-sm shadow-lg shadow-black/10 dark:shadow-black/20",
                      driver.status === "DISPONIVEL"
                        ? "border-green-500 bg-green-500/20 dark:bg-green-500/20 text-green-700 dark:text-green-300 shadow-green-500/30"
                        : "border-border dark:border-white/20 bg-white/40 dark:bg-white/5 text-muted-foreground dark:text-white/40"
                    )}
                  >
                    <CheckCircle size={24} /> DISPONÍVEL
                  </button>
                  <button
                    onClick={() => handleAvailabilityChange(false)}
                    className={cn(
                      "flex-1 py-4 rounded-xl border-2 font-bold text-sm transition-all flex flex-col items-center gap-2 backdrop-blur-sm shadow-lg shadow-black/10 dark:shadow-black/20",
                      driver.status !== "DISPONIVEL"
                        ? "border-red-500 bg-red-500/20 dark:bg-red-500/20 text-red-700 dark:text-red-300 shadow-red-500/30"
                        : "border-border dark:border-white/20 bg-white/40 dark:bg-white/5 text-muted-foreground dark:text-white/40"
                    )}
                  >
                    <XCircle size={24} /> INDISPONÍVEL
                  </button>
                </div>

                {/* Mensagem de Status */}
                <div
                  className={cn(
                    "mt-4 p-3 rounded-xl backdrop-blur-sm border transition-all duration-300",
                    driver.status === "DISPONIVEL"
                      ? "bg-green-500/20 dark:bg-green-500/20 border-green-400/30 shadow-lg shadow-green-500/20"
                      : "bg-red-500/20 dark:bg-red-500/20 border-red-400/30 shadow-lg shadow-red-500/20"
                  )}
                >
                  <p
                    className={cn(
                      "text-sm font-semibold transition-colors duration-300",
                      driver.status === "DISPONIVEL"
                        ? "text-green-700 dark:text-green-300"
                        : "text-red-700 dark:text-red-300"
                    )}
                  >
                    {driver.status === "DISPONIVEL"
                      ? "✓ Você está disponível para receber chamados"
                      : "✗ Você está indisponível no momento"}
                  </p>
                </div>
              </div>

              {driver.status === "DISPONIVEL" && (
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-foreground dark:text-white">
                      Chamados na Região
                    </h3>
                    <Badge
                      variant="outline"
                      className="bg-orange-500/20 text-orange-300 border-orange-400/30 backdrop-blur-sm rounded-xl shadow-lg shadow-black/10"
                    >
                      {filteredOpenCalls.length} ativos
                    </Badge>
                  </div>

                  <div className="relative mb-4">
                    <Search
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50"
                      size={16}
                    />
                    <input
                      type="text"
                      placeholder="Filtrar rota..."
                      value={routeIdSearch}
                      onChange={(e) => setRouteIdSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-border dark:border-white/20 bg-white/80 dark:bg-white/10 backdrop-blur-xl text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-white/50 text-sm focus:ring-2 focus:ring-[#FA4F26] focus:border-[#FA4F26]/50 outline-none shadow-lg shadow-black/5 dark:shadow-black/10"
                    />
                  </div>

                  <div className="space-y-3">
                    {filteredOpenCalls.length > 0 ? (
                      filteredOpenCalls.map((call) => (
                        <OpenCallCard
                          key={call.id}
                          call={call}
                          acceptingCallId={acceptingCallId}
                          onAccept={handleAcceptCall}
                        />
                      ))
                    ) : (
                      <div className="text-center py-12 bg-white/80 dark:bg-white/10 backdrop-blur-xl rounded-2xl border border-dashed border-border dark:border-white/20 shadow-xl shadow-black/5 dark:shadow-black/20">
                        <Ticket
                          size={32}
                          className="mx-auto text-muted-foreground dark:text-white/30 mb-2"
                        />
                        <p className="text-sm text-muted-foreground dark:text-white/60">
                          Nenhum chamado disponível no momento.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "support" && (
            <div className="flex flex-col items-center justify-center py-8 space-y-6 animate-in fade-in">
              <div className="w-20 h-20 bg-orange-500/20 dark:bg-orange-500/20 backdrop-blur-xl rounded-full flex items-center justify-center text-[#FA4F26] mb-2 border border-border dark:border-white/20 shadow-xl shadow-black/5 dark:shadow-black/20">
                <AlertTriangle size={40} />
              </div>
              <div className="text-center space-y-2 max-w-xs">
                <h2 className="text-2xl font-bold text-foreground dark:text-white">
                  Precisa de Apoio?
                </h2>
                <p className="text-sm text-muted-foreground dark:text-white/70">
                  Solicite ajuda para transferir pacotes em caso de imprevistos.
                  Mínimo de 20 pacotes.
                </p>
              </div>
              <Button
                onClick={() => {
                  setModalError("");
                  setIsSupportModalOpen(true);
                }}
                className="w-full max-w-sm h-14 text-lg bg-[#FA4F26] hover:bg-[#EE4D2D] font-bold shadow-xl shadow-orange-500/30 rounded-xl"
              >
                SOLICITAR SOCORRO
              </Button>
            </div>
          )}

          {activeTab === "activeCalls" && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex gap-2 overflow-x-auto pb-2">
                {["all", "inProgress", "requester", "provider"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setHistoryFilter(f as any)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-bold border whitespace-nowrap backdrop-blur-xl shadow-lg shadow-black/5 dark:shadow-black/10 transition-all duration-300 ease-in-out",
                      historyFilter === f
                        ? "bg-white/60 dark:bg-white/20 text-foreground dark:text-white border-border dark:border-white/30 shadow-xl transform scale-105"
                        : "bg-white/40 dark:bg-white/10 text-muted-foreground dark:text-white/70 border-border dark:border-white/20 hover:bg-white/60 dark:hover:bg-white/15 hover:text-foreground dark:hover:text-white hover:scale-102"
                    )}
                  >
                    {f === "all"
                      ? "Todos"
                      : f === "inProgress"
                      ? "Em Andamento"
                      : f === "requester"
                      ? "Meus Pedidos"
                      : "Meus Apoios"}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 mb-2 flex-wrap items-center">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "h-8 text-xs font-normal justify-start text-left w-[130px] bg-white/80 dark:bg-white/10 border-border dark:border-white/20 text-foreground dark:text-white/80 hover:bg-white dark:hover:bg-white/15 backdrop-blur-xl rounded-xl shadow-lg shadow-black/5 dark:shadow-black/10 transition-all duration-300 ease-in-out hover:scale-105",
                        !startDate && "text-muted-foreground dark:text-white/50"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-3 w-3 transition-transform duration-300 group-hover:rotate-12" />
                      {startDate ? (
                        format(startDate, "dd/MM/yy", { locale: ptBR })
                      ) : (
                        <span>Início</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-0 bg-white dark:bg-slate-800/95 backdrop-blur-xl border-border dark:border-white/20 rounded-2xl shadow-xl shadow-black/10 dark:shadow-black/30"
                    align="start"
                  >
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "h-8 text-xs font-normal justify-start text-left w-[130px] bg-white/80 dark:bg-white/10 border-border dark:border-white/20 text-foreground dark:text-white/80 hover:bg-white dark:hover:bg-white/15 backdrop-blur-xl rounded-xl shadow-lg shadow-black/5 dark:shadow-black/10 transition-all duration-300 ease-in-out hover:scale-105",
                        !endDate && "text-muted-foreground dark:text-white/50"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-3 w-3 transition-transform duration-300 group-hover:rotate-12" />
                      {endDate ? (
                        format(endDate, "dd/MM/yy", { locale: ptBR })
                      ) : (
                        <span>Fim</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-0 bg-white dark:bg-slate-800/95 backdrop-blur-xl border-border dark:border-white/20 rounded-2xl shadow-xl shadow-black/10 dark:shadow-black/30"
                    align="start"
                  >
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-3">
                {filteredCalls.length > 0 ? (
                  filteredCalls.map((call) => (
                    <DriverCallHistoryCard
                      key={call.id}
                      call={call}
                      userId={userId}
                      allDrivers={allDrivers}
                      driver={driver}
                      onRequestApproval={handleRequestApproval}
                      onCancelSupport={handleCancelSupport}
                      onDeleteSupportRequest={onDeleteSupportRequest}
                    />
                  ))
                ) : (
                  <div className="text-center py-12 opacity-50 bg-white/80 dark:bg-white/10 backdrop-blur-xl rounded-2xl border border-dashed border-border dark:border-white/20 shadow-xl shadow-black/5 dark:shadow-black/20">
                    <HistoryIcon
                      size={48}
                      className="mx-auto text-muted-foreground dark:text-white/30 mb-2"
                    />
                    <p className="text-sm text-muted-foreground dark:text-white/60">
                      Sem histórico.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "tutorial" && (
            <div className="space-y-6 animate-in fade-in pb-10">
              <Tabs defaultValue="solicitante" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-white/80 dark:bg-white/10 backdrop-blur-xl p-1 rounded-xl h-10 mb-4 border border-border dark:border-white/20 shadow-xl shadow-black/5 dark:shadow-black/20">
                  <TabsTrigger
                    value="solicitante"
                    className="text-xs text-muted-foreground dark:text-white/70 data-[state=active]:text-foreground dark:data-[state=active]:text-white data-[state=active]:bg-white dark:data-[state=active]:bg-white/20 rounded-lg"
                  >
                    Solicitante
                  </TabsTrigger>
                  <TabsTrigger
                    value="prestador"
                    className="text-xs text-muted-foreground dark:text-white/70 data-[state=active]:text-foreground dark:data-[state=active]:text-white data-[state=active]:bg-white dark:data-[state=active]:bg-white/20 rounded-lg"
                  >
                    Prestador
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="solicitante" className="space-y-3">
                  {tutorialsSolicitante.map((t) => (
                    <div
                      key={t.id}
                      className="bg-white/80 dark:bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-border dark:border-white/20 shadow-xl shadow-black/5 dark:shadow-black/20"
                    >
                      <h4 className="font-bold text-sm mb-2 flex gap-2 items-center text-foreground dark:text-white">
                        <HelpCircle size={16} className="text-[#EE4D2D]" />{" "}
                        {t.question}
                      </h4>
                      <p className="text-xs text-muted-foreground dark:text-white/70">
                        {t.answer}
                      </p>
                    </div>
                  ))}
                </TabsContent>
                <TabsContent value="prestador" className="space-y-3">
                  {tutorialsPrestador.map((t) => (
                    <div
                      key={t.id}
                      className="bg-white/80 dark:bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-border dark:border-white/20 shadow-xl shadow-black/5 dark:shadow-black/20"
                    >
                      <h4 className="font-bold text-sm mb-2 flex gap-2 items-center text-foreground dark:text-white">
                        <HelpCircle size={16} className="text-[#EE4D2D]" />{" "}
                        {t.question}
                      </h4>
                      <p className="text-xs text-muted-foreground dark:text-white/70">
                        {t.answer}
                      </p>
                    </div>
                  ))}
                </TabsContent>
              </Tabs>
            </div>
          )}

          {activeTab === "profile" && (
            <div className="space-y-6 animate-in fade-in pb-10">
              <section className="bg-white/80 dark:bg-white/10 backdrop-blur-xl rounded-2xl border border-border dark:border-white/20 p-5 shadow-xl shadow-black/5 dark:shadow-black/20">
                <h4 className="text-xs font-bold text-muted-foreground dark:text-white/50 uppercase mb-4 tracking-wide">
                  Configurações
                </h4>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "p-2 rounded-xl backdrop-blur-sm shadow-lg shadow-black/10 border border-border dark:border-white/20",
                        isMuted
                          ? "bg-white/40 dark:bg-white/10 text-muted-foreground dark:text-white/40"
                          : "bg-green-500/20 dark:bg-green-500/20 text-green-700 dark:text-green-300"
                      )}
                    >
                      {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-foreground dark:text-white">
                        Sons de Alerta
                      </p>
                      <p className="text-xs text-muted-foreground dark:text-white/60">
                        {isMuted ? "Silenciado" : "Ativado"}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleMute}
                    className="text-muted-foreground dark:text-white/70 hover:text-foreground dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-xl"
                  >
                    Alterar
                  </Button>
                </div>
              </section>

              <section className="bg-white/80 dark:bg-white/10 backdrop-blur-xl rounded-2xl border border-border dark:border-white/20 p-5 shadow-xl shadow-black/5 dark:shadow-black/20 space-y-4">
                <h4 className="text-xs font-bold text-muted-foreground dark:text-white/50 uppercase mb-2 tracking-wide">
                  Meus Dados
                </h4>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground dark:text-white/70">
                    ID Motorista
                  </label>
                  <div className="p-3 bg-white/60 dark:bg-white/10 backdrop-blur-xl rounded-xl text-sm font-mono text-foreground dark:text-white/80 flex justify-between border border-border dark:border-white/20">
                    {shopeeId}{" "}
                    <Lock
                      size={14}
                      className="text-muted-foreground dark:text-white/50"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground dark:text-white/70">
                    Hub
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={hubSearch}
                      onChange={(e) => {
                        setHubSearch(e.target.value);
                        setIsHubDropdownOpen(true);
                      }}
                      onFocus={() => setIsHubDropdownOpen(true)}
                      className="w-full p-3 bg-white/80 dark:bg-white/10 backdrop-blur-xl border border-border dark:border-white/20 rounded-xl text-sm font-medium text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-white/50 focus:ring-2 focus:ring-[#FA4F26] focus:border-[#FA4F26]/50 outline-none shadow-lg shadow-black/5 dark:shadow-black/10"
                      placeholder="Pesquisar Hub..."
                    />
                    {isHubDropdownOpen && filteredHubs.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800/95 backdrop-blur-xl border border-border dark:border-white/20 rounded-xl shadow-xl shadow-black/10 dark:shadow-black/30 max-h-48 overflow-y-auto">
                        {filteredHubs.map((h) => (
                          <div
                            key={h}
                            className="p-2 hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer text-xs text-foreground dark:text-white/80 hover:text-foreground dark:hover:text-white transition-colors"
                            onClick={() => {
                              setHub(h);
                              setHubSearch(h);
                              setIsHubDropdownOpen(false);
                            }}
                          >
                            {h}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground dark:text-white/70">
                    Veículo
                  </label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    className="w-full p-3 bg-white/80 dark:bg-white/10 backdrop-blur-xl border border-border dark:border-white/20 rounded-xl text-sm font-medium capitalize text-foreground dark:text-white focus:ring-2 focus:ring-[#FA4F26] focus:border-[#FA4F26]/50 outline-none shadow-lg shadow-black/5 dark:shadow-black/10"
                  >
                    {vehicleTypesList.map((v) => (
                      <option
                        key={v}
                        value={v}
                        className="bg-white dark:bg-slate-800"
                      >
                        {v}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground dark:text-white/70">
                    Nome
                  </label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-3 bg-white/80 dark:bg-white/10 backdrop-blur-xl border border-border dark:border-white/20 rounded-xl text-sm text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-white/50 focus:ring-2 focus:ring-[#FA4F26] focus:border-[#FA4F26]/50 outline-none shadow-lg shadow-black/5 dark:shadow-black/10"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground dark:text-white/70">
                    Telefone
                  </label>
                  <input
                    value={formatPhoneNumber(phone)}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-3 bg-white/80 dark:bg-white/10 backdrop-blur-xl border border-border dark:border-white/20 rounded-xl text-sm text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-white/50 focus:ring-2 focus:ring-[#FA4F26] focus:border-[#FA4F26]/50 outline-none shadow-lg shadow-black/5 dark:shadow-black/10"
                  />
                </div>

                <Button
                  onClick={handleUpdateProfile}
                  className="w-full bg-[#FA4F26] hover:bg-[#EE4D2D] text-white h-12 mt-2 rounded-xl shadow-xl shadow-orange-500/30 font-bold"
                >
                  Salvar Alterações
                </Button>
              </section>

              <section className="bg-white/80 dark:bg-white/10 backdrop-blur-xl rounded-2xl border border-border dark:border-white/20 p-5 shadow-xl shadow-black/5 dark:shadow-black/20 space-y-4">
                <h4 className="text-xs font-bold text-muted-foreground dark:text-white/50 uppercase mb-2 tracking-wide">
                  Segurança
                </h4>

                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Nova Senha"
                      className="w-full p-3 bg-white/80 dark:bg-white/10 backdrop-blur-xl border border-border dark:border-white/20 rounded-xl text-sm text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-white/50 focus:ring-2 focus:ring-[#FA4F26] focus:border-[#FA4F26]/50 outline-none shadow-lg shadow-black/5 dark:shadow-black/10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-muted-foreground dark:text-white/50 hover:text-foreground dark:hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirmar Nova Senha"
                    className="w-full p-3 bg-white/80 dark:bg-white/10 backdrop-blur-xl border border-border dark:border-white/20 rounded-xl text-sm text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-white/50 focus:ring-2 focus:ring-[#FA4F26] focus:border-[#FA4F26]/50 outline-none shadow-lg shadow-black/5 dark:shadow-black/10"
                  />
                  <Button
                    onClick={handleChangePassword}
                    variant="outline"
                    className="w-full border-border dark:border-white/20 text-foreground dark:text-white/80 hover:bg-black/5 dark:hover:bg-white/10 hover:text-foreground dark:hover:text-white backdrop-blur-xl rounded-xl"
                  >
                    Atualizar Senha
                  </Button>
                </div>
              </section>
            </div>
          )}
        </div>
      </main>

      {/* SUPPORT MODAL */}
      {isSupportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
          <div
            className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
            onClick={() => setIsSupportModalOpen(false)}
          />
          <div className="relative w-full max-w-lg bg-slate-800/95 backdrop-blur-2xl h-[90vh] sm:h-auto rounded-t-3xl sm:rounded-3xl shadow-2xl shadow-black/40 border border-white/20 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10">
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5 backdrop-blur-xl">
              <h2 className="font-bold text-white">Nova Solicitação</h2>
              <button
                onClick={() => setIsSupportModalOpen(false)}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              >
                <X size={18} className="text-white" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <form
                id="supportForm"
                onSubmit={handleSupportSubmit}
                className="space-y-4"
              >
                <div>
                  <label className="text-xs font-bold text-white/70 uppercase mb-1 block">
                    Hub
                  </label>
                  <select
                    value={hub}
                    onChange={(e) => setHub(e.target.value)}
                    className="w-full p-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl text-sm text-white focus:ring-2 focus:ring-[#FA4F26] outline-none shadow-lg shadow-black/10"
                    required
                  >
                    <option value="" className="bg-slate-800">
                      Selecione...
                    </option>
                    {hubs.map((h) => (
                      <option key={h} value={h} className="bg-slate-800">
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-white/70 uppercase mb-1 block">
                    Motivo
                  </label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full p-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl text-sm text-white focus:ring-2 focus:ring-[#FA4F26] outline-none shadow-lg shadow-black/10"
                    required
                  >
                    <option value="" className="bg-slate-800">
                      Selecione...
                    </option>
                    {supportReasons.map((r) => (
                      <option key={r} value={r} className="bg-slate-800">
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-white/70 uppercase mb-1 block">
                    Detalhes
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={100}
                    className="w-full p-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl text-sm h-24 resize-none text-white placeholder:text-white/50 focus:ring-2 focus:ring-[#FA4F26] outline-none shadow-lg shadow-black/10"
                    placeholder="Descreva brevemente..."
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-white/70 uppercase mb-1 block">
                      Pacotes
                    </label>
                    <input
                      type="number"
                      min="20"
                      value={packageCount}
                      onChange={(e) => setPackageCount(e.target.value)}
                      className="w-full p-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl text-sm font-bold text-white placeholder:text-white/50 focus:ring-2 focus:ring-[#FA4F26] outline-none shadow-lg shadow-black/10"
                      placeholder="Mín 20"
                      required
                    />
                  </div>
                  <div className="flex items-center justify-center bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg shadow-black/10">
                    <label className="flex items-center gap-2 cursor-pointer p-3 w-full justify-center">
                      <span className="text-sm font-bold text-white/80">
                        Volumoso?
                      </span>
                      <input
                        type="checkbox"
                        checked={isBulky}
                        onChange={(e) => setIsBulky(e.target.checked)}
                        className="accent-[#FA4F26] w-5 h-5"
                      />
                    </label>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-white/70 uppercase mb-1 flex justify-between">
                    Regiões
                    <button
                      type="button"
                      onClick={() => handleAddField(setDeliveryRegions)}
                      className="text-[#FA4F26] hover:text-[#EE4D2D] transition-colors"
                    >
                      <PlusCircle size={14} />
                    </button>
                  </label>
                  {deliveryRegions.map((reg, idx) => (
                    <div key={idx} className="flex gap-2 mb-2">
                      <input
                        value={reg}
                        onChange={(e) =>
                          handleFieldChange(
                            idx,
                            e.target.value,
                            setDeliveryRegions
                          )
                        }
                        className="flex-1 p-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl text-sm text-white placeholder:text-white/50 focus:ring-2 focus:ring-[#FA4F26] outline-none shadow-lg shadow-black/10"
                        placeholder="Ex: Zona Norte"
                      />
                      {idx > 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            handleRemoveField(idx, setDeliveryRegions)
                          }
                          className="text-red-300 hover:text-red-200 transition-colors"
                        >
                          <MinusCircle size={18} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <div>
                  <label className="text-xs font-bold text-white/70 uppercase mb-1 flex justify-between">
                    Veículos Necessários
                    <button
                      type="button"
                      onClick={() => handleAddField(setNeededVehicles)}
                      className="text-[#FA4F26] hover:text-[#EE4D2D] transition-colors"
                    >
                      <PlusCircle size={14} />
                    </button>
                  </label>
                  {neededVehicles.map((veh, idx) => (
                    <div key={idx} className="flex gap-2 mb-2">
                      <select
                        value={veh}
                        onChange={(e) =>
                          handleFieldChange(
                            idx,
                            e.target.value,
                            setNeededVehicles
                          )
                        }
                        className="flex-1 p-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl text-sm capitalize text-white focus:ring-2 focus:ring-[#FA4F26] outline-none shadow-lg shadow-black/10"
                      >
                        <option value="" className="bg-slate-800">
                          Selecione...
                        </option>
                        {vehicleTypesList.map((v) => (
                          <option key={v} value={v} className="bg-slate-800">
                            {v}
                          </option>
                        ))}
                      </select>
                      {idx > 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            handleRemoveField(idx, setNeededVehicles)
                          }
                          className="text-red-300 hover:text-red-200 transition-colors"
                        >
                          <MinusCircle size={18} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div>
                  <label className="text-xs font-bold text-white/70 uppercase mb-1 block">
                    Localização
                  </label>
                  <div className="flex gap-2">
                    <input
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="flex-1 p-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl text-sm text-white placeholder:text-white/50 focus:ring-2 focus:ring-[#FA4F26] outline-none shadow-lg shadow-black/10"
                      placeholder="Link do Maps ou endereço"
                      required
                    />
                    <button
                      type="button"
                      onClick={handleGetLocation}
                      className="p-3 bg-blue-500/20 text-blue-300 rounded-xl border border-blue-400/30 hover:bg-blue-500/30 transition-colors shadow-lg shadow-black/10"
                    >
                      {isLocating ? (
                        <LoaderCircle className="animate-spin" />
                      ) : (
                        <NavigationIcon size={20} />
                      )}
                    </button>
                  </div>
                </div>
                {modalError && (
                  <p className="text-red-300 text-xs font-bold text-center bg-red-500/20 backdrop-blur-xl p-2 rounded-xl border border-red-400/30">
                    {modalError}
                  </p>
                )}
              </form>
            </div>
            <div className="p-4 border-t border-white/10 bg-white/5 backdrop-blur-xl">
              <Button
                form="supportForm"
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 bg-[#FA4F26] hover:bg-[#EE4D2D] text-white font-bold text-lg shadow-xl shadow-orange-500/30 rounded-xl"
              >
                {isSubmitting ? (
                  <LoaderCircle className="animate-spin" />
                ) : (
                  "ENVIAR SOLICITAÇÃO"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* REAUTH MODAL */}
      {isReauthModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-800/95 backdrop-blur-2xl rounded-3xl p-6 w-full max-w-sm shadow-2xl shadow-black/40 border border-white/20">
            <h3 className="font-bold text-lg mb-4 text-white">
              Confirme sua senha atual
            </h3>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full p-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl mb-2 text-white placeholder:text-white/50 focus:ring-2 focus:ring-[#FA4F26] outline-none shadow-lg shadow-black/10"
              placeholder="Senha atual"
            />
            {reauthError && (
              <p className="text-red-300 text-xs mb-2">{reauthError}</p>
            )}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsReauthModalOpen(false)}
                className="flex-1 border-white/20 text-white/80 hover:bg-white/10 hover:text-white backdrop-blur-xl rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleReauthenticateAndChange}
                disabled={isReauthenticating}
                className="flex-1 bg-[#FA4F26] hover:bg-[#EE4D2D] text-white rounded-xl shadow-lg shadow-orange-500/30"
              >
                {isReauthenticating ? (
                  <LoaderCircle className="animate-spin" />
                ) : (
                  "Confirmar"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS MODAL */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-800/95 backdrop-blur-2xl rounded-3xl p-8 text-center max-w-sm w-full shadow-2xl shadow-black/40 border border-white/20">
            <div className="w-20 h-20 bg-green-500/20 text-green-300 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-400/30 shadow-xl shadow-black/20">
              <CheckCircle size={40} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Recebido!</h2>
            <p className="text-white/70 mb-6">
              Sua solicitação está visível no painel. Aguarde um monitor
              aceitar.
            </p>
            <Button
              onClick={() => setShowSuccessModal(false)}
              className="w-full bg-[#FA4F26] hover:bg-[#EE4D2D] text-white h-12 font-bold rounded-xl shadow-xl shadow-orange-500/30"
            >
              Entendido
            </Button>
          </div>
        </div>
      )}

      <Chatbot />
    </div>
  );
};
