import React, { useState, useEffect, useMemo, useRef } from "react";
import type { Driver, SupportCall, UrgencyLevel } from "../types/logistics";
import {
  Clock,
  AlertTriangle,
  X,
  MapPin,
  Package,
  Building,
  Globe,
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
  PlusCircle,
  MinusCircle,
  Ticket,
  Volume2,
  VolumeX,
} from "lucide-react";
// Importações do Firebase
import { auth, db } from "../firebase";
import {
  doc,
  onSnapshot,
  updateDoc,
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  or,
  Timestamp,
  deleteField,
} from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { Toaster, toast as sonnerToast } from "sonner";
import spxLogo from "/spx-logo.png";

const hubs = [
  "LM Hub_PR_Londrina_Parque ABC II",
  "LM Hub_PR_Maringa",
  "LM Hub_PR_Foz do Iguaçu",
  "LM Hub_PR_Cascavel",
];

const vehicleTypesList = ["moto", "carro passeio", "carro utilitario", "van"];

// Card de Cabeçalho do Perfil
const ProfileHeaderCard = ({
  driver,
  onEditClick,
  isUploading,
  activeCall,
}: {
  driver: Driver | null;
  onEditClick: () => void;
  isUploading: boolean;
  activeCall: SupportCall | null;
}) => {
  if (!driver) return null;

  const formatPhoneNumberSimple = (phone: string) => {
    if (!phone) return "";
    const digits = phone.replace(/\D/g, "");
    if (digits.length !== 11) return phone;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const getStatusInfo = () => {
    if (
      activeCall &&
      activeCall.solicitante.id === driver.id &&
      activeCall.status === "ABERTO"
    ) {
      return { text: "Aguardando Apoio", color: "bg-orange-500" };
    }

    switch (driver.status) {
      case "DISPONIVEL":
        return { text: "Disponível para Apoio", color: "bg-green-500" };
      case "INDISPONIVEL":
        return { text: "Indisponível", color: "bg-red-500" };
      case "EM_ROTA":
        return { text: "Prestando Apoio", color: "bg-blue-500" };
      default:
        return { text: "Offline", color: "bg-gray-500" };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="relative mb-12">
      <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-lg shadow-lg p-6 pt-16 text-white text-center">
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 group">
          <div className="relative w-24 h-24 rounded-full bg-white border-4 border-white shadow-md flex items-center justify-center overflow-hidden">
            {driver.avatar ? (
              <img
                src={driver.avatar}
                alt={driver.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-3xl font-bold text-orange-600">
                {driver.initials}
              </span>
            )}
            {isUploading ? (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <LoaderCircle className="text-white animate-spin" />
              </div>
            ) : (
              <button
                onClick={onEditClick}
                className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center transition-opacity opacity-0 group-hover:opacity-100"
              >
                <Camera className="text-white" size={32} />
              </button>
            )}
          </div>
        </div>
        <h2 className="text-2xl font-bold">{driver.name}</h2>
        <div className="text-sm opacity-90 mt-2 space-y-1">
          <p className="flex items-center justify-center gap-2">
            <Building size={14} /> {driver.hub || "Hub não definido"}
          </p>
          <p className="flex items-center justify-center gap-2">
            <Phone size={14} />{" "}
            {formatPhoneNumberSimple(driver.phone) || "Telefone não definido"}
          </p>
          <p className="flex items-center justify-center gap-2 capitalize">
            <Truck size={14} /> {driver.vehicleType || "Veículo não definido"}
          </p>
        </div>
        <div className="flex items-center justify-center mt-3">
          <span
            className={`w-3 h-3 rounded-full ${statusInfo.color} mr-2`}
          ></span>
          <p className="text-sm font-bold">{statusInfo.text}</p>
        </div>
      </div>
    </div>
  );
};

// Componente para o cartão de histórico
const DriverCallHistoryCard = ({
  call,
  currentDriver,
  allDrivers,
  onCancelSupport,
  onDeleteSupportRequest,
  onRequestApproval,
}: {
  call: SupportCall;
  currentDriver: Driver;
  allDrivers: Driver[];
  onCancelSupport: (callId: string) => void;
  onDeleteSupportRequest: (callId: string) => void;
  onRequestApproval: (callId: string) => void;
}) => {
  const isRequester = call.solicitante.id === currentDriver.id;
  const otherPartyId = isRequester ? call.assignedTo : call.solicitante.id;
  const otherParty = allDrivers.find((d) => d.id === otherPartyId);
  let statusText = "Status desconhecido",
    statusColor = "bg-gray-200",
    icon = <HelpCircle size={20} />,
    title = "Chamado";

  if (isRequester) {
    title = "Pedido de Apoio";
    if (call.status === "ABERTO") {
      statusText = "Aguardando Apoio";
      statusColor = "bg-yellow-200 text-yellow-800";
      icon = <HelpCircle size={20} className="text-yellow-500" />;
    } else if (call.status === "AGUARDANDO_APROVACAO") {
      statusText = "Aguardando Aprovação";
      statusColor = "bg-purple-200 text-purple-800";
      icon = <Clock size={20} className="text-purple-500" />;
    } else if (call.status === "EM ANDAMENTO") {
      statusText = `Recebendo Apoio`;
      statusColor = "bg-blue-200 text-blue-800";
      icon = (
        <Truck size={20} className="text-blue-500 transform -scale-x-100" />
      );
    }
  } else {
    title = `Apoio a ${call.solicitante.name}`;
    if (call.status === "EM ANDAMENTO") {
      statusText = "Prestando Apoio";
      statusColor = "bg-green-200 text-green-800";
      icon = <Truck size={20} className="text-green-500" />;
    } else if (call.status === "AGUARDANDO_APROVACAO") {
      statusText = "Aguardando Aprovação";
      statusColor = "bg-purple-200 text-purple-800";
      icon = <Clock size={20} className="text-purple-500" />;
    }
  }
  if (call.status === "CONCLUIDO") {
    statusText = "Concluído";
    statusColor = "bg-gray-200 text-gray-800";
  }

  const handleWhatsAppClick = () => {
    const contactPhone = otherParty?.phone;
    if (!contactPhone) {
      sonnerToast.error("O outro motorista não tem um telefone cadastrado.");
      return;
    }
    const message = encodeURIComponent(
      `Olá ${otherParty?.name}, sou o ${currentDriver.name} referente ao chamado de apoio.`
    );
    window.open(`https://wa.me/55${contactPhone}?text=${message}`, "_blank");
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-orange-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          {icon}
          <div>
            <p className="font-bold text-gray-800">{title}</p>
            <p className="text-sm text-gray-500">{call.description}</p>
          </div>
        </div>
        <div
          className={`px-3 py-1 text-xs font-semibold rounded-full ${statusColor} self-end sm:self-center`}
        >
          {statusText}
        </div>
      </div>

      <div className="mt-3 pt-3 border-t text-xs text-gray-600">
        <p className="flex items-center gap-2">
          <Ticket size={14} />
          <span className="font-semibold">ID da Rota:</span>{" "}
          {call.routeId || "N/A"}
        </p>
      </div>

      {(call.status === "EM ANDAMENTO" ||
        call.status === "AGUARDANDO_APROVACAO" ||
        call.status === "ABERTO") && (
        <div className="mt-3 pt-3 border-t flex flex-wrap gap-2 justify-end">
          {otherParty && (
            <button
              onClick={handleWhatsAppClick}
              className="flex items-center gap-2 px-3 py-1 text-xs font-semibold bg-green-500 text-white rounded-md hover:bg-green-600"
            >
              <Phone size={14} /> Contatar
            </button>
          )}
          {!isRequester && call.status === "EM ANDAMENTO" && (
            <>
              <button
                onClick={() => onRequestApproval(call.id)}
                className="flex items-center gap-2 px-3 py-1 text-xs font-semibold bg-purple-500 text-white rounded-md hover:bg-purple-600"
              >
                <Clock size={14} /> Aguardando Aprovação
              </button>
              <button
                onClick={() => onCancelSupport(call.id)}
                className="flex items-center gap-2 px-3 py-1 text-xs font-semibold bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                <XCircle size={14} /> Cancelar Apoio
              </button>
            </>
          )}
          {isRequester && call.status === "ABERTO" && (
            <button
              onClick={() => onDeleteSupportRequest(call.id)}
              className="flex items-center gap-2 px-3 py-1 text-xs font-semibold bg-red-500 text-white rounded-md hover:bg-red-600"
            >
              <XCircle size={14} /> Cancelar Solicitação
            </button>
          )}
          {isRequester && call.status === "EM ANDAMENTO" && (
            <>
              <button
                onClick={() => onRequestApproval(call.id)}
                className="flex items-center gap-2 px-3 py-1 text-xs font-semibold bg-purple-500 text-white rounded-md hover:bg-purple-600"
              >
                <Clock size={14} /> Aguardando Aprovação
              </button>
              <button
                onClick={() => onDeleteSupportRequest(call.id)}
                className="flex items-center gap-2 px-3 py-1 text-xs font-semibold bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                <XCircle size={14} /> Cancelar Solicitação
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

// Componente para a lista de chamados abertos
const OpenCallCard = ({
  call,
  currentDriverName,
  onAccept,
  acceptingCallId,
}: {
  call: SupportCall;
  currentDriverName: string;
  onAccept: (callId: string) => void;
  acceptingCallId: string | null;
}) => {
  const requesterPhone = call.solicitante.phone || "";
  const isAcceptingThisCall = acceptingCallId === call.id;

  const handleWhatsAppClick = () => {
    if (!requesterPhone) {
      sonnerToast.error(
        "O motorista solicitante não possui um número de telefone cadastrado."
      );
      return;
    }
    const message = encodeURIComponent(
      `Olá ${call.solicitante.name}, me chamo ${currentDriverName} e aceitei seu chamado e serei seu apoio`
    );
    // CORREÇÃO: Corrigido o erro de digitação de 'requESTERPhone' para 'requesterPhone'
    window.open(`https://wa.me/55${requesterPhone}?text=${message}`, "_blank");
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-yellow-500">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div>
          <p className="font-bold text-gray-800">
            Apoio para {call.solicitante.name}
          </p>
          <p className="text-sm text-gray-500 mt-1">{call.description}</p>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            onClick={handleWhatsAppClick}
            className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600"
          >
            <Phone size={16} />
          </button>
          <button
            onClick={() => onAccept(call.id)}
            disabled={!!acceptingCallId}
            className="px-4 py-2 bg-orange-600 text-white text-sm font-semibold rounded-lg hover:bg-orange-700 disabled:bg-orange-300 flex items-center justify-center w-28"
          >
            {isAcceptingThisCall ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              "Aceitar Apoio"
            )}
          </button>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t text-xs text-gray-600 space-y-1">
        <p className="flex items-center gap-2">
          <Ticket size={14} />
          <span className="font-semibold">ID da Rota:</span>{" "}
          {call.routeId || "N/A"}
        </p>
        <p className="flex items-center gap-2">
          <MapPin size={14} />
          <span className="font-semibold">Local:</span> {call.location}
        </p>
      </div>
    </div>
  );
};

export const DriverInterface = () => {
  const [driver, setDriver] = useState<Driver | null>(null);
  const [allMyCalls, setAllMyCalls] = useState<SupportCall[]>([]);
  const [openSupportCalls, setOpenSupportCalls] = useState<SupportCall[]>([]);
  const [allDrivers, setAllDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);

  const TABS = useMemo(
    () => [
      { id: "availability", label: "Disponibilidade", icon: <Zap size={16} /> },
      { id: "support", label: "Apoio", icon: <AlertTriangle size={16} /> },
      { id: "activeCalls", label: "Meus Chamados", icon: <Clock size={16} /> },
      { id: "profile", label: "Perfil", icon: <User size={16} /> },
    ],
    []
  );
  type TabId = "availability" | "support" | "activeCalls" | "profile";
  const [activeTab, setActiveTab] = useState<TabId>("availability");

  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [location, setLocation] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");
  const [historyFilter, setHistoryFilter] = useState<
    "all" | "requester" | "provider" | "inProgress"
  >("all");

  const [deliveryRegions, setDeliveryRegions] = useState([""]);
  const [neededVehicles, setNeededVehicles] = useState([""]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [hub, setHub] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [hubSearch, setHubSearch] = useState("");
  const [isHubDropdownOpen, setIsHubDropdownOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isProfileInitialized = useRef(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const swipeContainerRef = useRef<HTMLDivElement>(null);
  const [acceptingCallId, setAcceptingCallId] = useState<string | null>(null);
  const userId = auth.currentUser?.uid;
  const notifiedCallIds = useRef(new Set<string>());
  const [routeIdSearch, setRouteIdSearch] = useState("");
  const prevOpenSupportCallsRef = useRef<SupportCall[]>([]);
  const [globalHubFilter, setGlobalHubFilter] = useState("Todos os Hubs");
  const [isMuted, setIsMuted] = useState(false);

  const isProfileComplete = useMemo(() => {
    if (!driver) return false;
    return !!(driver.hub && driver.vehicleType && driver.phone);
  }, [driver]);

  const hasActiveRequest = useMemo(() => {
    return allMyCalls.some(
      (call) =>
        call.solicitante.id === userId &&
        ["ABERTO", "EM ANDAMENTO", "AGUARDANDO_APROVACAO"].includes(call.status)
    );
  }, [allMyCalls, userId]);

  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
    const savedMutePreference = localStorage.getItem("notificationsMuted");
    setIsMuted(savedMutePreference === "true");
  }, []);

  useEffect(() => {
    if (driver && !isProfileComplete) {
      setActiveTab("profile");
    }
  }, [driver, isProfileComplete]);

  useEffect(() => {
    const prevCallIds = new Set(
      prevOpenSupportCallsRef.current.map((c) => c.id)
    );
    const newCalls = openSupportCalls.filter(
      (call) => !prevCallIds.has(call.id)
    );

    if (newCalls.length > 0 && driver?.status === "DISPONIVEL") {
      if (!isMuted) {
        const audio = new Audio("/shopee-ringtone.mp3");
        audio.play().catch((e) => console.error("Erro ao tocar o som:", e));
      }

      newCalls.forEach((newCall) => {
        if (!notifiedCallIds.current.has(newCall.id)) {
          sonnerToast.custom(
            () => (
              <div className="flex items-center gap-3 bg-white p-4 rounded-lg shadow-lg border">
                <img src={spxLogo} alt="SPX Logo" className="w-10 h-10" />
                <div>
                  <p className="font-bold text-gray-800">
                    Novo Apoio Disponível
                  </p>
                  <p className="text-sm text-gray-600">
                    Um novo chamado de {newCall.solicitante.name} está aberto.
                  </p>
                </div>
              </div>
            ),
            {
              duration: 10000,
            }
          );
          if (document.hidden && Notification.permission === "granted") {
            new Notification("Novo Apoio Disponível!", {
              body: `Um novo chamado de ${newCall.solicitante.name} está aberto.`,
              icon: spxLogo,
            });
            if ("vibrate" in navigator) {
              navigator.vibrate([200, 100, 200]);
            }
          }
          notifiedCallIds.current.add(newCall.id);
        }
      });
    }

    prevOpenSupportCallsRef.current = openSupportCalls;

    const openCallIds = new Set(openSupportCalls.map((c) => c.id));
    notifiedCallIds.current.forEach((id) => {
      if (!openCallIds.has(id)) {
        notifiedCallIds.current.delete(id);
      }
    });
  }, [openSupportCalls, driver?.status, isMuted]);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const driverDocRef = doc(db, "drivers", userId);
    const unsubscribeDriver = onSnapshot(driverDocRef, (doc) => {
      if (doc.exists()) {
        const driverData = { id: doc.id, ...doc.data() } as Driver;
        setDriver(driverData);

        if (!isProfileInitialized.current) {
          setName(driverData.name || "");
          setPhone(driverData.phone || "");

          const initialHub = driverData.hub || "";
          if (hubs.includes(initialHub)) {
            setHub(initialHub);
            setHubSearch(initialHub);
          } else {
            setHub("");
            setHubSearch("");
          }

          setVehicleType(driverData.vehicleType || "");
          isProfileInitialized.current = true;
        }
      } else {
        console.log("Documento do motorista não encontrado!");
      }
      setLoading(false);
    });

    const allDriversQuery = query(collection(db, "drivers"));
    const unsubscribeAllDrivers = onSnapshot(allDriversQuery, (snapshot) => {
      const driversData = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Driver)
      );
      setAllDrivers(driversData);
    });

    const myCallsQuery = query(
      collection(db, "supportCalls"),
      or(
        where("solicitante.id", "==", userId),
        where("assignedTo", "==", userId)
      )
    );
    const unsubscribeMyCalls = onSnapshot(myCallsQuery, (snapshot) => {
      const callsData = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as SupportCall)
      );
      callsData.sort((a, b) => {
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
      setAllMyCalls(callsData);
    });

    const openCallsQuery = query(
      collection(db, "supportCalls"),
      where("status", "==", "ABERTO")
    );
    const unsubscribeOpenCalls = onSnapshot(openCallsQuery, (snapshot) => {
      const openCallsData = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as SupportCall)
      );
      setOpenSupportCalls(
        openCallsData.filter((call) => call.solicitante.id !== userId)
      );
    });

    return () => {
      unsubscribeDriver();
      unsubscribeMyCalls();
      unsubscribeOpenCalls();
      unsubscribeAllDrivers();
    };
  }, [userId]);

  const updateDriver = async (
    driverId: string,
    updates: Partial<Omit<Driver, "id">>
  ) => {
    if (!driverId) return;
    const driverDocRef = doc(db, "drivers", driverId);
    await updateDoc(driverDocRef, updates);
  };

  const updateCall = async (
    id: string,
    updates: Partial<Omit<SupportCall, "id">>
  ) => {
    const callDocRef = doc(db, "supportCalls", id);
    await updateDoc(callDocRef, updates as any);
  };

  const addNewCall = async (
    newCall: Omit<SupportCall, "id" | "timestamp" | "solicitante">
  ) => {
    if (!driver) return;
    const callToAdd = {
      ...newCall,
      timestamp: serverTimestamp(),
      solicitante: {
        id: driver.id,
        name: driver.name,
        avatar: driver.avatar,
        initials: driver.initials,
        phone: driver.phone,
      },
    };
    await addDoc(collection(db, "supportCalls"), callToAdd as any);
  };

  const handleAvailabilityChange = (isAvailable: boolean) => {
    if (!isProfileComplete) {
      sonnerToast.error(
        "Complete seu perfil para alterar sua disponibilidade."
      );
      setActiveTab("profile");
      return;
    }
    if (!userId) return;
    const newStatus = isAvailable ? "DISPONIVEL" : "INDISPONIVEL";
    updateDriver(userId, { status: newStatus });
  };

  const handleAcceptCall = async (callId: string) => {
    if (!isProfileComplete) {
      sonnerToast.error("Complete seu perfil para aceitar um chamado.");
      setActiveTab("profile");
      return;
    }
    if (!userId || !driver) return;

    if (driver.status === "EM_ROTA") {
      sonnerToast.error("Ação não permitida", {
        description:
          "Você já está prestando um apoio e não pode aceitar outro no momento.",
      });
      return;
    }

    setAcceptingCallId(callId);
    try {
      await updateCall(callId, { assignedTo: userId, status: "EM ANDAMENTO" });
      await updateDriver(userId, { status: "EM_ROTA" });
    } catch (error) {
      console.error("Erro ao aceitar chamado:", error);
      sonnerToast.error("Erro", {
        description: "Não foi possível aceitar o chamado.",
      });
    } finally {
      setAcceptingCallId(null);
    }
  };

  const handleRequestApproval = async (callId: string) => {
    try {
      await updateCall(callId, { status: "AGUARDANDO_APROVACAO" });
      sonnerToast.success("Chamado enviado para aprovação do monitor.");
    } catch (error) {
      console.error("Erro ao enviar para aprovação:", error);
      sonnerToast.error("Falha ao enviar chamado para aprovação.");
    }
  };

  const handleCancelSupport = async (callId: string) => {
    if (!userId) return;
    await updateCall(callId, {
      assignedTo: deleteField(),
      status: "ABERTO",
    } as any);
    await updateDriver(userId, { status: "DISPONIVEL" });
  };

  const handleDeleteSupportRequest = async (callId: string) => {
    if (!userId) return;
    const callToCancel = allMyCalls.find((c) => c.id === callId);

    if (callToCancel && callToCancel.assignedTo) {
      await updateDriver(callToCancel.assignedTo, { status: "DISPONIVEL" });
    }

    await updateCall(callId, {
      status: "EXCLUIDO",
      deletedAt: serverTimestamp(),
    } as any);
  };

  const handleUpdateProfile = () => {
    if (!userId) return;

    if (phone.replace(/\D/g, "").length !== 11) {
      sonnerToast.error("O telefone deve ter 11 dígitos, incluindo o DDD.");
      return;
    }

    if (!hubs.includes(hub)) {
      sonnerToast.error(
        "Hub inválido. Por favor, selecione um Hub válido da lista."
      );
      return;
    }

    updateDriver(userId, {
      name,
      phone: phone.replace(/\D/g, ""),
      hub,
      vehicleType,
    });
    sonnerToast.success("Perfil atualizado com sucesso!");
  };

  const handleChangePassword = () => {
    sonnerToast.info("Funcionalidade de alterar senha a ser implementada.");
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    setIsUploading(true);
    const storage = getStorage();
    const storageRef = ref(storage, `avatars/${userId}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      () => {},
      (error) => {
        console.error("Upload failed:", error);
        sonnerToast.error("Falha ao enviar a imagem.");
        setIsUploading(false);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          updateDriver(userId, { avatar: downloadURL });
          setIsUploading(false);
        });
      }
    );
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setModalError("Geolocalização não é suportada pelo seu navegador.");
      return;
    }
    setIsLocating(true);
    setModalError("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation(`https://www.google.com/maps?q=${latitude},${longitude}`);
        setIsLocating(false);
      },
      () => {
        setModalError("Não foi possível obter a sua localização.");
        setIsLocating(false);
      }
    );
  };

  const handleSupportSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setModalError("");

    const formData = new FormData(e.currentTarget);
    const isBulky = formData.get("isBulky") === "on";
    const packageCount = Number(formData.get("packageCount"));

    if (packageCount < 20) {
      sonnerToast.error(
        "A solicitação de apoio só pode ser feita para 20 ou mais pacotes."
      );
      setIsSubmitting(false);
      return;
    }

    const informalDescription = `Preciso de apoio de transferência. Estou no hub ${formData.get(
      "hub"
    )}. Minha localização atual está disponível neste link: ${location}. Tenho ${packageCount} pacotes para a(s) região(ões) de ${deliveryRegions.join(
      ", "
    )}.
    Veículo(s) necessário(s): ${neededVehicles.join(", ")}. ${
      isBulky ? "Contém pacote volumoso." : ""
    }`;

    try {
      const prompt = `Aja como um assistente de logística. Um motorista descreveu um problema. Sua tarefa é reescrever a descrição de forma clara e profissional para um chamado de suporte.
      
        Descrição do motorista: "${informalDescription}"
        
        Retorne a sua resposta APENAS no formato JSON, seguindo este schema: {"description": "sua descrição profissional"}`;

      const apiKey = "AIzaSyAXV3wmwo0eMgx3Q3CuE0o2WfROU50jaaU";

      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      });

      if (!response.ok)
        throw new Error(`${response.statusText} (${response.status})`);
      const result = await response.json();
      const textPart = result?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!textPart)
        throw new Error("Não foi possível processar a resposta da IA.");

      const cleanedJsonString = textPart.replace(/```json|```/g, "").trim();

      const parsedJson = JSON.parse(cleanedJsonString);
      if (!parsedJson.description)
        throw new Error("A resposta da IA está incompleta.");

      const routeId = `SPX-${Date.now().toString().slice(-6)}`;

      let urgency: UrgencyLevel = "BAIXA";
      if (packageCount >= 100) {
        urgency = "URGENTE";
      } else if (packageCount >= 90) {
        urgency = "ALTA";
      } else if (packageCount >= 60) {
        urgency = "MEDIA";
      }

      const newCallData = {
        routeId: routeId,
        description: parsedJson.description,
        urgency: urgency,
        location: location,
        status: "ABERTO" as const,
        vehicleType: neededVehicles.join(", "),
        isBulky: isBulky,
        hub: formData.get("hub") as string,
      };
      await addNewCall(newCallData);
      setIsSupportModalOpen(false);
      setShowSuccessModal(true);
      setDeliveryRegions([""]);
      setNeededVehicles([""]);
    } catch (error: any) {
      console.error("Erro detalhado ao criar chamado:", error);
      if (error.message.includes("Failed to fetch")) {
        setModalError(
          "Falha de rede. Verifique a sua ligação à Internet e se a sua chave de API está correta e configurada para localhost."
        );
      } else {
        setModalError(`Erro: ${error.message}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCalls = useMemo(() => {
    const activeCalls = allMyCalls.filter((call) => {
      const hubMatch =
        globalHubFilter === "Todos os Hubs" || call.hub === globalHubFilter;
      return call.status !== "EXCLUIDO" && hubMatch;
    });

    if (historyFilter === "requester")
      return activeCalls.filter((call) => call.solicitante.id === userId);
    if (historyFilter === "provider")
      return activeCalls.filter((call) => call.assignedTo === userId);
    if (historyFilter === "inProgress")
      return activeCalls.filter((call) =>
        ["EM ANDAMENTO", "AGUARDANDO_APROVACAO"].includes(call.status)
      );
    return activeCalls;
  }, [allMyCalls, historyFilter, userId, globalHubFilter]);

  const filteredOpenCalls = useMemo(() => {
    return openSupportCalls.filter((call) => {
      const hubMatch =
        globalHubFilter === "Todos os Hubs" || call.hub === globalHubFilter;
      const searchMatch =
        !routeIdSearch ||
        (call.routeId
          ? call.routeId.toLowerCase().includes(routeIdSearch.toLowerCase())
          : false);
      return hubMatch && searchMatch;
    });
  }, [openSupportCalls, routeIdSearch, globalHubFilter]);

  const allHubs = useMemo(
    () =>
      [
        "Todos os Hubs",
        ...new Set(allDrivers.map((d) => d.hub).filter(Boolean)),
      ].sort(),
    [allDrivers]
  );

  const filteredHubs = useMemo(() => {
    if (!hubSearch) return hubs;
    return hubs.filter((h) =>
      h.toLowerCase().includes(hubSearch.toLowerCase())
    );
  }, [hubSearch]);

  const formatPhoneNumber = (value: string) => {
    if (!value) return "";
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(
      7,
      11
    )}`;
  };

  const activeCallForDriver = useMemo(() => {
    return (
      allMyCalls.find(
        (call) => call.solicitante.id === userId && call.status === "ABERTO"
      ) || null
    );
  }, [allMyCalls, userId]);

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

  const handleTouchStart = (e: React.TouchEvent) => {
    touchEndX.current = 0;
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === 0 || touchEndX.current === 0) return;
    const threshold = 50;
    const swipedLeft = touchStartX.current - touchEndX.current > threshold;
    const swipedRight = touchEndX.current - touchStartX.current > threshold;
    const currentIndex = TABS.findIndex((tab) => tab.id === activeTab);

    if (swipedLeft && currentIndex < TABS.length - 1) {
      setActiveTab(TABS[currentIndex + 1].id as TabId);
    } else if (swipedRight && currentIndex > 0) {
      setActiveTab(TABS[currentIndex - 1].id as TabId);
    }
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  const toggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    localStorage.setItem("notificationsMuted", String(newMutedState));
    if (!newMutedState) {
      const audio = new Audio("/shopee-ringtone.mp3");
      audio.volume = 0;
      audio.play().catch(() => {});
    }
    sonnerToast.success(
      newMutedState
        ? "Som das notificações desativado."
        : "Som das notificações ativado."
    );
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <LoaderCircle className="animate-spin text-orange-600" size={48} />
      </div>
    );
  if (!driver)
    return (
      <div className="flex items-center justify-center min-h-screen">
        Perfil não encontrado.
      </div>
    );

  const activeTabIndex = TABS.findIndex((tab) => tab.id === activeTab);

  return (
    <>
      <Toaster richColors position="top-center" />
      <div className="bg-orange-50 min-h-dvh font-sans">
        <div className="max-w-2xl mx-auto flex flex-col h-full">
          {!isProfileComplete && (
            <div className="p-4 sticky top-0 z-10">
              <div
                className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 rounded-lg shadow-md"
                role="alert"
              >
                <p className="font-bold">Perfil Incompleto!</p>
                <p className="text-sm">
                  Por favor, preencha todas as informações do seu perfil para
                  poder solicitar ou prestar apoio.
                </p>
              </div>
            </div>
          )}
          <div className="p-4 md:p-6">
            <ProfileHeaderCard
              driver={driver}
              isUploading={isUploading}
              onEditClick={() => fileInputRef.current?.click()}
              activeCall={activeCallForDriver}
            />
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleAvatarUpload}
            className="hidden"
            accept="image/*"
          />

          <div className="bg-white rounded-t-lg shadow-md flex-grow flex flex-col overflow-hidden min-h-0">
            <div className="px-4 pt-4">
              <label className="text-sm font-medium text-gray-700">
                Filtrar por Hub
              </label>
              <select
                value={globalHubFilter}
                onChange={(e) => setGlobalHubFilter(e.target.value)}
                className="w-full p-2 mt-1 border rounded-md bg-white shadow-sm"
              >
                {allHubs.map((hub) => (
                  <option key={hub} value={hub}>
                    {hub}
                  </option>
                ))}
              </select>
            </div>
            <div className="border-b overflow-x-auto whitespace-nowrap mt-4">
              <div className="flex">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      if (!isProfileComplete && tab.id !== "profile") {
                        sonnerToast.error(
                          "Complete seu perfil para acessar esta aba."
                        );
                        return;
                      }
                      setActiveTab(tab.id as TabId);
                    }}
                    disabled={!isProfileComplete && tab.id !== "profile"}
                    className={`flex-grow p-3 text-center text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors duration-300 ${
                      activeTab === tab.id
                        ? "border-b-2 border-orange-600 text-orange-600"
                        : "text-gray-500 hover:bg-gray-100"
                    } ${
                      !isProfileComplete && tab.id !== "profile"
                        ? "cursor-not-allowed opacity-50"
                        : ""
                    }`}
                  >
                    {tab.icon}
                    <span className="capitalize">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div
              className="flex-1 overflow-hidden"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div
                ref={swipeContainerRef}
                className="flex h-full transition-transform duration-300 ease-in-out"
                style={{ transform: `translateX(-${activeTabIndex * 100}%)` }}
              >
                {/* Availability Tab */}
                <div className="w-full flex-shrink-0 overflow-y-auto p-4 space-y-6">
                  <div className="bg-white p-6 rounded-lg shadow-md text-center space-y-4">
                    <h3 className="text-lg font-bold">
                      Estou disponível para apoio?
                    </h3>
                    <div className="flex items-center justify-center space-x-4">
                      <button
                        onClick={() => handleAvailabilityChange(true)}
                        className={`w-24 py-2 text-sm font-semibold rounded-lg ${
                          driver.status === "DISPONIVEL"
                            ? "bg-green-600 text-white"
                            : "bg-gray-200"
                        }`}
                      >
                        Sim
                      </button>
                      <button
                        onClick={() => handleAvailabilityChange(false)}
                        className={`w-24 py-2 text-sm font-semibold rounded-lg ${
                          driver.status !== "DISPONIVEL"
                            ? "bg-red-600 text-white"
                            : "bg-gray-200"
                        }`}
                      >
                        Não
                      </button>
                    </div>
                    <p className="text-xs text-gray-400">
                      Use estes botões para informar o seu status.
                    </p>
                  </div>
                  {driver.status === "DISPONIVEL" && (
                    <div>
                      <h3 className="text-lg font-bold text-gray-800 mb-4">
                        Chamados de Apoio Disponíveis
                      </h3>
                      <div className="relative mb-4">
                        <Search
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                          size={18}
                        />
                        <input
                          type="text"
                          placeholder="Pesquisar por ID da Rota..."
                          value={routeIdSearch}
                          onChange={(e) => setRouteIdSearch(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border rounded-lg"
                        />
                      </div>
                      {filteredOpenCalls.length > 0 ? (
                        <div className="space-y-4">
                          {filteredOpenCalls.map((call) => (
                            <OpenCallCard
                              key={call.id}
                              call={call}
                              currentDriverName={driver.name}
                              onAccept={handleAcceptCall}
                              acceptingCallId={acceptingCallId}
                            />
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-gray-500 pt-4">
                          Nenhum chamado de apoio aberto.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Support Tab */}
                <div className="w-full flex-shrink-0 overflow-y-auto p-4">
                  <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="text-red-500" />
                      <h3 className="text-lg font-bold">
                        Solicitar Apoio de Transferência
                      </h3>
                    </div>
                    <button
                      onClick={() => {
                        if (hasActiveRequest) {
                          sonnerToast.error(
                            "Você já possui uma solicitação de apoio ativa.",
                            {
                              description:
                                "Cancele a solicitação anterior para criar uma nova.",
                            }
                          );
                          return;
                        }
                        if (!isProfileComplete) {
                          sonnerToast.error(
                            "Complete seu perfil para solicitar apoio."
                          );
                          setActiveTab("profile");
                          return;
                        }
                        setModalError("");
                        setIsSupportModalOpen(true);
                      }}
                      className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold py-3 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={!isProfileComplete || hasActiveRequest}
                    >
                      PRECISO DE APOIO
                    </button>
                  </div>
                </div>

                {/* Active Calls Tab */}
                <div className="w-full flex-shrink-0 overflow-y-auto p-4 space-y-4">
                  <h3 className="text-lg font-bold text-gray-800">
                    Histórico de Chamados
                  </h3>
                  <div className="flex flex-wrap gap-2 border-b pb-2">
                    <button
                      onClick={() => setHistoryFilter("all")}
                      className={`px-3 py-1 text-sm rounded-full ${
                        historyFilter === "all"
                          ? "bg-orange-600 text-white"
                          : "bg-gray-200"
                      }`}
                    >
                      Todos
                    </button>
                    <button
                      onClick={() => setHistoryFilter("inProgress")}
                      className={`px-3 py-1 text-sm rounded-full ${
                        historyFilter === "inProgress"
                          ? "bg-orange-600 text-white"
                          : "bg-gray-200"
                      }`}
                    >
                      Em Andamento
                    </button>
                    <button
                      onClick={() => setHistoryFilter("requester")}
                      className={`px-3 py-1 text-sm rounded-full ${
                        historyFilter === "requester"
                          ? "bg-orange-600 text-white"
                          : "bg-gray-200"
                      }`}
                    >
                      Meus Pedidos
                    </button>
                    <button
                      onClick={() => setHistoryFilter("provider")}
                      className={`px-3 py-1 text-sm rounded-full ${
                        historyFilter === "provider"
                          ? "bg-orange-600 text-white"
                          : "bg-gray-200"
                      }`}
                    >
                      Meus Apoios
                    </button>
                  </div>
                  {filteredCalls.length > 0 ? (
                    <div className="space-y-4">
                      {filteredCalls.map((call) => (
                        <DriverCallHistoryCard
                          key={call.id}
                          call={call}
                          currentDriver={driver}
                          allDrivers={allDrivers}
                          onCancelSupport={handleCancelSupport}
                          onDeleteSupportRequest={handleDeleteSupportRequest}
                          onRequestApproval={handleRequestApproval}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 pt-4">
                      Nenhum chamado encontrado.
                    </p>
                  )}
                </div>

                {/* Profile Tab */}
                <div className="w-full flex-shrink-0 overflow-y-auto p-4">
                  <div className="space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                      <h3 className="text-lg font-semibold mb-4">
                        Configurações
                      </h3>
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700">
                          Som das notificações
                        </label>
                        <button
                          onClick={toggleMute}
                          className="p-2 rounded-full hover:bg-gray-200"
                        >
                          {isMuted ? (
                            <VolumeX size={20} />
                          ) : (
                            <Volume2 size={20} />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                      <h3 className="text-lg font-semibold mb-4">
                        Editar Perfil
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nome Completo
                          </label>
                          <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full p-2 border rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Telefone (WhatsApp)
                          </label>
                          <input
                            type="text"
                            value={formatPhoneNumber(phone)}
                            onChange={(e) => {
                              const digits = e.target.value.replace(/\D/g, "");
                              if (digits.length <= 11) {
                                setPhone(digits);
                              }
                            }}
                            className="w-full p-2 border rounded-md"
                            placeholder="(XX) XXXXX-XXXX"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Hub de Atuação
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
                              onBlur={() =>
                                setTimeout(
                                  () => setIsHubDropdownOpen(false),
                                  150
                                )
                              }
                              className="w-full p-2 border rounded-md pr-10"
                              placeholder="Pesquisar Hub..."
                            />
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            {isHubDropdownOpen && filteredHubs.length > 0 && (
                              <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                                {filteredHubs.map((h) => (
                                  <div
                                    key={h}
                                    className="p-2 hover:bg-gray-100 cursor-pointer"
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
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tipo de Veículo
                          </label>
                          <select
                            value={vehicleType}
                            onChange={(e) => setVehicleType(e.target.value)}
                            className="w-full p-2 border rounded-md"
                          >
                            <option value="">Selecione seu veículo</option>
                            {vehicleTypesList.map((v) => (
                              <option key={v} value={v}>
                                {v.charAt(0).toUpperCase() + v.slice(1)}
                              </option>
                            ))}
                          </select>
                        </div>
                        <button
                          onClick={handleUpdateProfile}
                          className="w-full bg-blue-500 text-white font-bold py-3 rounded-lg hover:bg-blue-600"
                        >
                          Salvar Alterações
                        </button>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm">
                      <h3 className="text-lg font-semibold mb-4">
                        Alterar Senha
                      </h3>
                      <div className="space-y-4">
                        <div className="relative">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Senha Atual
                          </label>
                          <input
                            type={showPassword ? "text" : "password"}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full p-2 border rounded-md pr-10"
                          />
                          <button
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 top-6 pr-3 flex items-center text-gray-500"
                          >
                            {showPassword ? (
                              <EyeOff size={20} />
                            ) : (
                              <Eye size={20} />
                            )}
                          </button>
                        </div>
                        <div className="relative">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nova Senha
                          </label>
                          <input
                            type={showPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full p-2 border rounded-md pr-10"
                          />
                        </div>
                        <div className="relative">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Confirmar Nova Senha
                          </label>
                          <input
                            type={showPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full p-2 border rounded-md pr-10"
                          />
                        </div>
                        <button
                          onClick={handleChangePassword}
                          className="w-full bg-gray-700 text-white font-bold py-3 rounded-lg hover:bg-gray-800"
                        >
                          Alterar Senha
                        </button>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm">
                      <button
                        onClick={() => auth.signOut()}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600"
                      >
                        <LogOut size={16} />
                        Sair da Conta
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {isSupportModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                Solicitar Apoio de Transferência
              </h2>
              <button
                onClick={() => setIsSupportModalOpen(false)}
                className="p-1 rounded-full hover:bg-gray-200"
              >
                <X size={24} className="text-gray-600" />
              </button>
            </div>
            <form onSubmit={handleSupportSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="hub"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Selecione o seu Hub
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <select
                    id="hub"
                    name="hub"
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none"
                    required
                  >
                    <option value="">Selecione...</option>
                    {hubs.map((hub) => (
                      <option key={hub} value={hub}>
                        {hub}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label
                  htmlFor="currentLocation"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Sua Localização Atual
                </label>
                <div className="flex items-center space-x-2">
                  <div className="relative flex-grow">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      id="currentLocation"
                      name="currentLocation"
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Clique para obter ou digite"
                      className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      required
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={isLocating}
                    className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300"
                  >
                    {isLocating ? (
                      <LoaderCircle className="animate-spin" />
                    ) : (
                      <MapPin />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label
                  htmlFor="packageCount"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Número de Pacotes
                </label>
                <div className="relative">
                  <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    id="packageCount"
                    name="packageCount"
                    type="number"
                    min="0"
                    placeholder="Ex: 15"
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Região de Entrega dos Pacotes
                </label>
                {deliveryRegions.map((region, index) => (
                  <div key={index} className="flex items-center space-x-2 mb-2">
                    <div className="relative flex-grow">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={region}
                        onChange={(e) =>
                          handleFieldChange(
                            index,
                            e.target.value,
                            setDeliveryRegions
                          )
                        }
                        placeholder="Ex: Zona Leste, São Paulo"
                        className="w-full pl-10 pr-4 py-2 border rounded-lg"
                        required
                      />
                    </div>
                    {deliveryRegions.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          handleRemoveField(index, setDeliveryRegions)
                        }
                        className="text-red-500"
                      >
                        <MinusCircle size={20} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => handleAddField(setDeliveryRegions)}
                  className="flex items-center space-x-1 text-sm text-blue-600"
                >
                  <PlusCircle size={16} />
                  <span>Adicionar outra região</span>
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Veículo Necessário
                </label>
                {neededVehicles.map((vehicle, index) => (
                  <div key={index} className="flex items-center space-x-2 mb-2">
                    <div className="relative flex-grow">
                      <Truck className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <select
                        value={vehicle}
                        onChange={(e) =>
                          handleFieldChange(
                            index,
                            e.target.value,
                            setNeededVehicles
                          )
                        }
                        className="w-full pl-10 pr-4 py-2 border rounded-lg appearance-none"
                        required
                      >
                        <option value="">Selecione o veículo...</option>
                        {vehicleTypesList.map((v) => (
                          <option key={v} value={v}>
                            {v.charAt(0).toUpperCase() + v.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                    {neededVehicles.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          handleRemoveField(index, setNeededVehicles)
                        }
                        className="text-red-500"
                      >
                        <MinusCircle size={20} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => handleAddField(setNeededVehicles)}
                  className="flex items-center space-x-1 text-sm text-blue-600"
                >
                  <PlusCircle size={16} />
                  <span>Adicionar outro veículo</span>
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  id="isBulky"
                  name="isBulky"
                  type="checkbox"
                  className="h-4 w-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                />
                <label
                  htmlFor="isBulky"
                  className="text-sm font-medium text-gray-700"
                >
                  Contém pacote volumoso
                </label>
              </div>

              {modalError && (
                <p className="text-sm text-center text-red-600 bg-red-100 p-2 rounded-md">
                  {modalError}
                </p>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center py-2 text-white bg-orange-600 rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors disabled:bg-orange-300"
                >
                  {isSubmitting ? (
                    <LoaderCircle className="animate-spin" />
                  ) : (
                    "Enviar Solicitação"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md text-center">
            <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">Sucesso!</h2>
            <p className="text-gray-600 mb-6">
              Apoio solicitado com sucesso, aguarde o contato de um Driver ou
              Monitor.
            </p>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full py-2 px-4 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </>
  );
};
