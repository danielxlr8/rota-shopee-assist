import React, { useState, useEffect, useMemo, useRef } from "react";
import type { Driver, SupportCall, UrgencyLevel } from "../types/logistics";
import {
  Clock,
  AlertTriangle,
  X,
  User,
  LogOut,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  Calendar as CalendarIcon,
  Lock,
  Navigation as NavigationIcon,
  History as HistoryIcon,
  Sun,
  Moon,
  MinusCircle,
  PlusCircle,
  ArrowRightLeft,
  ArrowRight,
  BookOpen,
  Zap,
  CheckCircle,
  XCircle,
  HelpCircle,
  Truck,
  Phone,
  Package,
  MapPin,
  ExternalLink,
  CalendarClock,
  Image as ImageIcon,
  Download,
  X as XIcon,
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
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Chatbot } from "./Chatbot";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Imports organizados
import { ProfileHeaderCard, StatusSection } from "./driver";
import { UrgencyBadge } from "./driver/components/UrgencyBadge";
import { HUBS } from "../constants/hubs";
import { VEHICLE_TYPES } from "../constants/vehicleTypes";
import { SUPPORT_REASONS } from "../constants/supportReasons";
import {
  TUTORIALS_SOLICITANTE,
  TUTORIALS_PRESTADOR,
} from "../constants/tutorials";
import { formatTimestamp, formatPhoneNumber } from "../utils/formatting";
import { showNotification } from "../utils/notifications";
import { toast as sonnerToast } from "sonner";
import { Loading, LoadingOverlay } from "./ui/loading";
import { RouteNotificationCard } from "./RouteNotificationCard";
import { WeatherForecast } from "./WeatherForecast";

interface DriverInterfaceProps {
  driver: Driver;
}

const sessionNotifiedCallIds = new Set<string>();

// DriverCallHistoryCard será movido para ./driver/components/DriverCallHistoryCard.tsx
// Mantendo temporariamente aqui até ser extraído completamente
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
  // assignedTo contém o uid do Firebase Auth, então buscamos por uid, googleUid ou shopeeId
  const requesterDriver = allDrivers.find((d: Driver) => 
    d.uid === call.solicitante.id || 
    d.googleUid === call.solicitante.id || 
    d.shopeeId === call.solicitante.id
  );
  const assignedDriver = call.assignedTo ? allDrivers.find((d: Driver) => 
    d.uid === call.assignedTo || 
    d.googleUid === call.assignedTo || 
    d.shopeeId === call.assignedTo
  ) : null;

  const handleWhatsAppClick = () => {
    if (!otherParty?.phone)
      return showNotification("error", "Erro", "Telefone indisponível.");
    const msg = encodeURIComponent(
      `Olá, sou ${driver.name} referente ao apoio logístico.`
    );
    window.open(`https://wa.me/55${otherParty.phone}?text=${msg}`, "_blank");
  };

  const isDark = document.documentElement.classList.contains("dark");

  return (
    <Card
      className={cn(
        "border border-border shadow-xl hover:shadow-2xl transition-all backdrop-blur-xl rounded-2xl overflow-hidden",
        isDark
          ? "bg-slate-800/90 border-slate-600/50 shadow-black/20 hover:shadow-black/30"
          : "bg-white/80 border-orange-200/50 shadow-black/5 hover:shadow-black/10"
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between p-4 border-b",
          isDark ? "border-slate-600/50" : "border-orange-200/50"
        )}
      >
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
            <h3
              className={cn(
                "text-sm font-bold",
                isDark ? "text-white" : "text-slate-800"
              )}
            >
              {isRequester
                ? "Minha Solicitação"
                : `Apoio para ${call.solicitante.name}`}
            </h3>
            <p
              className={cn(
                "text-xs flex items-center gap-1",
                isDark ? "text-white/60" : "text-slate-600"
              )}
            >
              <CalendarClock size={12} /> {formatTimestamp(call.timestamp)}
            </p>
          </div>
        </div>
        <div className="text-right">
          <UrgencyBadge urgency={call.urgency} />
          <p
            className={cn(
              "text-[10px] font-medium mt-1 uppercase tracking-wide",
              isDark ? "text-white/50" : "text-slate-600"
            )}
          >
            {call.status.replace("_", " ")}
          </p>
        </div>
      </div>

      <div className="p-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <span
            className={cn(
              "text-[10px] uppercase font-bold block mb-0.5",
              isDark ? "text-white/50" : "text-slate-600"
            )}
          >
            Rota ID
          </span>
          <span
            className={cn(
              "font-mono font-medium backdrop-blur-xl px-1.5 py-0.5 rounded-xl text-xs border",
              isDark
                ? "text-white bg-orange-500/20 border-orange-500/30"
                : "text-slate-800 bg-orange-50/80 border-orange-200/50"
            )}
          >
            {call.routeId || "N/A"}
          </span>
        </div>
        <div>
          <span
            className={cn(
              "text-[10px] uppercase font-bold block mb-0.5",
              isDark ? "text-white/50" : "text-slate-600"
            )}
          >
            Pacotes
          </span>
          <span
            className={cn(
              "font-medium",
              isDark ? "text-white" : "text-slate-800"
            )}
          >
            {call.packageCount || 0} un.
          </span>
        </div>
        <div className="col-span-2">
          <span
            className={cn(
              "text-[10px] uppercase font-bold block mb-0.5",
              isDark ? "text-white/50" : "text-slate-600"
            )}
          >
            Localização
          </span>
          <a
            href={call.location}
            target="_blank"
            rel="noreferrer"
            className={cn(
              "flex items-center gap-1 hover:underline text-xs font-medium truncate transition-colors",
              isDark
                ? "text-blue-300 hover:text-blue-200"
                : "text-blue-600 hover:text-blue-500"
            )}
          >
            <MapPin size={12} /> {call.location} <ExternalLink size={10} />
          </a>
        </div>
        {call.cargoPhotoUrl && (
          <div className="col-span-2 p-2 rounded-xl bg-orange-500/10 dark:bg-orange-500/10 border border-orange-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon
                  size={14}
                  className="text-orange-600 dark:text-orange-400"
                />
                <span className="text-xs font-semibold text-foreground dark:text-white">
                  Foto da Carga Disponível
                </span>
              </div>
              <a
                href={call.cargoPhotoUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 transition-all shadow-md"
              >
                <Download size={12} />
                <span>Baixar</span>
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Motoristas - Substituição */}
      <div className={cn(
        "p-4 border-t",
        isDark ? "border-slate-600/50" : "border-orange-200/50"
      )}>
        <div className={cn(
          "text-[10px] uppercase font-bold mb-2",
          isDark ? "text-white/50" : "text-slate-600"
        )}>
          Motoristas
        </div>
        <div className="flex items-center gap-2 overflow-hidden">
          {/* Solicitante */}
          <div className={cn(
            "flex-1 min-w-0 flex items-center gap-2 p-2 rounded-lg border",
            isDark
              ? "bg-orange-500/10 border-orange-500/30"
              : "bg-orange-50/80 border-orange-200/50"
          )}>
            <div className={cn(
              "w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center text-xs font-bold",
              isDark
                ? "bg-orange-500/20 text-orange-300"
                : "bg-orange-500/20 text-orange-700"
            )}>
              {requesterDriver?.initials || call.solicitante.initials || call.solicitante.name?.charAt(0) || "?"}
            </div>
            <div className="flex-1 min-w-0 overflow-hidden">
              <p className={cn(
                "text-xs font-semibold truncate",
                isDark ? "text-white" : "text-slate-800"
              )}>
                {requesterDriver?.name || call.solicitante.name}
              </p>
              <p className={cn(
                "text-[10px] truncate",
                isDark ? "text-white/60" : "text-slate-600"
              )}>
                Solicitante
              </p>
            </div>
          </div>
          {/* Seta de substituição */}
          {call.assignedTo && (
            <ArrowRight size={14} className={cn(
              "flex-shrink-0",
              isDark ? "text-white/40" : "text-slate-400"
            )} />
          )}
          {/* Prestador */}
          {call.assignedTo ? (
            assignedDriver ? (
              <div className={cn(
                "flex-1 min-w-0 flex items-center gap-2 p-2 rounded-lg border",
                isDark
                  ? "bg-blue-500/10 border-blue-500/30"
                  : "bg-blue-50/80 border-blue-200/50"
              )}>
                <div className={cn(
                  "w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center text-xs font-bold",
                  isDark
                    ? "bg-blue-500/20 text-blue-300"
                    : "bg-blue-500/20 text-blue-700"
                )}>
                  {assignedDriver.initials || assignedDriver.name?.charAt(0) || "?"}
                </div>
                <div className="flex-1 min-w-0 overflow-hidden">
                  <p className={cn(
                    "text-xs font-semibold truncate",
                    isDark ? "text-white" : "text-slate-800"
                  )}>
                    {assignedDriver.name}
                  </p>
                  <p className={cn(
                    "text-[10px] truncate",
                    isDark ? "text-white/60" : "text-slate-600"
                  )}>
                    Prestador
                  </p>
                </div>
              </div>
            ) : (
              <div className={cn(
                "flex-1 min-w-0 flex items-center gap-2 p-2 rounded-lg border",
                isDark
                  ? "bg-blue-500/10 border-blue-500/30"
                  : "bg-blue-50/80 border-blue-200/50"
              )}>
                <div className={cn(
                  "w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center text-xs font-bold",
                  isDark
                    ? "bg-blue-500/20 text-blue-300"
                    : "bg-blue-500/20 text-blue-700"
                )}>
                  ?
                </div>
                <div className="flex-1 min-w-0 overflow-hidden">
                  <p className={cn(
                    "text-xs font-semibold truncate",
                    isDark ? "text-white" : "text-slate-800"
                  )}>
                    Motorista não encontrado
                  </p>
                  <p className={cn(
                    "text-[10px] truncate",
                    isDark ? "text-white/60" : "text-slate-600"
                  )}>
                    Prestador (ID: {call.assignedTo.substring(0, 12)}...)
                  </p>
                </div>
              </div>
            )
          ) : (
            <div className={cn(
              "flex-1 min-w-0 flex items-center gap-2 p-2 rounded-lg border",
              isDark
                ? "bg-slate-700/50 border-slate-600/50"
                : "bg-gray-100 border-gray-200/50"
            )}>
              <div className="flex-1 text-center">
                <p className={cn(
                  "text-xs truncate",
                  isDark ? "text-white/60" : "text-slate-600"
                )}>
                  Aguardando prestador
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {["EM ANDAMENTO", "ABERTO", "AGUARDANDO_APROVACAO"].includes(
        call.status
      ) && (
        <div
          className={cn(
            "p-3 backdrop-blur-xl border-t flex justify-end gap-2 flex-wrap",
            isDark
              ? "bg-slate-800/90 border-slate-600/50"
              : "bg-orange-50/60 border-orange-200/50"
          )}
        >
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
                className="h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg shadow-primary/30"
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
  const [cargoPhoto, setCargoPhoto] = useState<File | null>(null);
  const [cargoPhotoPreview, setCargoPhotoPreview] = useState<string | null>(
    null
  );
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

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
  const [currentDateTime, setCurrentDateTime] = useState<Date>(new Date());

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
  const [isMuted, setIsMuted] = useState(() => {
    return localStorage.getItem("notificationsMuted") === "true";
  });
  const [routeNotifications, setRouteNotifications] = useState<SupportCall[]>(
    []
  );
  const notifiedRouteIds = useRef<Set<string>>(new Set());
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

  // Validação do perfil completo - considera tanto os dados do driver quanto os estados locais
  const isProfileComplete = useMemo(() => {
    if (!driver) return false;
    
    // Usar estados locais se estiverem preenchidos, senão usar dados do driver
    // Priorizar estados locais para refletir mudanças não salvas
    const currentHub = (hub && hub.trim() !== "") ? hub : (driver.hub || "");
    const currentVehicleType = (vehicleType && vehicleType.trim() !== "") ? vehicleType : (driver.vehicleType || "");
    const currentPhone = (phone && phone.trim() !== "") ? phone : (driver.phone || "");
    const currentName = (name && name.trim() !== "") ? name : (driver.name || "");
    
    // Validar telefone - remover formatação (caso driver.phone esteja formatado) e verificar se tem 10 ou 11 dígitos
    const cleanPhone = currentPhone ? currentPhone.replace(/\D/g, "") : "";
    
    // Validar se todos os campos obrigatórios estão preenchidos
    const hasValidHub = currentHub && currentHub.trim() !== "" && HUBS.includes(currentHub as any);
    const hasValidVehicleType = currentVehicleType && currentVehicleType.trim() !== "";
    const hasValidPhone = cleanPhone && cleanPhone.length >= 10 && cleanPhone.length <= 11;
    const hasValidName = currentName && currentName.trim() !== "";
    const hasValidShopeeId = shopeeId && !shopeeId.includes("Erro");
    
    return hasValidHub && hasValidVehicleType && hasValidPhone && hasValidName && hasValidShopeeId;
  }, [driver, shopeeId, hub, vehicleType, phone, name]);

  const activeCallForDriver = useMemo(() => {
    return (
      allMyCalls.find(
        (call) => call.solicitante.id === userId && call.status === "ABERTO"
      ) || null
    );
  }, [allMyCalls, userId]);

  const filteredHubs = useMemo(() => {
    if (!hubSearch) return HUBS;
    return HUBS.filter((h) =>
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

  // Atualizar data/hora do Brasil
  useEffect(() => {
    const updateDateTime = () => {
      const brazilTime = new Date(
        new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })
      );
      setCurrentDateTime(brazilTime);
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  const toggleTheme = () => {
    const root = window.document.documentElement;
    const newTheme = theme === "light" ? "dark" : "light";

    // Aplicar tema imediatamente para animação
    root.classList.remove("light", "dark");
    root.classList.add(newTheme);
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
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
      // Armazenar apenas os dígitos do telefone no estado
      const driverPhone = driver.phone || "";
      const phoneDigits = driverPhone.replace(/\D/g, "");
      setPhone(phoneDigits);
      const driverHub = driver.hub || "";
      setHub(driverHub);
      setHubSearch(driverHub);
      setVehicleType(driver.vehicleType || "");
    }
  }, [driver]);

  useEffect(() => {
    const fetchShopeeId = async () => {
      // Se o driver já tem shopeeId, usar diretamente
      if (driver?.shopeeId) {
        setShopeeId(driver.shopeeId);
        return;
      }
      
      // Caso contrário, buscar pelo uid
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
  }, [driver?.uid, driver?.shopeeId]);

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
      <div className="flex w-full max-w-sm items-center gap-4 rounded-xl bg-slate-800/95 backdrop-blur-xl p-4 shadow-xl border border-orange-500/30 ring-1 ring-black/5">
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
        sessionNotifiedCallIds.has(newCall.id) ||
        notifiedRouteIds.current.has(newCall.id)
      )
        return;

      // Adicionar à lista de notificações
      setRouteNotifications((prev) => [...prev, newCall]);
      notifiedRouteIds.current.add(newCall.id);
      sessionNotifiedCallIds.add(newCall.id);

      // Tocar som de alerta se não estiver mutado
      if (!isMuted) {
        const audio = new Audio("/shopee-ringtone.mp3");
        audio.volume = 0.5;
        audio.play().catch(() => {});
      }
    };
  }, [driver?.status, isMuted]);

  const handleCloseNotification = (callId: string) => {
    setRouteNotifications((prev) => prev.filter((call) => call.id !== callId));
  };

  useEffect(() => {
    if (!userId) return;
    const allDriversQuery = query(collection(db, "motoristas_pre_aprovados"));
    const unsubscribeAllDrivers = onSnapshot(allDriversQuery, (snapshot) => {
      const driversData = snapshot.docs.map(
        (doc) => ({ 
          shopeeId: doc.id, 
          ...doc.data(),
          uid: doc.data().uid || doc.data().googleUid || doc.id
        } as Driver)
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

    // Filtrar apenas chamados abertos do mesmo hub do motorista
    const driverHub = driver?.hub;
    const openCallsQuery = driverHub
      ? query(
          collection(db, "supportCalls"),
          where("status", "==", "ABERTO"),
          where("hub", "==", driverHub)
        )
      : query(
          collection(db, "supportCalls"),
          where("status", "==", "ABERTO")
        );
    const unsubscribeOpenCalls = onSnapshot(openCallsQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const callData = {
          id: change.doc.id,
          ...change.doc.data(),
        } as SupportCall;
        // Filtrar também por hub se houver
        const hubMatch = !driverHub || callData.hub === driverHub;
        if (callData.solicitante.id !== userId && hubMatch) {
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
        openCallsData.filter((call) => {
          const hubMatch = !driverHub || call.hub === driverHub;
          return call.solicitante.id !== userId && hubMatch;
        })
      );
    });

    return () => {
      unsubscribeMyCalls();
      unsubscribeOpenCalls();
      unsubscribeAllDrivers();
    };
  }, [userId, startDate, endDate, driver?.hub]);

  const updateDriver = async (
    driverId: string,
    updates: Partial<Omit<Driver, "uid">>
  ) => {
    if (!driverId) {
      throw new Error("ID do motorista não fornecido");
    }
    
    // Verificar se o ID é válido (não pode ser string de status)
    if (driverId === "Carregando..." || driverId === "Não encontrado" || driverId.includes("Erro")) {
      throw new Error(`ID do motorista inválido: ${driverId}`);
    }
    
    try {
      console.log("Tentando atualizar driver com ID:", driverId);
      console.log("Updates:", updates);
      
      const driverDocRef = doc(db, "motoristas_pre_aprovados", driverId);
      await updateDoc(driverDocRef, updates);
      
      console.log("Driver atualizado com sucesso no Firebase!");
      
      // Retornar sucesso explícito
      return true;
    } catch (error: any) {
      console.error("Erro ao atualizar motorista:", error);
      console.error("Detalhes do erro:", {
        code: error.code,
        message: error.message,
        driverId: driverId
      });
      
      // Melhorar mensagem de erro
      if (error.code === "not-found") {
        throw new Error(`Motorista não encontrado no banco de dados. ID: ${driverId}`);
      } else if (error.code === "permission-denied") {
        throw new Error("Você não tem permissão para atualizar este perfil.");
      } else {
        throw new Error(error.message || "Erro ao salvar no banco de dados.");
      }
    }
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

  const handleAvailabilityChange = async (isAvailable: boolean) => {
    if (!isProfileComplete || !shopeeId)
      return showNotification(
        "error",
        "Perfil Incompleto",
        "Verifique seus dados."
      );
    try {
      await updateDriver(shopeeId, {
        status: isAvailable ? "DISPONIVEL" : "INDISPONIVEL",
      });
      showNotification(
        "success",
        "Status Atualizado",
        `Você está agora ${isAvailable ? "Disponível" : "Indisponível"}.`
      );
    } catch (error: any) {
      showNotification("error", "Erro", "Não foi possível atualizar o status.");
    }
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
      showNotification("success", "Chamado Aceito", "Você está agora em rota.");
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
    try {
      await updateCall(id, {
        assignedTo: deleteField(),
        status: "ABERTO",
      } as any);
      await updateDriver(shopeeId, { status: "DISPONIVEL" });
      showNotification(
        "success",
        "Apoio Cancelado",
        "Você está agora disponível novamente."
      );
    } catch (error: any) {
      showNotification("error", "Erro", "Não foi possível cancelar o apoio.");
    }
  };

  const onDeleteSupportRequest = async (id: string) => {
    await updateCall(id, {
      status: "EXCLUIDO",
      deletedAt: serverTimestamp(),
    } as any);
    showNotification("success", "Excluído", "Solicitação removida.");
  };

  const handleUpdateProfile = async () => {
    // Verificar se shopeeId é válido (não pode ser null, "Carregando...", "Não encontrado" ou conter "Erro")
    if (!shopeeId || 
        shopeeId === "Carregando..." || 
        shopeeId === "Não encontrado" || 
        shopeeId.includes("Erro")) {
      showNotification("error", "Erro", "ID do motorista não encontrado. Aguarde o carregamento ou recarregue a página.");
      return;
    }

    // Validar telefone (phone já contém apenas dígitos)
    if (!phone || phone.length < 10 || phone.length > 11) {
      showNotification("error", "Telefone", "Use DDD + 8 ou 9 dígitos (ex: (41) 99999-9999).");
      return;
    }

    // Validar hub
    if (!hub || !hub.trim() || !HUBS.includes(hub as any)) {
      showNotification("error", "Hub", "Selecione um Hub válido.");
      return;
    }

    // Validar nome
    if (!name || !name.trim()) {
      showNotification("error", "Nome", "O nome é obrigatório.");
      return;
    }

    // Validar veículo
    if (!vehicleType || !vehicleType.trim()) {
      showNotification("error", "Veículo", "Selecione um tipo de veículo.");
      return;
    }

    try {
      console.log("Salvando perfil com shopeeId:", shopeeId);
      console.log("Dados a salvar:", {
        name: name.trim(),
        phone: phone,
        hub: hub,
        vehicleType: vehicleType,
      });

      // Atualizar usando a função updateDriver
      await updateDriver(shopeeId, {
        name: name.trim(),
        phone: phone,
        hub: hub,
        vehicleType: vehicleType,
      });

      console.log("Perfil salvo com sucesso!");

      // Aguardar um pouco para garantir que o Firebase processou a atualização
      await new Promise(resolve => setTimeout(resolve, 200));

      // Mostrar confirmação de sucesso APENAS se chegou até aqui sem erro
      showNotification(
        "success",
        "Perfil Atualizado",
        "Suas alterações foram salvas com sucesso!"
      );
      setIsProfileWarningVisible(false);

      // O onSnapshot no App.tsx vai atualizar automaticamente os dados
    } catch (error: any) {
      console.error("Erro ao atualizar perfil:", error);
      // Mostrar erro apenas se realmente houver erro
      showNotification(
        "error",
        "Erro ao Salvar",
        error.message ||
          "Não foi possível salvar as alterações. Tente novamente."
      );
    }
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
          `http://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`
        );
        setIsLocating(false);
      },
      () => {
        setModalError("Erro ao obter localização.");
        setIsLocating(false);
      }
    );
  };

  const handleCargoPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setModalError("A imagem deve ter no máximo 5MB.");
        return;
      }
      setCargoPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCargoPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
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
    // Usar o hub do perfil do driver automaticamente
    const driverHub = driver?.hub;
    if (!driverHub) {
      setModalError("Complete seu perfil com o Hub antes de solicitar apoio.");
      setIsSubmitting(false);
      return;
    }

    if (
      !location ||
      !reason ||
      !description ||
      regions.length === 0 ||
      vehicles.length === 0
    ) {
      setModalError("Preencha todos os campos.");
      setIsSubmitting(false);
      return;
    }

    let cargoPhotoUrl = null;
    if (cargoPhoto) {
      try {
        setIsUploadingPhoto(true);
        const photoRef = ref(
          storage,
          `cargo-photos/${user.uid}/${Date.now()}_${cargoPhoto.name}`
        );
        await uploadBytesResumable(photoRef, cargoPhoto);
        cargoPhotoUrl = await getDownloadURL(photoRef);
      } catch (err: any) {
        setModalError("Erro ao fazer upload da foto: " + err.message);
        setIsSubmitting(false);
        setIsUploadingPhoto(false);
        return;
      } finally {
        setIsUploadingPhoto(false);
      }
    }

    const informalDesc = `MOTIVO: ${reason}. DETALHES: ${description}. Hub: ${driverHub}. Loc: ${location}. Qtd: ${pkg}. Regiões: ${regions.join(
      ", "
    )}. Veículos: ${vehicles.join(", ")}. ${isBulky ? "VOLUMOSO" : ""}`;

    try {
      const professionalDesc = informalDesc;

      let urgency: UrgencyLevel = "BAIXA";
      if (pkg >= 100) urgency = "URGENTE";
      else if (pkg >= 90) urgency = "ALTA";
      else if (pkg >= 60) urgency = "MEDIA";

      // Garantir que temos um ID válido para o solicitante
      const solicitanteId = user.uid || userId || driver.uid;
      if (!solicitanteId) {
        setModalError("Erro: ID do usuário não encontrado.");
        setIsSubmitting(false);
        return;
      }

      const newCall = {
        routeId: `SPX-${Date.now().toString().slice(-6)}`,
        description: professionalDesc,
        urgency,
        location,
        status: "ABERTO",
        vehicleType: vehicles.join(", "),
        isBulky,
        hub: driverHub,
        packageCount: pkg,
        deliveryRegions: regions,
        cargoPhotoUrl,
        solicitante: {
          id: solicitanteId,
          name: driver.name || "Motorista",
          avatar: driver.avatar || null,
          initials:
            driver.initials || driver.name?.charAt(0).toUpperCase() || "M",
          phone: driver.phone || "",
          shopeeId: driver.shopeeId,
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
      setCargoPhoto(null);
      setCargoPhotoPreview(null);
    } catch (err: any) {
      setModalError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- RENDER ---
  return (
    <>
      <LoadingOverlay
        isLoading={isSubmitting || isReauthenticating}
        text="Processando..."
      />

      {/* Cards de Notificação de Rotas */}
      {routeNotifications.map((call, index) => (
        <RouteNotificationCard
          key={call.id}
          call={call}
          onClose={() => handleCloseNotification(call.id)}
          theme={theme}
          index={index}
        />
      ))}

      {/* Cards de Notificação de Rotas */}
      {routeNotifications.map((call, index) => (
        <RouteNotificationCard
          key={call.id}
          call={call}
          onClose={() => handleCloseNotification(call.id)}
          theme={theme}
          index={index}
        />
      ))}

      <div
        className={cn(
          "min-h-dvh font-sans pb-24 transition-colors duration-300",
          theme === "dark" ? "" : ""
        )}
        style={
          theme === "dark"
            ? {
                background:
                  "linear-gradient(135deg, #1a1a1a 0%, #2d1b1b 25%, #1a1a1a 50%, #2d1b1b 75%, #1a1a1a 100%)",
                backgroundSize: "400% 400%",
                animation: "gradientShift 15s ease infinite",
                minHeight: "100vh",
              }
            : {
                background:
                  "linear-gradient(to bottom, #fff5f0 0%, #ffe8d6 5%, #ffd4b8 10%, #ffb88c 15%, #ffa366 20%, #ff8c42 25%, #ff7733 30%, #ff6622 35%, #ff5511 40%, #ff4400 45%, #ee3d00 50%, #dd3300 55%, #cc2a00 60%, #bb2200 65%, #aa1a00 70%, #991100 75%, #880900 80%, #770600 85%, #660400 90%, #550300 95%, #440200 100%)",
                backgroundAttachment: "fixed",
                minHeight: "100vh",
              }
        }
      >
        {/* HEADER MODERNO */}
        <header
          className={cn(
            "sticky top-0 z-30 px-3 sm:px-4 md:px-6 py-3 sm:py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 backdrop-blur-xl border-b border-border transition-all duration-300",
            theme === "light"
              ? "bg-gradient-to-r from-orange-50/90 via-orange-100/80 to-orange-50/90"
              : "bg-background/95"
          )}
        >
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-primary-foreground bg-primary shadow-lg flex-shrink-0">
              <ArrowRightLeft size={18} className="sm:w-5 sm:h-5" strokeWidth={2.5} />
            </div>
            <h1
              className={cn(
                "font-bold text-sm sm:text-base tracking-tight truncate",
                theme === "light" ? "text-slate-800" : "text-foreground"
              )}
            >
              Sistema Logístico
            </h1>
          </div>
          <div className="flex gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={toggleTheme}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
              aria-label="Alternar tema"
            >
              {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <button
              onClick={() => auth.signOut()}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
              aria-label="Sair"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>

        {/* Warning Banner */}
        {!isProfileComplete && isProfileWarningVisible && (
          <div
            className={cn(
              "mx-4 mt-4 p-4 rounded-2xl flex justify-between items-center border shadow-lg",
              theme === "dark"
                ? "bg-orange-500/10 border-orange-500/30"
                : "bg-orange-50/80 border-orange-200/50"
            )}
          >
            <div className="flex items-center gap-3">
              <AlertTriangle
                size={20}
                className={cn(
                  theme === "dark" ? "text-orange-400" : "text-orange-600"
                )}
              />
              <div>
                <p
                  className={cn(
                    "font-bold text-sm",
                    theme === "dark" ? "text-orange-400" : "text-orange-600"
                  )}
                >
                  Atenção
                </p>
                <p
                  className={cn(
                    "text-xs",
                    theme === "dark" ? "text-slate-300" : "text-slate-600"
                  )}
                >
                  Complete seu perfil para operar.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsProfileWarningVisible(false)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <main
          className={cn(
            "p-4 sm:p-6 max-w-lg lg:max-w-4xl xl:max-w-6xl mx-auto space-y-6",
            theme === "dark" ? "bg-transparent" : ""
          )}
        >
          {isUploading && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
              <Loading size="lg" variant="spinner" text="Enviando imagem..." />
            </div>
          )}
          <ProfileHeaderCard
            driver={driver}
            isUploading={isUploading}
            onEditClick={() => fileInputRef.current?.click()}
            activeCall={activeCallForDriver}
            theme={theme}
            currentDateTime={currentDateTime}
          />
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleAvatarUpload}
            className="hidden"
            accept="image/*"
          />

          {/* Previsão do Tempo */}
          {driver?.hub && (
            <div className="px-4 sm:px-6">
              <WeatherForecast hub={driver.hub} />
            </div>
          )}

          {/* TABS NAVIGATION MODERNAS */}
          <div
            className={cn(
              "p-1.5 rounded-2xl flex justify-between overflow-x-auto scrollbar-hide border shadow-lg transition-all duration-300 backdrop-blur-xl",
              theme === "light"
                ? "bg-white/80 border-orange-200/50"
                : "bg-slate-800/90 border-orange-500/30"
            )}
          >
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabId)}
                className={cn(
                  "flex-1 flex flex-col items-center py-3 px-2 rounded-xl text-[10px] sm:text-xs uppercase font-bold tracking-wide min-w-[60px] sm:min-w-[80px] transition-all duration-300 ease-in-out",
                  activeTab === tab.id
                    ? "text-white bg-primary shadow-lg scale-105"
                    : theme === "light"
                    ? "text-slate-700 hover:text-slate-900 hover:bg-white/80"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <div className="transition-transform duration-300">
                  {React.cloneElement(tab.icon, {
                    size: 20,
                    className: cn(
                      "mb-1 transition-all duration-300",
                      activeTab === tab.id && "scale-110"
                    ),
                  })}
                </div>
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
              </button>
            ))}
          </div>

          {/* TAB CONTENT AREAS */}
          <div className="min-h-[400px]">
            {activeTab === "availability" && (
              <div className="tab-content-enter">
                {!isProfileComplete ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <div
                      className={cn(
                        "w-16 h-16 backdrop-blur-xl rounded-full flex items-center justify-center text-orange-500 mb-2 border shadow-xl",
                        theme === "dark"
                          ? "bg-orange-500/20 border-orange-500/30 shadow-black/20"
                          : "bg-orange-50 border-orange-200/50 shadow-black/5"
                      )}
                    >
                      <AlertTriangle size={32} />
                    </div>
                    <div className="text-center space-y-2 max-w-xs">
                      <h3
                        className={cn(
                          "text-xl font-bold",
                          theme === "dark" ? "text-white" : "text-slate-800"
                        )}
                      >
                        Perfil Incompleto
                      </h3>
                      <p
                        className={cn(
                          "text-sm",
                          theme === "dark" ? "text-white/70" : "text-slate-600"
                        )}
                      >
                        Complete seu perfil na aba "Perfil" para aceitar chamados.
                      </p>
                    </div>
                    <Button
                      onClick={() => setActiveTab("profile")}
                      className="mt-4 bg-primary hover:bg-primary/90 font-bold shadow-xl shadow-primary/30 rounded-xl text-primary-foreground"
                    >
                      IR PARA PERFIL
                    </Button>
                  </div>
                ) : (
                  <StatusSection
                    driver={driver}
                    onAvailabilityChange={handleAvailabilityChange}
                    filteredOpenCalls={filteredOpenCalls}
                    routeIdSearch={routeIdSearch}
                    onRouteIdSearchChange={setRouteIdSearch}
                    acceptingCallId={acceptingCallId}
                    onAcceptCall={handleAcceptCall}
                    theme={theme}
                  />
                )}
              </div>
            )}

            {activeTab === "support" && (
              <div className="tab-content-enter flex flex-col items-center justify-center py-8 space-y-6">
                {!isProfileComplete ? (
                  <>
                    <div
                      className={cn(
                        "w-20 h-20 backdrop-blur-xl rounded-full flex items-center justify-center text-orange-500 mb-2 border shadow-xl",
                        theme === "dark"
                          ? "bg-orange-500/20 border-orange-500/30 shadow-black/20"
                          : "bg-orange-50 border-orange-200/50 shadow-black/5"
                      )}
                    >
                      <AlertTriangle size={40} />
                    </div>
                    <div className="text-center space-y-2 max-w-xs">
                      <h2
                        className={cn(
                          "text-2xl font-bold",
                          theme === "dark" ? "text-white" : "text-slate-800"
                        )}
                      >
                        Perfil Incompleto
                      </h2>
                      <p
                        className={cn(
                          "text-sm",
                          theme === "dark" ? "text-white/70" : "text-slate-600"
                        )}
                      >
                        Complete seu perfil na aba "Perfil" antes de solicitar apoio.
                      </p>
                    </div>
                    <Button
                      onClick={() => setActiveTab("profile")}
                      className="w-full max-w-sm h-14 text-lg bg-primary hover:bg-primary/90 font-bold shadow-xl shadow-primary/30 rounded-xl text-primary-foreground"
                    >
                      IR PARA PERFIL
                    </Button>
                  </>
                ) : (
                  <>
                    <div
                      className={cn(
                        "w-20 h-20 backdrop-blur-xl rounded-full flex items-center justify-center text-primary mb-2 border shadow-xl",
                        theme === "dark"
                          ? "bg-primary/20 border-orange-500/30 shadow-black/20"
                          : "bg-primary/20 border-orange-200/50 shadow-black/5"
                      )}
                    >
                      <AlertTriangle size={40} />
                    </div>
                    <div className="text-center space-y-2 max-w-xs">
                      <h2
                        className={cn(
                          "text-2xl font-bold",
                          theme === "dark" ? "text-white" : "text-slate-800"
                        )}
                      >
                        Precisa de Apoio?
                      </h2>
                      <p
                        className={cn(
                          "text-sm",
                          theme === "dark" ? "text-white/70" : "text-slate-600"
                        )}
                      >
                        Solicite ajuda para transferir pacotes em caso de
                        imprevistos. Mínimo de 20 pacotes.
                      </p>
                    </div>
                    <Button
                      onClick={() => {
                        setModalError("");
                        setIsSupportModalOpen(true);
                      }}
                      className="w-full max-w-sm h-14 text-lg bg-primary hover:bg-primary/90 font-bold shadow-xl shadow-primary/30 rounded-xl text-primary-foreground"
                    >
                      SOLICITAR SOCORRO
                    </Button>
                  </>
                )}
              </div>
            )}

            {activeTab === "activeCalls" && (
              <div className="tab-content-enter space-y-4">
                {!isProfileComplete && (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4 mb-6">
                    <div
                      className={cn(
                        "w-16 h-16 backdrop-blur-xl rounded-full flex items-center justify-center text-orange-500 mb-2 border shadow-xl",
                        theme === "dark"
                          ? "bg-orange-500/20 border-orange-500/30 shadow-black/20"
                          : "bg-orange-50 border-orange-200/50 shadow-black/5"
                      )}
                    >
                      <AlertTriangle size={32} />
                    </div>
                    <div className="text-center space-y-2 max-w-xs">
                      <h3
                        className={cn(
                          "text-xl font-bold",
                          theme === "dark" ? "text-white" : "text-slate-800"
                        )}
                      >
                        Perfil Incompleto
                      </h3>
                      <p
                        className={cn(
                          "text-sm",
                          theme === "dark" ? "text-white/70" : "text-slate-600"
                        )}
                      >
                        Complete seu perfil na aba "Perfil" para visualizar chamados.
                      </p>
                    </div>
                    <Button
                      onClick={() => setActiveTab("profile")}
                      className="mt-4 bg-primary hover:bg-primary/90 font-bold shadow-xl shadow-primary/30 rounded-xl text-primary-foreground"
                    >
                      IR PARA PERFIL
                    </Button>
                  </div>
                )}
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {["all", "inProgress", "requester", "provider"].map((f) => (
                    <button
                      key={f}
                      onClick={() => setHistoryFilter(f as any)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-xs font-bold border whitespace-nowrap backdrop-blur-xl shadow-lg transition-all duration-300 ease-in-out",
                        historyFilter === f
                          ? theme === "dark"
                            ? "bg-slate-700/90 text-white border-orange-500/30 shadow-xl transform scale-105"
                            : "bg-white/80 text-slate-800 border-orange-200/50 shadow-xl transform scale-105"
                          : theme === "dark"
                          ? "bg-slate-800/90 text-slate-300 border-orange-500/30 hover:bg-slate-700/90 hover:text-white hover:scale-102"
                          : "bg-white/60 text-slate-600 border-orange-200/50 hover:bg-white/80 hover:text-slate-800 hover:scale-102"
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
                          "h-8 text-xs font-normal justify-start text-left w-[130px] backdrop-blur-xl rounded-xl shadow-lg transition-all duration-300 ease-in-out hover:scale-105",
                          theme === "dark"
                            ? "bg-orange-500/20 border-orange-500/30 text-white hover:bg-orange-500/30 shadow-black/10"
                            : "bg-white/80 border-orange-200/50 text-slate-800 hover:bg-white shadow-black/5",
                          !startDate &&
                            (theme === "dark"
                              ? "text-white/50"
                              : "text-slate-500")
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
                      className={cn(
                        "w-auto p-0 backdrop-blur-xl rounded-2xl shadow-xl",
                        theme === "dark"
                          ? "bg-slate-800/95 border-orange-500/30 shadow-black/30"
                          : "bg-white border-orange-200/50 shadow-black/10"
                      )}
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
                          "h-8 text-xs font-normal justify-start text-left w-[130px] backdrop-blur-xl rounded-xl shadow-lg transition-all duration-300 ease-in-out hover:scale-105",
                          theme === "dark"
                            ? "bg-orange-500/20 border-orange-500/30 text-white hover:bg-orange-500/30 shadow-black/10"
                            : "bg-white/80 border-orange-200/50 text-slate-800 hover:bg-white shadow-black/5",
                          !endDate &&
                            (theme === "dark"
                              ? "text-white/50"
                              : "text-slate-500")
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
                      className={cn(
                        "w-auto p-0 backdrop-blur-xl rounded-2xl shadow-xl",
                        theme === "dark"
                          ? "bg-slate-800/95 border-orange-500/30 shadow-black/30"
                          : "bg-white border-orange-200/50 shadow-black/10"
                      )}
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
                    <div
                      className={cn(
                        "text-center py-12 opacity-50 backdrop-blur-xl rounded-2xl border border-dashed shadow-xl",
                        theme === "dark"
                          ? "bg-slate-800/90 border-orange-500/30 shadow-black/20"
                          : "bg-white/80 border-orange-200/50 shadow-black/5"
                      )}
                    >
                      <HistoryIcon
                        size={48}
                        className={cn(
                          "mx-auto mb-2",
                          theme === "dark" ? "text-white/30" : "text-slate-400"
                        )}
                      />
                      <p
                        className={cn(
                          "text-sm",
                          theme === "dark" ? "text-white/60" : "text-slate-600"
                        )}
                      >
                        Sem histórico.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "tutorial" && (
              <div className="tab-content-enter space-y-6 pb-10">
                <Tabs defaultValue="solicitante" className="w-full">
                  <TabsList
                    className={cn(
                      "grid w-full grid-cols-2 backdrop-blur-xl p-1 rounded-xl h-10 mb-4 border shadow-xl",
                      theme === "dark"
                        ? "bg-slate-800/90 border-orange-500/30 shadow-black/20"
                        : "bg-white/80 border-orange-200/50 shadow-black/5"
                    )}
                  >
                    <TabsTrigger
                      value="solicitante"
                      className={cn(
                        "text-xs rounded-lg",
                        theme === "dark"
                          ? "text-slate-300 data-[state=active]:text-white data-[state=active]:bg-slate-700/90"
                          : "text-slate-600 data-[state=active]:text-slate-800 data-[state=active]:bg-white"
                      )}
                    >
                      Solicitante
                    </TabsTrigger>
                    <TabsTrigger
                      value="prestador"
                      className={cn(
                        "text-xs rounded-lg",
                        theme === "dark"
                          ? "text-slate-300 data-[state=active]:text-white data-[state=active]:bg-slate-700/90"
                          : "text-slate-600 data-[state=active]:text-slate-800 data-[state=active]:bg-white"
                      )}
                    >
                      Prestador
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="solicitante" className="space-y-3">
                    {TUTORIALS_SOLICITANTE.map((t) => (
                      <div
                        key={t.id}
                        className={cn(
                          "backdrop-blur-xl rounded-2xl p-4 border shadow-xl",
                          theme === "dark"
                            ? "bg-slate-800/90 border-orange-500/30 shadow-black/20"
                            : "bg-white/80 border-orange-200/50 shadow-black/5"
                        )}
                      >
                        <h4
                          className={cn(
                            "font-bold text-sm mb-2 flex gap-2 items-center",
                            theme === "dark" ? "text-white" : "text-slate-800"
                          )}
                        >
                          <HelpCircle size={16} className="text-primary" />{" "}
                          {t.question}
                        </h4>
                        <p
                          className={cn(
                            "text-xs",
                            theme === "dark"
                              ? "text-white/70"
                              : "text-slate-600"
                          )}
                        >
                          {t.answer}
                        </p>
                      </div>
                    ))}
                  </TabsContent>
                  <TabsContent value="prestador" className="space-y-3">
                    {TUTORIALS_PRESTADOR.map((t) => (
                      <div
                        key={t.id}
                        className={cn(
                          "backdrop-blur-xl rounded-2xl p-4 border shadow-xl",
                          theme === "dark"
                            ? "bg-slate-800/90 border-orange-500/30 shadow-black/20"
                            : "bg-white/80 border-orange-200/50 shadow-black/5"
                        )}
                      >
                        <h4
                          className={cn(
                            "font-bold text-sm mb-2 flex gap-2 items-center",
                            theme === "dark" ? "text-white" : "text-slate-800"
                          )}
                        >
                          <HelpCircle size={16} className="text-primary" />{" "}
                          {t.question}
                        </h4>
                        <p
                          className={cn(
                            "text-xs",
                            theme === "dark"
                              ? "text-white/70"
                              : "text-slate-600"
                          )}
                        >
                          {t.answer}
                        </p>
                      </div>
                    ))}
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {activeTab === "profile" && (
              <div className="tab-content-enter space-y-6 pb-10">
                {/* Configurações */}
                <section
                  className={cn(
                    "rounded-[1.5rem] p-6 border-2 backdrop-blur-xl",
                    theme === "dark"
                      ? "bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 border-orange-500/40"
                      : "bg-white/95 border-orange-300/60"
                  )}
                  style={
                    theme === "dark"
                      ? {
                          boxShadow:
                            "0 20px 40px -10px rgba(238, 77, 45, 0.3), 0 0 0 1px rgba(238, 77, 45, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)",
                        }
                      : {
                          boxShadow:
                            "0 20px 40px -10px rgba(238, 77, 45, 0.15), 0 0 0 1px rgba(238, 77, 45, 0.1)",
                        }
                  }
                >
                  <h4
                    className={cn(
                      "text-sm font-bold uppercase mb-5 tracking-wider flex items-center gap-2",
                      theme === "dark" ? "text-orange-400" : "text-orange-600"
                    )}
                  >
                    <div
                      className={cn(
                        "w-1 h-5 rounded-full",
                        theme === "dark" ? "bg-orange-500" : "bg-orange-500"
                      )}
                    />
                    Configurações
                  </h4>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "p-4 rounded-xl border-2 transition-all",
                          isMuted
                            ? theme === "dark"
                              ? "text-slate-400 bg-slate-800/60 border-slate-700/50"
                              : "text-slate-500 bg-slate-100 border-slate-300"
                            : theme === "dark"
                            ? "text-orange-400 bg-orange-500/20 border-orange-500/50 shadow-lg shadow-orange-500/20"
                            : "text-orange-600 bg-orange-50 border-orange-300 shadow-lg shadow-orange-200/50"
                        )}
                      >
                        {isMuted ? (
                          <VolumeX size={24} />
                        ) : (
                          <Volume2 size={24} />
                        )}
                      </div>
                      <div>
                        <p
                          className={cn(
                            "font-bold text-base",
                            theme === "dark" ? "text-white" : "text-slate-900"
                          )}
                        >
                          Sons de Alerta
                        </p>
                        <p
                          className={cn(
                            "text-sm font-medium",
                            theme === "dark"
                              ? "text-slate-400"
                              : "text-slate-600"
                          )}
                        >
                          {isMuted ? "Silenciado" : "Ativado"}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={toggleMute}
                      className={cn(
                        "px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg hover:scale-105",
                        theme === "dark"
                          ? "text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 border border-orange-400/30"
                          : "text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                      )}
                      style={{
                        boxShadow:
                          theme === "dark"
                            ? "0 4px 15px rgba(238, 77, 45, 0.4)"
                            : "0 4px 15px rgba(238, 77, 45, 0.3)",
                      }}
                    >
                      Alterar
                    </button>
                  </div>
                </section>

                {/* Meus Dados */}
                <section
                  className={cn(
                    "rounded-[1.5rem] p-6 space-y-5 border-2 backdrop-blur-xl",
                    theme === "dark"
                      ? "bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 border-orange-500/40"
                      : "bg-white/95 border-orange-300/60"
                  )}
                  style={
                    theme === "dark"
                      ? {
                          boxShadow:
                            "0 20px 40px -10px rgba(238, 77, 45, 0.3), 0 0 0 1px rgba(238, 77, 45, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)",
                        }
                      : {
                          boxShadow:
                            "0 20px 40px -10px rgba(238, 77, 45, 0.15), 0 0 0 1px rgba(238, 77, 45, 0.1)",
                        }
                  }
                >
                  <h4
                    className={cn(
                      "text-sm font-bold uppercase mb-5 tracking-wider flex items-center gap-2",
                      theme === "dark" ? "text-orange-400" : "text-orange-600"
                    )}
                  >
                    <div
                      className={cn(
                        "w-1 h-5 rounded-full",
                        theme === "dark" ? "bg-orange-500" : "bg-orange-500"
                      )}
                    />
                    Meus Dados
                  </h4>

                  <div className="space-y-1">
                    <label
                      className={cn(
                        "text-xs font-bold uppercase tracking-wide",
                        theme === "dark" ? "text-orange-300" : "text-orange-700"
                      )}
                    >
                      ID Motorista
                    </label>
                    <div
                      className={cn(
                        "p-4 rounded-xl text-sm font-mono flex justify-between items-center border-2 transition-all",
                        theme === "dark"
                          ? "bg-slate-800/60 border-orange-500/40 text-orange-300 shadow-lg shadow-orange-500/10"
                          : "bg-orange-50/80 border-orange-300/60 text-orange-900 shadow-md"
                      )}
                    >
                      <span className="font-bold">{shopeeId}</span>
                      <Lock
                        size={16}
                        className={
                          theme === "dark"
                            ? "text-orange-400"
                            : "text-orange-600"
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label
                      className={cn(
                        "text-xs font-bold uppercase tracking-wide",
                        theme === "dark" ? "text-orange-300" : "text-orange-700"
                      )}
                    >
                      Hub
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={hubSearch || ""}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          
                          // Se o usuário começar a digitar e houver hub selecionado, limpar tudo
                          if (hub && newValue.length > 0 && newValue !== hub) {
                            setHub("");
                            setHubSearch(newValue);
                          } else {
                            setHubSearch(newValue);
                          }
                          
                          setIsHubDropdownOpen(true);
                        }}
                        onFocus={(e) => {
                          setIsHubDropdownOpen(true);
                          // Quando focar no campo, se houver hub selecionado, limpar o campo para permitir nova pesquisa
                          if (hub) {
                            setHub("");
                            setHubSearch("");
                            // Limpar o campo visualmente usando setTimeout para garantir que funcione
                            setTimeout(() => {
                              e.currentTarget.value = "";
                            }, 0);
                          }
                        }}
                        onKeyDown={(e) => {
                          // Se o usuário começar a digitar qualquer caractere (não teclas especiais), limpar o campo
                          if (hub && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                            setHub("");
                            setHubSearch("");
                            e.currentTarget.value = "";
                          }
                        }}
                        onClick={() => {
                          setIsHubDropdownOpen(true);
                        }}
                        onBlur={(e) => {
                          // Delay para permitir clique no dropdown
                          setTimeout(() => {
                            if (!e.relatedTarget || !e.relatedTarget.closest('.hub-dropdown')) {
                              setIsHubDropdownOpen(false);
                              // Se não houver hub selecionado e houver busca, limpar a busca
                              if (!hub && hubSearch) {
                                setHubSearch("");
                              } else if (hub && hubSearch !== hub) {
                                // Se houver hub selecionado, restaurar o valor do hub na busca
                                setHubSearch(hub);
                              }
                            }
                          }, 200);
                        }}
                        className={cn(
                          "w-full p-4 rounded-xl text-sm font-medium border-2 focus:ring-2 focus:ring-orange-500/50 outline-none transition-all",
                          theme === "dark"
                            ? "bg-slate-800/60 border-orange-500/40 text-white placeholder:text-slate-500 focus:border-orange-500 focus:shadow-lg focus:shadow-orange-500/20"
                            : "bg-white border-orange-300/60 text-slate-900 placeholder:text-slate-400 focus:border-orange-500 focus:shadow-lg focus:shadow-orange-200/50"
                        )}
                        placeholder="Selecione ou pesquise um Hub..."
                      />
                      {isHubDropdownOpen && (
                        <div
                          className="hub-dropdown absolute z-50 w-full mt-2 rounded-xl max-h-60 overflow-y-auto backdrop-blur-xl"
                          style={{
                            background: theme === "dark" 
                              ? "rgba(30, 41, 59, 0.98)" 
                              : "rgba(255, 255, 255, 0.98)",
                            border: theme === "dark"
                              ? "1px solid rgba(71, 85, 105, 0.4)"
                              : "1px solid rgba(254, 131, 48, 0.3)",
                            boxShadow: theme === "dark"
                              ? "0 20px 40px -10px rgba(0, 0, 0, 0.5)"
                              : "0 20px 40px -10px rgba(0, 0, 0, 0.2)",
                          }}
                        >
                          {filteredHubs.length > 0 ? (
                            filteredHubs.map((h) => (
                              <div
                                key={h}
                                className={cn(
                                  "p-3 cursor-pointer text-sm transition-colors first:rounded-t-xl last:rounded-b-xl",
                                  theme === "dark"
                                    ? "text-slate-300 hover:bg-slate-700/90 hover:text-white"
                                    : "text-slate-700 hover:bg-orange-50 hover:text-orange-700",
                                  hub === h && (theme === "dark" ? "bg-orange-500/20 text-orange-300" : "bg-orange-100 text-orange-700")
                                )}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  setHub(h);
                                  setHubSearch(h);
                                  setIsHubDropdownOpen(false);
                                }}
                              >
                                {h}
                              </div>
                            ))
                          ) : (
                            <div className={cn(
                              "p-3 text-sm text-center",
                              theme === "dark" ? "text-slate-400" : "text-slate-500"
                            )}>
                              Nenhum hub encontrado
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label
                      className={cn(
                        "text-xs font-bold uppercase tracking-wide",
                        theme === "dark" ? "text-orange-300" : "text-orange-700"
                      )}
                    >
                      Veículo
                    </label>
                    <select
                      value={vehicleType}
                      onChange={(e) => setVehicleType(e.target.value)}
                      className={cn(
                        "w-full p-4 rounded-xl text-sm font-medium capitalize focus:ring-2 focus:ring-orange-500/50 outline-none transition-all appearance-none cursor-pointer border-2",
                        theme === "dark"
                          ? "bg-slate-800/60 border-orange-500/40 text-white focus:border-orange-500 focus:shadow-lg focus:shadow-orange-500/20"
                          : "bg-white border-orange-300/60 text-slate-900 focus:border-orange-500 focus:shadow-lg focus:shadow-orange-200/50"
                      )}
                    >
                      {VEHICLE_TYPES.map((v) => (
                        <option
                          key={v}
                          value={v}
                          className={
                            theme === "dark" ? "bg-slate-800" : "bg-white"
                          }
                        >
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label
                      className={cn(
                        "text-xs font-bold uppercase tracking-wide",
                        theme === "dark" ? "text-orange-300" : "text-orange-700"
                      )}
                    >
                      Nome
                    </label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={cn(
                        "w-full p-4 rounded-xl text-sm border focus:ring-2 focus:ring-orange-500/50 outline-none transition-all",
                        theme === "dark"
                          ? "bg-orange-500/20 border-orange-500/30 text-white placeholder:text-slate-400"
                          : "bg-white border-orange-200/50 text-slate-800 placeholder:text-slate-500"
                      )}
                    />
                  </div>

                  <div className="space-y-1">
                    <label
                      className={cn(
                        "text-xs font-bold uppercase tracking-wide",
                        theme === "dark" ? "text-orange-300" : "text-orange-700"
                      )}
                    >
                      Telefone
                    </label>
                    <input
                      value={formatPhoneNumber(phone)}
                      onChange={(e) => {
                        // Extrair apenas dígitos e limitar a 11 caracteres
                        const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
                        setPhone(digits);
                      }}
                      className={cn(
                        "w-full p-4 rounded-xl text-sm border focus:ring-2 focus:ring-orange-500/50 outline-none transition-all",
                        theme === "dark"
                          ? "bg-orange-500/20 border-orange-500/30 text-white placeholder:text-slate-400"
                          : "bg-white border-orange-200/50 text-slate-800 placeholder:text-slate-500"
                      )}
                    />
                  </div>

                  <button
                    onClick={handleUpdateProfile}
                    className="w-full py-4 mt-4 rounded-xl text-white font-bold text-base transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl"
                    style={{
                      background:
                        "linear-gradient(135deg, #EE4D2D 0%, #FF6B35 50%, #EE4D2D 100%)",
                      backgroundSize: "200% 200%",
                      boxShadow:
                        theme === "dark"
                          ? "0 8px 25px rgba(238, 77, 45, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
                          : "0 8px 25px rgba(238, 77, 45, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundPosition = "100% 0";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundPosition = "0% 0";
                    }}
                  >
                    Salvar Alterações
                  </button>
                </section>

                {/* Segurança */}
                <section
                  className={cn(
                    "rounded-[1.5rem] p-6 space-y-5 border-2 backdrop-blur-xl",
                    theme === "dark"
                      ? "bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 border-orange-500/40"
                      : "bg-white/95 border-orange-300/60"
                  )}
                  style={
                    theme === "dark"
                      ? {
                          boxShadow:
                            "0 20px 40px -10px rgba(238, 77, 45, 0.3), 0 0 0 1px rgba(238, 77, 45, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)",
                        }
                      : {
                          boxShadow:
                            "0 20px 40px -10px rgba(238, 77, 45, 0.15), 0 0 0 1px rgba(238, 77, 45, 0.1)",
                        }
                  }
                >
                  <h4
                    className={cn(
                      "text-sm font-bold uppercase mb-5 tracking-wider flex items-center gap-2",
                      theme === "dark" ? "text-orange-400" : "text-orange-600"
                    )}
                  >
                    <div
                      className={cn(
                        "w-1 h-5 rounded-full",
                        theme === "dark" ? "bg-orange-500" : "bg-orange-500"
                      )}
                    />
                    Segurança
                  </h4>

                  <div className="space-y-3">
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Nova Senha"
                        className={cn(
                          "w-full p-4 rounded-xl text-sm border-2 focus:ring-2 focus:ring-orange-500/50 outline-none transition-all",
                          theme === "dark"
                            ? "bg-slate-800/60 border-orange-500/40 text-white placeholder:text-slate-500 focus:border-orange-500 focus:shadow-lg focus:shadow-orange-500/20"
                            : "bg-white border-orange-300/60 text-slate-900 placeholder:text-slate-400 focus:border-orange-500 focus:shadow-lg focus:shadow-orange-200/50"
                        )}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className={cn(
                          "absolute right-4 top-4 transition-colors p-1 rounded-lg hover:bg-orange-500/10",
                          theme === "dark"
                            ? "text-orange-400 hover:text-orange-300"
                            : "text-orange-600 hover:text-orange-700"
                        )}
                      >
                        {showPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirmar Nova Senha"
                        className={cn(
                          "w-full p-4 rounded-xl text-sm border-2 focus:ring-2 focus:ring-orange-500/50 outline-none transition-all",
                          theme === "dark"
                            ? "bg-slate-800/60 border-orange-500/40 text-white placeholder:text-slate-500 focus:border-orange-500 focus:shadow-lg focus:shadow-orange-500/20"
                            : "bg-white border-orange-300/60 text-slate-900 placeholder:text-slate-400 focus:border-orange-500 focus:shadow-lg focus:shadow-orange-200/50"
                        )}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className={cn(
                          "absolute right-4 top-4 transition-colors p-1 rounded-lg hover:bg-orange-500/10",
                          theme === "dark"
                            ? "text-orange-400 hover:text-orange-300"
                            : "text-orange-600 hover:text-orange-700"
                        )}
                      >
                        {showPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                    <button
                      onClick={handleChangePassword}
                      className={cn(
                        "w-full py-4 rounded-xl text-base font-bold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg border-2",
                        theme === "dark"
                          ? "bg-gradient-to-r from-slate-800 to-slate-700 border-orange-500/40 text-white hover:from-slate-700 hover:to-slate-600"
                          : "bg-gradient-to-r from-orange-50 to-orange-100 border-orange-300/60 text-orange-900 hover:from-orange-100 hover:to-orange-200"
                      )}
                      style={{
                        boxShadow:
                          theme === "dark"
                            ? "0 4px 15px rgba(238, 77, 45, 0.3)"
                            : "0 4px 15px rgba(238, 77, 45, 0.2)",
                      }}
                    >
                      Atualizar Senha
                    </button>
                  </div>
                </section>
              </div>
            )}
          </div>

          {/* SUPPORT MODAL */}
          {isSupportModalOpen && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
              <div
                className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
                onClick={() => setIsSupportModalOpen(false)}
              />
              <div className="relative w-full max-w-lg bg-slate-800/95 backdrop-blur-2xl h-[90vh] sm:h-auto rounded-t-3xl sm:rounded-3xl shadow-2xl shadow-black/40 border border-orange-500/30 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10">
                <div className="p-4 border-b border-orange-500/30 flex justify-between items-center bg-slate-800/90 backdrop-blur-xl">
                  <h2 className="font-bold text-white">Nova Solicitação</h2>
                  <button
                    onClick={() => setIsSupportModalOpen(false)}
                    className="p-2 bg-slate-700/90 hover:bg-slate-600/90 rounded-full transition-colors"
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
                        Motivo
                      </label>
                      <select
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="w-full p-3 bg-slate-700/90 backdrop-blur-xl border border-slate-600/50 rounded-xl text-sm text-white focus:ring-2 focus:ring-primary outline-none shadow-lg shadow-black/10"
                        required
                      >
                        <option value="" className="bg-slate-800">
                          Selecione...
                        </option>
                        {SUPPORT_REASONS.map((r) => (
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
                        className="w-full p-3 bg-slate-700/90 backdrop-blur-xl border border-slate-600/50 rounded-xl text-sm h-24 resize-none text-white placeholder:text-white/50 focus:ring-2 focus:ring-primary outline-none shadow-lg shadow-black/10"
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
                          className="w-full p-3 bg-slate-700/90 backdrop-blur-xl border border-slate-600/50 rounded-xl text-sm font-bold text-white placeholder:text-white/50 focus:ring-2 focus:ring-[#FA4F26] outline-none shadow-lg shadow-black/10"
                          placeholder="Mín 20"
                          required
                        />
                      </div>
                      <div className="flex items-center justify-center bg-slate-700/90 backdrop-blur-xl border border-slate-600/50 rounded-xl shadow-lg shadow-black/10">
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
                          className="text-primary hover:text-primary/80 transition-colors"
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
                            className="flex-1 p-2 bg-slate-700/90 backdrop-blur-xl border border-slate-600/50 rounded-xl text-sm text-white placeholder:text-white/50 focus:ring-2 focus:ring-[#FA4F26] outline-none shadow-lg shadow-black/10"
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
                          className="text-primary hover:text-primary/80 transition-colors"
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
                            className="flex-1 p-2 bg-orange-500/20 backdrop-blur-xl border border-orange-500/30 rounded-xl text-sm capitalize text-white focus:ring-2 focus:ring-[#FA4F26] outline-none shadow-lg shadow-black/10"
                          >
                            <option value="" className="bg-slate-800">
                              Selecione...
                            </option>
                            {VEHICLE_TYPES.map((v) => (
                              <option
                                key={v}
                                value={v}
                                className="bg-slate-800"
                              >
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
                          className="flex-1 p-3 bg-orange-500/20 backdrop-blur-xl border border-orange-500/30 rounded-xl text-sm text-white placeholder:text-white/50 focus:ring-2 focus:ring-[#FA4F26] outline-none shadow-lg shadow-black/10"
                          placeholder="Link do Maps ou endereço"
                          required
                        />
                        <button
                          type="button"
                          onClick={handleGetLocation}
                          className="p-3 bg-blue-500/20 text-blue-300 rounded-xl border border-blue-400/30 hover:bg-blue-500/30 transition-colors shadow-lg shadow-black/10"
                        >
                          {isLocating ? (
                            <Loading size="sm" variant="spinner" />
                          ) : (
                            <NavigationIcon size={20} />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Upload de Foto da Carga */}
                    <div>
                      <label className="text-xs font-bold text-white/70 uppercase mb-2 block flex items-center gap-2">
                        <ImageIcon size={16} className="text-primary" />
                        Foto da Carga
                        <span className="text-[10px] text-white/50 normal-case font-normal">
                          (Opcional - Máx. 5MB)
                        </span>
                      </label>
                      <div className="space-y-2">
                        {cargoPhotoPreview ? (
                          <div className="relative">
                            <img
                              src={cargoPhotoPreview}
                              alt="Preview da carga"
                              className="w-full h-48 object-cover rounded-xl border-2 border-primary/50 shadow-lg"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setCargoPhoto(null);
                                setCargoPhotoPreview(null);
                              }}
                              className="absolute top-2 right-2 p-2 bg-red-500/90 hover:bg-red-600 text-white rounded-full shadow-lg transition-colors"
                            >
                              <XIcon size={16} />
                            </button>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-primary/50 rounded-xl cursor-pointer bg-primary/10 hover:bg-primary/20 transition-colors group">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <ImageIcon
                                size={32}
                                className="text-primary mb-2 group-hover:scale-110 transition-transform"
                              />
                              <p className="text-sm font-semibold text-white mb-1">
                                Clique para adicionar foto
                              </p>
                              <p className="text-xs text-white/70">
                                JPG, PNG ou GIF (máx. 5MB)
                              </p>
                            </div>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleCargoPhotoChange}
                              className="hidden"
                              disabled={isUploadingPhoto}
                            />
                          </label>
                        )}
                        {isUploadingPhoto && (
                          <div className="flex items-center justify-center gap-2 text-white/70 text-sm">
                            <Loading size="sm" variant="spinner" />
                            <span>Enviando foto...</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {modalError && (
                      <p className="text-red-300 text-xs font-bold text-center bg-red-500/20 backdrop-blur-xl p-2 rounded-xl border border-red-400/30">
                        {modalError}
                      </p>
                    )}
                  </form>
                </div>
                <div className="p-4 border-t border-slate-600/50 bg-slate-800/90 backdrop-blur-xl">
                  <Button
                    form="supportForm"
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg shadow-xl shadow-primary/30 rounded-xl"
                  >
                    {isSubmitting ? (
                      <Loading size="sm" variant="spinner" />
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
              <div className="bg-slate-800/95 backdrop-blur-2xl rounded-3xl p-6 w-full max-w-sm shadow-2xl shadow-black/40 border border-orange-500/30">
                <h3 className="font-bold text-lg mb-4 text-white">
                  Confirme sua senha atual
                </h3>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full p-3 bg-slate-700/90 backdrop-blur-xl border border-slate-600/50 rounded-xl mb-2 text-white placeholder:text-white/50 focus:ring-2 focus:ring-[#FA4F26] outline-none shadow-lg shadow-black/10"
                  placeholder="Senha atual"
                />
                {reauthError && (
                  <p className="text-red-300 text-xs mb-2">{reauthError}</p>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsReauthModalOpen(false)}
                    className="flex-1 border-slate-600/50 text-white hover:bg-slate-700/90 hover:text-white backdrop-blur-xl rounded-xl"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleReauthenticateAndChange}
                    disabled={isReauthenticating}
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg shadow-primary/30"
                  >
                    {isReauthenticating ? (
                      <Loading size="sm" variant="spinner" />
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
              <div className="bg-slate-800/95 backdrop-blur-2xl rounded-3xl p-8 text-center max-w-sm w-full shadow-2xl shadow-black/40 border border-orange-500/30">
                <div className="w-20 h-20 bg-green-500/20 text-green-300 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-400/30 shadow-xl shadow-black/20">
                  <CheckCircle size={40} />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Recebido!
                </h2>
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
        </main>
        <Chatbot />
      </div>
    </>
  );
};
