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
import { usePresence } from "../hooks/usePresence";

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
                : "bg-orange-500/20 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300 border border-orange-400/30"
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
                ? "text-orange-300 hover:text-orange-200"
                : "text-orange-600 hover:text-orange-500"
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

  // Estado local para Optimistic UI - atualização instantânea
  const [localDriverStatus, setLocalDriverStatus] = useState<string>(
    driver?.status || "INDISPONIVEL"
  );

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
  const [isMuted, setIsMuted] = useState(false);
  const [isProfileWarningVisible, setIsProfileWarningVisible] = useState(true);
  const [acceptingCallId, setAcceptingCallId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const userId = auth.currentUser?.uid;
  const isInitialOpenCallsLoad = useRef(true);

  // ========================================
  // SISTEMA DE PRESENÇA - Rastreamento de usuários online
  // ========================================
  usePresence(
    userId || null,
    "driver",
    driver
      ? {
          name: driver.name || "Motorista",
          email: auth.currentUser?.email || "",
        }
      : null,
    true // Sempre ativo para motoristas
  );

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

  // Driver com status local para Optimistic UI
  const driverWithLocalStatus = useMemo(() => {
    return {
      ...driver,
      status: localDriverStatus as
        | "DISPONIVEL"
        | "INDISPONIVEL"
        | "EM_ROTA"
        | "OFFLINE",
    };
  }, [driver, localDriverStatus]);

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
      setPhone(driver.phone || "");
      setHub(driver.hub || "");
      setVehicleType(driver.vehicleType || "");
      setHubSearch(driver.hub || "");
      // Sincronizar status local com o driver
      setLocalDriverStatus(driver.status || "INDISPONIVEL");
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
        localDriverStatus !== "DISPONIVEL" ||
        sessionNotifiedCallIds.has(newCall.id)
      )
        return;
      if (!isMuted) {
        const audio = new Audio("/shopee-ringtone.mp3");
        audio.play().catch(() => {});
      }
      sonnerToast.custom((t) => (
        <div className="flex w-full bg-slate-800/95 backdrop-blur-xl border-l-4 border-primary p-4 rounded-xl shadow-xl shadow-black/30 border border-orange-500/30">
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
  }, [localDriverStatus, isMuted]);

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

  const handleAvailabilityChange = async (isAvailable: boolean) => {
    if (!isProfileComplete || !shopeeId)
      return showNotification(
        "error",
        "Perfil Incompleto",
        "Verifique seus dados."
      );

    // OPTIMISTIC UI: Atualizar estado local IMEDIATAMENTE
    const newStatus = isAvailable ? "DISPONIVEL" : "INDISPONIVEL";
    setLocalDriverStatus(newStatus);

    // Depois atualizar no Firebase (não esperamos a resposta)
    try {
      await updateDriver(shopeeId, { status: newStatus });
    } catch (error) {
      // Se falhar, reverter o estado local
      setLocalDriverStatus(driver.status || "INDISPONIVEL");
      showNotification("error", "Erro", "Falha ao atualizar status.");
    }
  };

  const handleAcceptCall = async (callId: string) => {
    if (!isProfileComplete || !userId || !shopeeId)
      return showNotification("error", "Erro", "Perfil incompleto.");
    if (localDriverStatus === "EM_ROTA")
      return showNotification("error", "Ocupado", "Você já está em rota.");
    setAcceptingCallId(callId);

    // OPTIMISTIC UI: Atualizar status local para EM_ROTA imediatamente
    setLocalDriverStatus("EM_ROTA");

    try {
      await updateCall(callId, { assignedTo: userId, status: "EM ANDAMENTO" });
      await updateDriver(shopeeId, { status: "EM_ROTA" });
    } catch {
      // Se falhar, reverter o status
      setLocalDriverStatus(driver.status || "INDISPONIVEL");
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

    // OPTIMISTIC UI: Atualizar status local para DISPONIVEL imediatamente
    setLocalDriverStatus("DISPONIVEL");

    try {
      await updateCall(id, {
        assignedTo: deleteField(),
        status: "ABERTO",
      } as any);
      await updateDriver(shopeeId, { status: "DISPONIVEL" });
      showNotification("success", "Cancelado", "Apoio cancelado.");
    } catch {
      // Se falhar, reverter o status
      setLocalDriverStatus(driver.status || "INDISPONIVEL");
      showNotification("error", "Erro", "Falha ao cancelar.");
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
    if (!shopeeId) return;
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length !== 11)
      return showNotification("error", "Telefone", "Use DDD + 9 dígitos.");
    if (!HUBS.includes(hub as any))
      return showNotification("error", "Hub", "Selecione um Hub válido.");
    await updateDriver(shopeeId, { name, phone: cleanPhone, hub, vehicleType });
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
        cargoPhotoUrl,
        solicitante: {
          id: driver.uid,
          name: driver.name,
          avatar: driver.avatar || null,
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
      <div
        className="min-h-dvh font-sans pb-24 transition-colors duration-300"
        style={{
          background:
            theme === "dark"
              ? "linear-gradient(180deg, #1a0a05 0%, #2d0f08 30%, #1a0a05 60%, #0f0503 100%)"
              : "linear-gradient(180deg, #FFF5F0 0%, #FFE8E0 30%, #FFDBD0 60%, #FFCCC0 100%)",
          backgroundAttachment: "fixed",
        }}
      >
        {/* HEADER MODERNO */}
        <header
          className={cn(
            "sticky top-0 z-30 px-4 sm:px-6 py-4 flex justify-between items-center backdrop-blur-xl border-b transition-all",
            theme === "dark"
              ? "border-orange-500/30 bg-slate-900/85"
              : "border-orange-400/30 bg-white/85"
          )}
          style={{
            backdropFilter: "blur(12px)",
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-primary-foreground bg-primary shadow-lg">
              <ArrowRightLeft size={20} strokeWidth={2.5} />
            </div>
            <h1 className="font-bold text-base tracking-tight text-slate-900">
              Sistema Logístico
            </h1>
          </div>
          <div className="flex gap-2">
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
          <div className="mx-4 mt-4 p-4 rounded-2xl flex justify-between items-center bg-orange-500/10 dark:bg-orange-500/10 border border-orange-500/30 dark:border-orange-500/30 shadow-lg">
            <div className="flex items-center gap-3">
              <AlertTriangle
                size={20}
                className="text-orange-500 dark:text-orange-400"
              />
              <div>
                <p className="font-bold text-orange-600 dark:text-orange-400 text-sm">
                  Atenção
                </p>
                <p className="text-xs text-muted-foreground">
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

        <main className="p-4 sm:p-6 max-w-lg lg:max-w-4xl xl:max-w-6xl mx-auto space-y-6">
          {isUploading && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
              <Loading size="lg" variant="spinner" text="Enviando imagem..." />
            </div>
          )}
          <ProfileHeaderCard
            driver={driverWithLocalStatus}
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

          {/* TABS NAVIGATION MODERNAS */}
          <div
            className={cn(
              "p-1.5 rounded-2xl flex justify-between overflow-x-auto scrollbar-hide border shadow-lg transition-all duration-300",
              theme === "light"
                ? "bg-white/80 backdrop-blur-xl border-orange-200/50"
                : "bg-slate-900/40 backdrop-blur-xl border-orange-500/30"
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
                    ? "text-slate-700 hover:text-slate-900 hover:bg-orange-50/80"
                    : "text-slate-300 hover:text-white hover:bg-orange-500/20"
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
                <StatusSection
                  driver={driverWithLocalStatus}
                  onAvailabilityChange={handleAvailabilityChange}
                  filteredOpenCalls={filteredOpenCalls}
                  routeIdSearch={routeIdSearch}
                  onRouteIdSearchChange={setRouteIdSearch}
                  acceptingCallId={acceptingCallId}
                  onAcceptCall={handleAcceptCall}
                />
              </div>
            )}

            {activeTab === "support" && (
              <div className="tab-content-enter flex flex-col items-center justify-center py-8 space-y-6">
                <div className="w-20 h-20 bg-primary/20 dark:bg-primary/20 backdrop-blur-xl rounded-full flex items-center justify-center text-primary mb-2 border border-border dark:border-orange-500/30 shadow-xl shadow-black/5 dark:shadow-black/20">
                  <AlertTriangle size={40} />
                </div>
                <div className="text-center space-y-2 max-w-xs">
                  <h2 className="text-2xl font-bold text-foreground dark:text-white">
                    Precisa de Apoio?
                  </h2>
                  <p className="text-sm text-muted-foreground dark:text-white/70">
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
              </div>
            )}

            {activeTab === "activeCalls" && (
              <div className="tab-content-enter space-y-4">
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {["all", "inProgress", "requester", "provider"].map((f) => (
                    <button
                      key={f}
                      onClick={() => setHistoryFilter(f as any)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-xs font-bold border whitespace-nowrap backdrop-blur-xl shadow-lg transition-all duration-300 ease-in-out",
                        historyFilter === f
                          ? theme === "dark"
                            ? "bg-orange-500/20 text-white border-orange-500/40 shadow-xl transform scale-105"
                            : "bg-orange-50 text-slate-900 border-orange-300 shadow-xl transform scale-105"
                          : theme === "dark"
                          ? "bg-slate-900/60 text-slate-300 border-orange-500/20 hover:bg-orange-500/10 hover:text-white hover:scale-102"
                          : "bg-white/60 text-slate-700 border-orange-200/40 hover:bg-orange-50 hover:text-slate-900 hover:scale-102"
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
                          "h-8 text-xs font-normal justify-start text-left w-[130px] bg-white/80 dark:bg-orange-500/20 border-border dark:border-orange-500/30 text-foreground dark:text-white hover:bg-white dark:hover:bg-orange-500/30 backdrop-blur-xl rounded-xl shadow-lg shadow-black/5 dark:shadow-black/10 transition-all duration-300 ease-in-out hover:scale-105",
                          !startDate &&
                            "text-muted-foreground dark:text-white/50"
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
                      className="w-auto p-0 bg-white dark:bg-slate-800/95 backdrop-blur-xl border-border dark:border-slate-600/50 rounded-2xl shadow-xl shadow-black/10 dark:shadow-black/30"
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
                          "h-8 text-xs font-normal justify-start text-left w-[130px] bg-white/80 dark:bg-orange-500/20 border-border dark:border-orange-500/30 text-foreground dark:text-white hover:bg-white dark:hover:bg-orange-500/30 backdrop-blur-xl rounded-xl shadow-lg shadow-black/5 dark:shadow-black/10 transition-all duration-300 ease-in-out hover:scale-105",
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
                      className="w-auto p-0 bg-white dark:bg-slate-800/95 backdrop-blur-xl border-border dark:border-slate-600/50 rounded-2xl shadow-xl shadow-black/10 dark:shadow-black/30"
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
                    <div className="text-center py-12 opacity-50 bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-dashed border-orange-200/50 dark:border-orange-500/30 shadow-xl shadow-black/5 dark:shadow-black/20">
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
              <div className="tab-content-enter space-y-6 pb-10">
                <Tabs defaultValue="solicitante" className="w-full">
                  <TabsList
                    className={cn(
                      "grid w-full grid-cols-2 backdrop-blur-xl p-1 rounded-xl h-10 mb-4 border shadow-xl",
                      theme === "dark"
                        ? "bg-slate-900/60 border-orange-500/30"
                        : "bg-white/80 border-orange-200/50"
                    )}
                  >
                    <TabsTrigger
                      value="solicitante"
                      className={cn(
                        "text-xs data-[state=active]:shadow rounded-lg transition-all",
                        theme === "dark"
                          ? "text-slate-300 data-[state=active]:text-white data-[state=active]:bg-orange-500/20"
                          : "text-slate-600 data-[state=active]:text-slate-900 data-[state=active]:bg-orange-50"
                      )}
                    >
                      Solicitante
                    </TabsTrigger>
                    <TabsTrigger
                      value="prestador"
                      className={cn(
                        "text-xs data-[state=active]:shadow rounded-lg transition-all",
                        theme === "dark"
                          ? "text-slate-300 data-[state=active]:text-white data-[state=active]:bg-orange-500/20"
                          : "text-slate-600 data-[state=active]:text-slate-900 data-[state=active]:bg-orange-50"
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
                            ? "bg-slate-900/60 border-orange-500/30"
                            : "bg-white/80 border-orange-200/50"
                        )}
                      >
                        <h4 className="font-bold text-sm mb-2 flex gap-2 items-center text-foreground dark:text-white">
                          <HelpCircle size={16} className="text-primary" />{" "}
                          {t.question}
                        </h4>
                        <p className="text-xs text-muted-foreground dark:text-white/70">
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
                            ? "bg-slate-900/60 border-orange-500/30"
                            : "bg-white/80 border-orange-200/50"
                        )}
                      >
                        <h4 className="font-bold text-sm mb-2 flex gap-2 items-center text-foreground dark:text-white">
                          <HelpCircle size={16} className="text-primary" />{" "}
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
              <div className="tab-content-enter space-y-6 pb-10">
                {/* Configurações */}
                <section
                  className={cn(
                    "rounded-[1.5rem] p-5 border",
                    theme === "dark"
                      ? "bg-slate-900/40 border-orange-500/30 backdrop-blur-sm"
                      : "bg-white/80 border-orange-200/50"
                  )}
                  style={
                    theme === "dark"
                      ? {
                          boxShadow:
                            "0 25px 50px -12px rgba(254, 95, 47, 0.3), inset 0 1px 0 0 rgba(254, 95, 47, 0.1)",
                        }
                      : {
                          boxShadow:
                            "0 25px 50px -12px rgba(254, 95, 47, 0.15)",
                        }
                  }
                >
                  <h4
                    className={cn(
                      "text-xs font-bold uppercase mb-4 tracking-wide",
                      theme === "dark" ? "text-orange-300" : "text-slate-600"
                    )}
                  >
                    Configurações
                  </h4>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "p-3 rounded-xl",
                          isMuted
                            ? theme === "dark"
                              ? "text-slate-400 bg-slate-800/80 border border-slate-600/30"
                              : "text-slate-500 bg-slate-100 border border-slate-300"
                            : theme === "dark"
                            ? "text-emerald-300 bg-emerald-500/20 border border-emerald-400/30"
                            : "text-emerald-600 bg-emerald-50 border border-emerald-300"
                        )}
                      >
                        {isMuted ? (
                          <VolumeX size={22} />
                        ) : (
                          <Volume2 size={22} />
                        )}
                      </div>
                      <div>
                        <p
                          className={cn(
                            "font-bold text-sm",
                            theme === "dark" ? "text-white" : "text-slate-800"
                          )}
                        >
                          Sons de Alerta
                        </p>
                        <p
                          className={cn(
                            "text-xs",
                            theme === "dark"
                              ? "text-slate-300"
                              : "text-slate-600"
                          )}
                        >
                          {isMuted ? "Silenciado" : "Ativado"}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={toggleMute}
                      className="px-4 py-2 rounded-xl text-sm font-medium text-orange-400 hover:bg-orange-500/10 transition-all"
                    >
                      Alterar
                    </button>
                  </div>
                </section>

                {/* Meus Dados */}
                <section
                  className={cn(
                    "rounded-[1.5rem] p-5 space-y-4 border",
                    theme === "dark"
                      ? "bg-slate-900/40 border-orange-500/30 backdrop-blur-sm"
                      : "bg-white/80 border-orange-200/50"
                  )}
                  style={
                    theme === "dark"
                      ? {
                          boxShadow:
                            "0 25px 50px -12px rgba(254, 95, 47, 0.3), inset 0 1px 0 0 rgba(254, 95, 47, 0.1)",
                        }
                      : {
                          boxShadow:
                            "0 25px 50px -12px rgba(254, 95, 47, 0.15)",
                        }
                  }
                >
                  <h4
                    className={cn(
                      "text-xs font-bold uppercase mb-2 tracking-wide",
                      theme === "dark" ? "text-slate-300" : "text-slate-600"
                    )}
                  >
                    Meus Dados
                  </h4>

                  <div className="space-y-1">
                    <label
                      className={cn(
                        "text-xs font-bold",
                        theme === "dark" ? "text-orange-300" : "text-slate-600"
                      )}
                    >
                      ID Motorista
                    </label>
                    <div
                      className={cn(
                        "p-4 rounded-xl text-sm font-mono flex justify-between items-center",
                        theme === "dark" ? "text-orange-200" : "text-slate-700"
                      )}
                      style={{
                        background:
                          theme === "dark"
                            ? "rgba(254, 95, 47, 0.15)"
                            : "rgba(255, 168, 50, 0.15)",
                        border:
                          theme === "dark"
                            ? "1px solid rgba(254, 95, 47, 0.3)"
                            : "1px solid rgba(255, 168, 50, 0.3)",
                      }}
                    >
                      {shopeeId}
                      <Lock
                        size={14}
                        className={
                          theme === "dark"
                            ? "text-orange-400"
                            : "text-orange-500"
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label
                      className={cn(
                        "text-xs font-bold",
                        theme === "dark" ? "text-orange-300" : "text-slate-600"
                      )}
                    >
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
                        className={cn(
                          "w-full p-4 rounded-xl text-sm font-medium border focus:ring-2 focus:ring-orange-500/50 outline-none transition-all",
                          theme === "dark"
                            ? "bg-orange-500/20 border-orange-500/30 text-white placeholder:text-slate-400"
                            : "bg-orange-50/80 border-orange-200/50 text-slate-800 placeholder:text-slate-500"
                        )}
                        placeholder="Pesquisar Hub..."
                      />
                      {isHubDropdownOpen && filteredHubs.length > 0 && (
                        <div
                          className={cn(
                            "absolute z-10 w-full mt-2 rounded-xl max-h-48 overflow-y-auto border",
                            theme === "dark"
                              ? "bg-slate-900/98 border-orange-500/40 backdrop-blur-xl"
                              : "bg-white border-orange-200/50"
                          )}
                          style={{
                            boxShadow:
                              theme === "dark"
                                ? "0 20px 40px -10px rgba(254, 95, 47, 0.4)"
                                : "0 20px 40px -10px rgba(254, 95, 47, 0.2)",
                          }}
                        >
                          {filteredHubs.map((h) => (
                            <div
                              key={h}
                              className={cn(
                                "p-3 cursor-pointer text-sm transition-colors first:rounded-t-xl last:rounded-b-xl",
                                theme === "dark"
                                  ? "text-slate-300 hover:text-white hover:bg-orange-500/20"
                                  : "text-slate-700 hover:text-slate-900 hover:bg-orange-50"
                              )}
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
                    <label
                      className={cn(
                        "text-xs font-bold",
                        theme === "dark" ? "text-orange-300" : "text-slate-600"
                      )}
                    >
                      Veículo
                    </label>
                    <select
                      value={vehicleType}
                      onChange={(e) => setVehicleType(e.target.value)}
                      className={cn(
                        "w-full p-4 rounded-xl text-sm font-medium capitalize focus:ring-2 focus:ring-orange-500/50 outline-none transition-all appearance-none cursor-pointer",
                        theme === "dark" ? "text-white" : "text-slate-800"
                      )}
                      style={{
                        background:
                          theme === "dark"
                            ? "rgba(254, 95, 47, 0.15)"
                            : "rgba(255, 168, 50, 0.15)",
                        border:
                          theme === "dark"
                            ? "1px solid rgba(254, 95, 47, 0.3)"
                            : "1px solid rgba(255, 168, 50, 0.3)",
                      }}
                    >
                      {VEHICLE_TYPES.map((v) => (
                        <option
                          key={v}
                          value={v}
                          className={
                            theme === "dark" ? "bg-slate-900" : "bg-white"
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
                        "text-xs font-bold",
                        theme === "dark" ? "text-orange-300" : "text-slate-600"
                      )}
                    >
                      Nome
                    </label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={cn(
                        "w-full p-4 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/50 outline-none transition-all",
                        theme === "dark"
                          ? "text-white placeholder:text-slate-400"
                          : "text-slate-800 placeholder:text-slate-500"
                      )}
                      style={{
                        background:
                          theme === "dark"
                            ? "rgba(254, 95, 47, 0.15)"
                            : "rgba(255, 168, 50, 0.15)",
                        border:
                          theme === "dark"
                            ? "1px solid rgba(254, 95, 47, 0.3)"
                            : "1px solid rgba(255, 168, 50, 0.3)",
                      }}
                    />
                  </div>

                  <div className="space-y-1">
                    <label
                      className={cn(
                        "text-xs font-bold",
                        theme === "dark" ? "text-orange-300" : "text-slate-600"
                      )}
                    >
                      Telefone
                    </label>
                    <input
                      value={formatPhoneNumber(phone)}
                      onChange={(e) => setPhone(e.target.value)}
                      className={cn(
                        "w-full p-4 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/50 outline-none transition-all",
                        theme === "dark"
                          ? "text-white placeholder:text-slate-400"
                          : "text-slate-800 placeholder:text-slate-500"
                      )}
                      style={{
                        background:
                          theme === "dark"
                            ? "rgba(254, 95, 47, 0.15)"
                            : "rgba(255, 168, 50, 0.15)",
                        border:
                          theme === "dark"
                            ? "1px solid rgba(254, 95, 47, 0.3)"
                            : "1px solid rgba(255, 168, 50, 0.3)",
                      }}
                    />
                  </div>

                  <button
                    onClick={handleUpdateProfile}
                    className={cn(
                      "w-full py-4 mt-2 rounded-xl font-bold text-sm transition-all hover:opacity-90",
                      theme === "dark" ? "text-white" : "text-white"
                    )}
                    style={{
                      background:
                        "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                      boxShadow: "0 4px 20px -5px rgba(249, 115, 22, 0.5)",
                    }}
                  >
                    Salvar Alterações
                  </button>
                </section>

                {/* Segurança */}
                <section
                  className={cn(
                    "rounded-[1.5rem] p-5 space-y-4 border",
                    theme === "dark"
                      ? "bg-slate-900/40 border-orange-500/30 backdrop-blur-sm"
                      : "bg-white/80 border-orange-200/50"
                  )}
                  style={
                    theme === "dark"
                      ? {
                          boxShadow:
                            "0 25px 50px -12px rgba(254, 95, 47, 0.3), inset 0 1px 0 0 rgba(254, 95, 47, 0.1)",
                        }
                      : {
                          boxShadow:
                            "0 25px 50px -12px rgba(254, 95, 47, 0.15)",
                        }
                  }
                >
                  <h4
                    className={cn(
                      "text-xs font-bold uppercase mb-2 tracking-wide",
                      theme === "dark" ? "text-orange-300" : "text-slate-600"
                    )}
                  >
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
                          "w-full p-4 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/50 outline-none transition-all",
                          theme === "dark"
                            ? "text-white placeholder:text-slate-400 bg-orange-500/10 border border-orange-500/30"
                            : "text-slate-800 placeholder:text-slate-500 bg-orange-50/50 border border-orange-200/50"
                        )}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className={cn(
                          "absolute right-4 top-4 transition-colors",
                          theme === "dark"
                            ? "text-slate-400 hover:text-white"
                            : "text-slate-500 hover:text-slate-700"
                        )}
                      >
                        {showPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirmar Nova Senha"
                      className={cn(
                        "w-full p-4 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/50 outline-none transition-all",
                        theme === "dark"
                          ? "text-white placeholder:text-slate-400 bg-orange-500/10 border border-orange-500/30"
                          : "text-slate-800 placeholder:text-slate-500 bg-orange-50/50 border border-orange-200/50"
                      )}
                    />
                    <button
                      onClick={handleChangePassword}
                      className={cn(
                        "w-full py-4 rounded-xl text-sm font-medium transition-all border",
                        theme === "dark"
                          ? "text-slate-300 hover:text-white bg-slate-800/50 border-orange-500/30 hover:bg-orange-500/10"
                          : "text-slate-700 hover:text-slate-900 bg-white border-orange-200/50 hover:bg-orange-50"
                      )}
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
                        Hub
                      </label>
                      <select
                        value={hub}
                        onChange={(e) => setHub(e.target.value)}
                        className="w-full p-3 bg-slate-700/90 backdrop-blur-xl border border-slate-600/50 rounded-xl text-sm text-white focus:ring-2 focus:ring-primary outline-none shadow-lg shadow-black/10"
                        required
                      >
                        <option value="" className="bg-slate-800">
                          Selecione...
                        </option>
                        {HUBS.map((h) => (
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
