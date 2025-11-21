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
  ExternalLink,
  CalendarClock,
  BookOpen, // <<<--- 1. ÍCONE ADICIONADO
} from "lucide-react";
import { auth, db, storage } from "../firebase";
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
  getDocs,
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
import spxLogo from "/spx-logo.png";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "./ui/card";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/button";

// --- 2. IMPORTAÇÕES ADICIONADAS (CORRIGINDO OS ERROS) ---
import { cn } from "../lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
import { Chatbot } from "./Chatbot"; // Importa o Chatbot que criamos
// --- FIM DAS IMPORTAÇÕES ADICIONADAS ---

interface DriverInterfaceProps {
  driver: Driver;
}

const hubs = [
  "LM Hub_PR_Londrina_Parque ABC II",
  "LM Hub_PR_Maringa",
  "LM Hub_PR_Foz do Iguaçu",
  "LM Hub_PR_Cascavel",
];
const vehicleTypesList = ["moto", "carro passeio", "carro utilitario", "van"];
const sessionNotifiedCallIds = new Set<string>();

const formatTimestamp = (
  timestamp: Timestamp | Date | null | undefined
): string => {
  if (!timestamp) return "Data indisponível";
  const date = timestamp instanceof Timestamp ? timestamp.toDate() : timestamp;
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return "Data inválida";
  }
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

export const DriverInterface: React.FC<DriverInterfaceProps> = ({ driver }) => {
  // --- Estados ---
  const [allMyCalls, setAllMyCalls] = useState<SupportCall[]>([]);
  const [openSupportCalls, setOpenSupportCalls] = useState<SupportCall[]>([]);
  const [allDrivers, setAllDrivers] = useState<Driver[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [initialTabSet, setInitialTabSet] = useState(false);
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
  const [hubSearch, setHubSearch] = useState("");
  const [shopeeId, setShopeeId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isHubDropdownOpen, setIsHubDropdownOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const swipeContainerRef = useRef<HTMLDivElement>(null);
  const [acceptingCallId, setAcceptingCallId] = useState<string | null>(null);
  const userId = auth.currentUser?.uid;
  const [routeIdSearch, setRouteIdSearch] = useState("");
  const [globalHubFilter, setGlobalHubFilter] = useState("Todos os Hubs");
  const [isMuted, setIsMuted] = useState(false);
  const [isProfileWarningVisible, setIsProfileWarningVisible] = useState(true);
  const [isReauthModalOpen, setIsReauthModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [reauthError, setReauthError] = useState("");
  const [isReauthenticating, setIsReauthenticating] = useState(false);
  const isInitialOpenCallsLoad = useRef(true);

  // --- 3. Tipos e Memos ATUALIZADOS ---
  const TABS = useMemo(
    () => [
      { id: "availability", label: "Disponibilidade", icon: <Zap size={16} /> },
      { id: "support", label: "Apoio", icon: <AlertTriangle size={16} /> },
      { id: "activeCalls", label: "Chamados", icon: <Clock size={16} /> },
      { id: "tutorial", label: "Ajuda", icon: <BookOpen size={16} /> }, // <<<--- ABA AJUDA (TUTORIAL) ADICIONADA
      { id: "profile", label: "Perfil", icon: <User size={16} /> },
    ],
    []
  );

  type TabId =
    | "availability"
    | "support"
    | "activeCalls"
    | "tutorial" // <<<--- TIPO ATUALIZADO
    | "profile";

  const [activeTab, setActiveTab] = useState<TabId>("profile");

  // --- CONTEÚDO DOS TUTORIAIS (Extraído do PDF) ---
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
      // CORREÇÃO: Use crases (`) para criar uma única string com quebra de linha.
      answer: `Clique nos 3 pontinhos dentro do app (...) e após isso clique em 'importar planilha' e faça o upload do arquivo.

Selecione a opção 'Sequencia' para roteirizar da forma correta, Após isto já estará organizado. :)`,
    },
  ];
  // --- FIM DO CONTEÚDO DOS TUTORIAIS ---

  const isProfileComplete = useMemo(() => {
    if (!driver) return false;
    return !!(
      driver.hub &&
      driver.vehicleType &&
      driver.phone &&
      driver.name &&
      shopeeId &&
      shopeeId !== "Carregando..." &&
      shopeeId !== "Não encontrado" &&
      shopeeId !== "Erro ao buscar"
    );
  }, [driver, shopeeId]);

  const hasActiveRequest = useMemo(() => {
    return allMyCalls.some(
      (call) =>
        call.solicitante.id === userId &&
        ["ABERTO", "EM ANDAMENTO", "AGUARDANDO_APROVACAO"].includes(call.status)
    );
  }, [allMyCalls, userId]);

  // --- Funções Handler (handleUpdateProfile, handleLogin, etc.) ---

  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
    const savedMutePreference = localStorage.getItem("notificationsMuted");
    setIsMuted(savedMutePreference === "true");
  }, []);

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

      const fetchShopeeId = async () => {
        if (driver.uid) {
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
              const driverDoc = querySnapshot.docs[0];
              setShopeeId(driverDoc.id);
            } else {
              setShopeeId("Não encontrado");
            }
          } catch (error) {
            console.error("Erro ao buscar ID de cadastro:", error);
            setShopeeId("Erro ao buscar");
          }
        }
      };
      fetchShopeeId();
    }
  }, [driver]);

  const triggerNotificationRef = useRef((_newCall: SupportCall) => {});

  useEffect(() => {
    triggerNotificationRef.current = (newCall: SupportCall) => {
      if (
        driver?.status !== "DISPONIVEL" ||
        sessionNotifiedCallIds.has(newCall.id)
      ) {
        return;
      }

      if (!isMuted) {
        const audio = new Audio("/shopee-ringtone.mp3");
        audio.play().catch((e) => console.error("Erro ao tocar o som:", e));
      }

      sonnerToast.custom(
        (t) => (
          <div className="flex w-full max-w-sm items-start gap-4 rounded-lg bg-card p-4 shadow-lg ring-1 ring-border">
            <img
              src={spxLogo}
              alt="SPX Logo"
              className="mt-1 h-10 w-10 flex-shrink-0"
            />
            <div className="flex-1">
              <p className="font-semibold text-foreground">
                Novo Apoio Disponível
              </p>
              <p className="text-sm text-muted-foreground">
                Um novo chamado de {newCall.solicitante.name} está aberto.
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

      if (document.hidden && Notification.permission === "granted") {
        new Notification("Novo Apoio Disponível!", {
          body: `Um novo chamado de ${newCall.solicitante.name} está aberto.`,
          icon: spxLogo,
        });
        if ("vibrate" in navigator) {
          navigator.vibrate([200, 100, 200]);
        }
      }

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
      snapshot.docChanges().forEach((change) => {
        const callData = {
          id: change.doc.id,
          ...change.doc.data(),
        } as SupportCall;

        if (callData.solicitante.id !== userId) {
          if (change.type === "added") {
            if (!isInitialOpenCallsLoad.current) {
              triggerNotificationRef.current(callData);
            }
          }
          if (change.type === "removed") {
            sessionNotifiedCallIds.delete(callData.id);
          }
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
  }, [userId]);

  const updateDriver = async (
    driverId: string,
    updates: Partial<Omit<Driver, "uid">>
  ) => {
    if (!driverId) return;
    const driverDocRef = doc(db, "motoristas_pre_aprovados", driverId);
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

    const getInitials = (name: string) => {
      if (!name) return "??";
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2);
    };

    const driverName = driver.name || "Nome não definido";

    const callToAdd = {
      ...newCall,
      timestamp: serverTimestamp(),
      solicitante: {
        id: driver.uid,
        name: driverName,
        avatar: driver.avatar || null,
        initials: driver.initials || getInitials(driverName),
        phone: driver.phone || null,
      },
    };

    await addDoc(collection(db, "supportCalls"), callToAdd as any);
  };

  const handleAvailabilityChange = (isAvailable: boolean) => {
    if (!isProfileComplete) {
      sonnerToast.error(
        "Complete seu perfil para alterar sua disponibilidade."
      );
      return;
    }

    if (!driver || !shopeeId || shopeeId.includes("...")) {
      sonnerToast.error(
        "Não foi possível identificar seu perfil. Tente recarregar a página."
      );
      return;
    }

    const newStatus = isAvailable ? "DISPONIVEL" : "INDISPONIVEL";
    updateDriver(shopeeId, { status: newStatus });
  };

  const handleAcceptCall = async (callId: string) => {
    if (!isProfileComplete) {
      sonnerToast.error("Complete seu perfil para aceitar um chamado.");
      setActiveTab("profile");
      return;
    }

    if (!userId || !driver || !shopeeId) return;

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
      if (shopeeId && !shopeeId.includes("...")) {
        await updateDriver(shopeeId, { status: "EM_ROTA" });
      }
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
    if (!userId || !shopeeId) return;

    await updateCall(callId, {
      assignedTo: deleteField(),
      status: "ABERTO",
    } as any);

    if (shopeeId && !shopeeId.includes("...")) {
      await updateDriver(shopeeId, { status: "DISPONIVEL" });
    }
    sonnerToast.success("Apoio cancelado com sucesso.");
  };

  const handleDeleteSupportRequest = async (callId: string) => {
    if (!userId) return;

    const callToCancel = allMyCalls.find((c) => c.id === callId);

    if (callToCancel && callToCancel.assignedTo) {
      const assignedDriver = allDrivers.find(
        (d) => d.uid === callToCancel.assignedTo
      );

      if (assignedDriver) {
        const assignedDriverDocId = assignedDriver.uid;
        await updateDriver(assignedDriverDocId, { status: "DISPONIVEL" });
      }
    }

    await updateCall(callId, {
      status: "EXCLUIDO",
      deletedAt: serverTimestamp(),
    } as any);

    sonnerToast.success("Solicitação de apoio cancelada com sucesso.");
  };

  const handleUpdateProfile = () => {
    if (!driver || !shopeeId || shopeeId.includes("...")) {
      sonnerToast.error(
        "Não foi possível identificar seu perfil. Tente recarregar a página."
      );
      return;
    }

    const formattedPhone = phone.replace(/\D/g, "");

    if (formattedPhone.length !== 11) {
      sonnerToast.error("O telefone deve ter 11 dígitos, incluindo o DDD.");
      return;
    }

    if (!hubs.includes(hub)) {
      sonnerToast.error(
        "Hub inválido. Por favor, selecione um Hub válido da lista."
      );
      return;
    }

    const updates = {
      name,
      phone: formattedPhone,
      hub,
      vehicleType,
    };

    updateDriver(shopeeId, updates);
    sonnerToast.success("Perfil atualizado com sucesso!");
    setIsProfileWarningVisible(false);
  };

  const handleChangePassword = () => {
    if (newPassword !== confirmPassword) {
      sonnerToast.error("As novas senhas não coincidem.");
      return;
    }

    if (newPassword.length < 6) {
      sonnerToast.error("A nova senha deve ter no mínimo 6 caracteres.");
      return;
    }

    const user = auth.currentUser;

    if (user && !user.providerData.some((p) => p.providerId === "password")) {
      sonnerToast.error(
        "Você não pode alterar a senha de contas logadas com o Google."
      );
      return;
    }

    setIsReauthModalOpen(true);
  };

  const handleReauthenticateAndChange = async () => {
    const user = auth.currentUser;

    if (!user || !user.email) {
      setReauthError(
        "Usuário não encontrado. Por favor, faça login novamente."
      );
      return;
    }

    setIsReauthenticating(true);
    setReauthError("");

    try {
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword
      );
      await reauthenticateWithCredential(user, credential);

      await updatePassword(user, newPassword);

      sonnerToast.success("Senha alterada com sucesso!");
      setIsReauthModalOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      if (error.code === "auth/wrong-password") {
        setReauthError("Senha atual incorreta. Tente novamente.");
      } else {
        setReauthError("Ocorreu um erro. Tente novamente mais tarde.");
        console.error("Erro na reautenticação:", error);
      }
    } finally {
      setIsReauthenticating(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !driver || !shopeeId) return;

    setIsUploading(true);

    if (driver.avatar) {
      try {
        const oldAvatarRef = ref(storage, driver.avatar);
        await deleteObject(oldAvatarRef);
      } catch (error) {
        console.warn(
          "Erro ao deletar avatar antigo. Pode ser que não exista, ignorando:",
          error
        );
      }
    }

    const storageRef = ref(storage, `avatars/${shopeeId}/avatar.jpg`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      () => {},
      (error) => {
        console.error("Falha no upload:", error);
        sonnerToast.error("Falha no upload", { description: error.message });
        setIsUploading(false);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          if (shopeeId) {
            updateDriver(shopeeId, { avatar: downloadURL });
          }
          sonnerToast.success("Foto de perfil atualizada com sucesso!");
          setIsUploading(false);
        });
      }
    );
  };

  const handleSupportSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setModalError("");

    const user = auth.currentUser;
    if (!user || !driver) {
      setModalError("Erro: Usuário não autenticado. Faça login novamente.");
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData(e.currentTarget);
    const isBulky = formData.get("isBulky") === "on";
    const packageCount = Number(formData.get("packageCount"));
    const selectedHub = formData.get("hub") as string;
    const selectedDeliveryRegions = deliveryRegions.filter(Boolean);
    const selectedNeededVehicles = neededVehicles.filter(Boolean);

    if (packageCount < 20) {
      sonnerToast.error(
        "A solicitação de apoio só pode ser feita para 20 ou mais pacotes."
      );
      setIsSubmitting(false);
      return;
    }

    if (
      !location ||
      !selectedHub ||
      selectedDeliveryRegions.length === 0 ||
      selectedNeededVehicles.length === 0
    ) {
      setModalError("Por favor, preencha todos os campos obrigatórios.");
      setIsSubmitting(false);
      return;
    }

    const informalDescription = `Preciso de apoio de transferência. Estou no hub ${selectedHub}. Minha localização atual está disponível neste link: ${location}. Tenho ${packageCount} pacotes para a(s) região(ões) de ${selectedDeliveryRegions.join(
      ", "
    )}. Veículo(s) necessário(s): ${selectedNeededVehicles.join(", ")}. ${
      isBulky ? "Contém pacote volumoso." : ""
    }`;

    const solicitanteData = {
      id: driver.uid,
      name: driver.name || "Nome não definido",
      avatar: driver.avatar || null,
      initials: driver.initials || "??",
      phone: driver.phone || null,
    };

    const routeId = `SPX-${Date.now().toString().slice(-6)}`;

    let urgency: UrgencyLevel = "BAIXA";
    if (packageCount >= 100) {
      urgency = "URGENTE";
    } else if (packageCount >= 90) {
      urgency = "ALTA";
    } else if (packageCount >= 60) {
      urgency = "MEDIA";
    }

    const ticketPayload = {
      prompt: informalDescription,
      solicitante: solicitanteData,
      location: location,
      hub: selectedHub,
      vehicleType: selectedNeededVehicles.join(", "),
      isBulky: isBulky,
      routeId: routeId,
      urgency: urgency,
      packageCount: packageCount,
      deliveryRegions: selectedDeliveryRegions,
    };

    try {
      const idToken = await user.getIdToken();
      const apiUrl = import.meta.env.VITE_API_URL;

      if (!apiUrl) {
        setModalError(
          "Erro: VITE_API_URL não está configurada no .env do frontend."
        );
        setIsSubmitting(false);
        return;
      }

      const response = await fetch(`${apiUrl}/tickets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(ticketPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Falha ao criar o ticket no backend."
        );
      }

      setIsSupportModalOpen(false);
      setShowSuccessModal(true);
      setDeliveryRegions([""]);
      setNeededVehicles([""]);
    } catch (error: any) {
      console.error("Erro detalhado ao criar chamado:", error);
      setModalError(`Erro: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
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

  const activeTabIndex = TABS.findIndex((tab) => tab.id === activeTab);

  // --- COMPONENTES DEFINIDOS AQUI DENTRO ---

  const getUrgencyInfo = (urgency: UrgencyLevel | undefined) => {
    switch (urgency) {
      case "MEDIA":
        return {
          text: "Média",
          className:
            "bg-blue-500/10 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 border-blue-500/20",
        };
      case "ALTA":
        return {
          text: "Alta",
          className:
            "bg-yellow-500/10 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300 border-yellow-500/20",
        };
      case "URGENTE":
        return {
          text: "Urgente",
          className:
            "bg-red-500/10 text-red-700 dark:bg-red-900/50 dark:text-red-300 border-red-500/20",
        };
      case "BAIXA":
      default:
        return {
          text: "Baixa",
          className:
            "bg-gray-500/10 text-gray-700 dark:bg-gray-900/50 dark:text-gray-300 border-gray-500/20",
        };
    }
  };

  const UrgencyBadge = ({ urgency }: { urgency: UrgencyLevel | undefined }) => {
    const { text, className } = getUrgencyInfo(urgency);
    return (
      <Badge
        variant={"secondary"}
        className={`text-xs font-semibold rounded-full px-2.5 py-0.5 ${className}`}
      >
        {text}
      </Badge>
    );
  };

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
        activeCall.solicitante.id === driver.uid &&
        activeCall.status === "ABERTO"
      ) {
        return {
          text: "Aguardando Apoio",
          color: "bg-yellow-100 dark:bg-yellow-900/50",
          textColor: "text-yellow-700 dark:text-yellow-300",
        };
      }

      switch (driver.status) {
        case "DISPONIVEL":
          return {
            text: "Disponível",
            color: "bg-green-100 dark:bg-green-900/50",
            textColor: "text-green-700 dark:text-green-300",
          };
        case "INDISPONIVEL":
          return {
            text: "Indisponível",
            color: "bg-red-100 dark:bg-red-900/50",
            textColor: "text-red-700 dark:text-red-300",
          };
        case "EM_ROTA":
          return {
            text: "Prestando Apoio",
            color: "bg-blue-100 dark:bg-blue-900/50",
            textColor: "text-blue-700 dark:text-blue-300",
          };
        default:
          return {
            text: "Offline",
            color: "bg-gray-200 dark:bg-gray-700",
            textColor: "text-gray-600 dark:text-gray-300",
          };
      }
    };

    const statusInfo = getStatusInfo();

    return (
      <div className="relative mb-16">
        <div className="bg-primary rounded-xl shadow-lg p-6 pt-24 text-primary-foreground text-center relative overflow-hidden">
          <div className="absolute -bottom-12 -right-12 w-36 h-36 bg-white/5 rounded-full opacity-50"></div>
          <div className="absolute top-0 -left-16 w-28 h-28 bg-white/5 rounded-full opacity-50"></div>
          <h2 className="text-3xl font-bold mt-2">{driver.name}</h2>
          <div className="text-sm opacity-90 mt-4 space-y-2">
            <p className="flex items-center justify-center gap-2">
              <Building size={16} className="opacity-80" />{" "}
              {driver.hub || "Hub não definido"}
            </p>
            <p className="flex items-center justify-center gap-2">
              <Phone size={16} className="opacity-80" />{" "}
              {formatPhoneNumberSimple(driver.phone) || "Telefone não definido"}
            </p>
            <p className="flex items-center justify-center gap-2 capitalize">
              <Truck size={16} className="opacity-80" />{" "}
              {driver.vehicleType || "Veículo não definido"}
            </p>
          </div>
          <Badge
            className={`mt-6 px-4 py-1.5 text-xs font-semibold rounded-full ${statusInfo.color} ${statusInfo.textColor} hover:${statusInfo.color}`}
          >
            {statusInfo.text}
          </Badge>
        </div>

        <div className="absolute -top-14 left-1/2 -translate-x-1/2 group">
          <div className="relative w-28 h-28 rounded-full bg-background border-4 border-background shadow-lg flex items-center justify-center overflow-hidden">
            {driver.avatar ? (
              <img
                src={driver.avatar}
                alt={driver.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-4xl font-bold text-primary">
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
                className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 flex items-center justify-center transition-opacity opacity-0 group-hover:opacity-100 cursor-pointer rounded-full"
              >
                <Camera className="text-white" size={36} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const DriverCallHistoryCard = ({ call }: { call: SupportCall }) => {
    const isRequester = call.solicitante.id === userId;
    const otherPartyId = isRequester ? call.assignedTo : call.solicitante.id;
    const otherParty = allDrivers.find((d) => d.uid === otherPartyId);

    let statusVariant: "default" | "secondary" | "destructive" | "outline" =
      "default";
    let statusText = "Desconhecido";
    let title = "Chamado";

    if (isRequester) {
      title = "Pedido de Apoio";
      if (call.status === "ABERTO") {
        statusText = "Aguardando Apoio";
        statusVariant = "default";
      } else if (call.status === "AGUARDANDO_APROVACAO") {
        statusText = "Aguardando Aprovação";
        statusVariant = "secondary";
      } else if (call.status === "EM ANDAMENTO") {
        statusText = `Recebendo Apoio de ${otherParty?.name || "Motorista"}`;
        statusVariant = "default";
      } else if (call.status === "CONCLUIDO") {
        statusText = "Concluído";
        statusVariant = "outline";
      }
    } else {
      title = `Apoio a ${call.solicitante.name}`;
      if (call.status === "EM ANDAMENTO") {
        statusText = "Prestando Apoio";
        statusVariant = "default";
      } else if (call.status === "AGUARDANDO_APROVACAO") {
        statusText = "Aguardando Aprovação";
        statusVariant = "secondary";
      } else if (call.status === "CONCLUIDO") {
        statusText = "Concluído";
        statusVariant = "outline";
      }
    }

    const handleWhatsAppClick = () => {
      const contactPhone = otherParty?.phone;
      if (!contactPhone) {
        sonnerToast.error("O outro motorista não tem um telefone cadastrado.");
        return;
      }
      const message = encodeURIComponent(
        `Olá ${otherParty?.name}, sou o ${driver.name} referente ao chamado de apoio.`
      );
      window.open(`https://wa.me/55${contactPhone}?text=${message}`, "_blank");
    };

    return (
      <Card className="overflow-hidden shadow-lg border-l-8 border-primary rounded-xl bg-card">
        <CardHeader className="flex flex-row items-start justify-between bg-primary/5 dark:bg-card-foreground/5 p-4">
          <div className="space-y-1.5">
            <CardTitle className="text-base font-bold text-foreground leading-tight">
              {title}
            </CardTitle>
            {call.routeId && (
              <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 font-mono tracking-wide">
                {call.routeId}
              </p>
            )}
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <CalendarClock size={13} className="flex-shrink-0" />
              {formatTimestamp(call.timestamp)}
            </p>
          </div>

          <div className="flex flex-col items-end gap-2 flex-shrink-0 ml-2">
            <UrgencyBadge urgency={call.urgency} />
            <Badge
              variant={statusVariant}
              className="text-xs font-semibold rounded-full px-2.5 py-0.5"
            >
              {statusText}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-4 text-sm space-y-3">
          <div className="grid grid-cols-2 gap-x-5 gap-y-3">
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground mb-0.5 uppercase tracking-wider">
                Nº Pacotes
              </p>
              <p className="font-medium text-foreground text-sm">
                {call.packageCount || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground mb-0.5 uppercase tracking-wider">
                Hub de Origem
              </p>
              <p className="font-medium text-foreground text-sm truncate">
                {call.hub || "N/A"}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-[10px] font-semibold text-muted-foreground mb-0.5 uppercase tracking-wider">
                Região(ões)
              </p>
              <p className="font-medium text-foreground text-sm">
                {call.deliveryRegions?.join(", ") || "N/A"}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-[10px] font-semibold text-muted-foreground mb-0.5 uppercase tracking-wider">
                Veículo Necessário
              </p>
              <p className="font-medium text-foreground text-sm">
                {call.vehicleType || "N/A"}
              </p>
            </div>
          </div>

          <hr className="my-3 border-border/50" />

          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-muted-foreground mb-0.5 uppercase tracking-wider">
              Localização
            </p>
            <a
              href={call.location || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 hover:underline flex items-center gap-1 break-all text-xs"
            >
              <MapPin size={13} className="flex-shrink-0" />{" "}
              <span className="truncate">{call.location || "N/A"}</span>{" "}
              <ExternalLink size={13} className="ml-1 flex-shrink-0" />
            </a>
          </div>
        </CardContent>

        {(call.status === "EM ANDAMENTO" ||
          call.status === "AGUARDANDO_APROVACAO" ||
          call.status === "ABERTO") && (
          <CardFooter className="bg-muted/30 dark:bg-card-foreground/5 p-4 flex justify-end gap-2">
            {otherParty && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleWhatsAppClick}
                className="bg-green-600 hover:bg-green-700 text-white border-green-700 hover:text-white text-xs rounded-lg"
              >
                <Phone size={14} className="mr-1" /> Contatar
              </Button>
            )}

            {!isRequester && call.status === "EM ANDAMENTO" && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRequestApproval(call.id)}
                  className="border-purple-500 text-purple-700 hover:bg-purple-100 dark:text-purple-300 dark:hover:bg-purple-900/50 dark:hover:text-purple-200 text-xs rounded-lg"
                >
                  <Clock size={14} className="mr-1" /> Aprovação
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleCancelSupport(call.id)}
                  className="text-xs rounded-lg"
                >
                  <XCircle size={14} className="mr-1" /> Cancelar
                </Button>
              </>
            )}

            {isRequester &&
              (call.status === "ABERTO" || call.status === "EM ANDAMENTO") && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteSupportRequest(call.id)}
                  className="text-xs rounded-lg"
                >
                  <XCircle size={14} className="mr-1" /> Cancelar
                </Button>
              )}
          </CardFooter>
        )}
      </Card>
    );
  };

  const OpenCallCard = ({ call }: { call: SupportCall }) => {
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
        `Olá ${call.solicitante.name}, me chamo ${driver.name} e aceitei seu chamado e serei seu apoio`
      );
      window.open(
        `https://wa.me/55${requesterPhone}?text=${message}`,
        "_blank"
      );
    };

    return (
      <Card className="overflow-hidden shadow-lg border-l-8 border-yellow-500 rounded-xl bg-card">
        <CardHeader className="bg-card-foreground/5 dark:bg-card-foreground/10 p-4">
          <div className="flex justify-between items-start">
            <div className="space-y-1.5">
              <CardTitle className="text-base font-bold text-foreground leading-tight">
                Apoio para {call.solicitante.name}
              </CardTitle>
              {call.routeId && (
                <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 font-mono tracking-wide">
                  {call.routeId}
                </p>
              )}
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <CalendarClock size={13} className="flex-shrink-0" />
                {formatTimestamp(call.timestamp)}
              </p>
            </div>
            <div className="flex-shrink-0 ml-2">
              <UrgencyBadge urgency={call.urgency} />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 text-sm space-y-3">
          <div className="grid grid-cols-2 gap-x-5 gap-y-3">
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground mb-0.5 uppercase tracking-wider">
                Nº Pacotes
              </p>
              <p className="font-medium text-foreground text-sm">
                {call.packageCount || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground mb-0.5 uppercase tracking-wider">
                Hub de Origem
              </p>
              <p className="font-medium text-foreground text-sm truncate">
                {call.hub || "N/A"}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-[10px] font-semibold text-muted-foreground mb-0.5 uppercase tracking-wider">
                Região(ões)
              </p>
              <p className="font-medium text-foreground text-sm">
                {call.deliveryRegions?.join(", ") || "N/A"}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-[10px] font-semibold text-muted-foreground mb-0.5 uppercase tracking-wider">
                Veículo Necessário
              </p>
              <p className="font-medium text-foreground text-sm">
                {call.vehicleType || "N/A"}
              </p>
            </div>
          </div>

          <hr className="my-3 border-border/50" />

          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-muted-foreground mb-0.5 uppercase tracking-wider">
              Localização
            </p>
            <a
              href={call.location || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 hover:underline flex items-center gap-1 break-all text-xs"
            >
              <MapPin size={13} className="flex-shrink-0" />{" "}
              <span className="truncate">{call.location || "N/A"}</span>{" "}
              <ExternalLink size={13} className="ml-1 flex-shrink-0" />
            </a>
          </div>
        </CardContent>

        <CardFooter className="bg-muted/30 dark:bg-card-foreground/5 p-4 flex justify-end gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleWhatsAppClick}
            className="bg-green-600 hover:bg-green-700 text-white border-green-700 hover:text-white h-9 w-9"
          >
            <Phone size={16} />
          </Button>
          <Button
            onClick={() => handleAcceptCall(call.id)}
            disabled={!!acceptingCallId}
            size="sm"
            className="bg-primary hover:bg-primary/90 w-auto px-4 text-xs h-9 rounded-lg"
          >
            {isAcceptingThisCall ? (
              <LoaderCircle className="animate-spin mr-1.5 h-4 w-4" />
            ) : (
              "Aceitar Apoio"
            )}
          </Button>
        </CardFooter>
      </Card>
    );
  };

  // --- RETURN PRINCIPAL (JSX) ---

  return (
    <>
      <div className="bg-background min-h-dvh font-sans">
        <div className="max-w-2xl mx-auto flex flex-col h-full">
          {!isProfileComplete && isProfileWarningVisible && (
            <div className="p-4 sticky top-0 z-20">
              <div
                className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 rounded-lg shadow-md flex justify-between items-center"
                role="alert"
              >
                <div>
                  <p className="font-bold">Perfil Incompleto!</p>
                  <p className="text-sm">
                    Por favor, preencha todas as informações do seu perfil para
                    poder solicitar ou prestar apoio.
                  </p>
                </div>
                <button
                  onClick={() => setIsProfileWarningVisible(false)}
                  className="p-1 rounded-full hover:bg-yellow-200"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          )}

          <div className="p-4 md:px-6 md:pt-6">
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

          <div className="bg-background rounded-t-2xl shadow-xl flex-grow flex flex-col overflow-hidden min-h-0">
            <div className="px-4 pt-4 sticky top-0 bg-background z-10 border-b border-border">
              <label
                htmlFor="hubFilterSelect"
                className="block text-xs font-medium text-muted-foreground mb-1"
              >
                Filtrar por Hub
              </label>
              <select
                id="hubFilterSelect"
                value={globalHubFilter}
                onChange={(e) => setGlobalHubFilter(e.target.value)}
                className="w-full p-2 border rounded-md bg-background shadow-sm text-sm focus:ring-primary focus:border-primary"
              >
                {allHubs.map((hubOption) => (
                  <option key={hubOption} value={hubOption}>
                    {hubOption}
                  </option>
                ))}
              </select>
            </div>

            {/* Abas */}
            <div className="border-b border-border sticky top-[calc(theme(spacing.24)+1px)] bg-background z-10">
              <div className="flex px-1 sm:px-2">
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
                    className={cn(
                      "flex-1 p-3 text-center text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 sm:gap-2 border-b-2 transition-colors duration-200",
                      activeTab === tab.id
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300 dark:hover:border-gray-700",
                      !isProfileComplete && tab.id !== "profile"
                        ? "cursor-not-allowed opacity-50"
                        : ""
                    )}
                  >
                    {React.cloneElement(tab.icon, { size: 16 })}
                    <span className="capitalize">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Container do Conteúdo das Abas */}
            <div
              className="flex-1 overflow-hidden"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div
                ref={swipeContainerRef}
                className="flex h-full transition-transform duration-300 ease-in-out bg-muted/10 dark:bg-black/20"
                style={{ transform: `translateX(-${activeTabIndex * 100}%)` }}
              >
                {/* --- Aba Disponibilidade --- */}
                <div className="w-full flex-shrink-0 overflow-y-auto p-4 sm:p-6 space-y-6">
                  <Card className="shadow-md bg-card">
                    <CardHeader>
                      <CardTitle className="text-center text-lg font-semibold text-foreground">
                        Estou disponível para apoio?
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col sm:flex-row items-center justify-center gap-4">
                      <Button
                        onClick={() => handleAvailabilityChange(true)}
                        disabled={!isProfileComplete}
                        variant={
                          driver.status === "DISPONIVEL" ? "default" : "outline"
                        }
                        className={cn(
                          "w-full sm:w-36 rounded-lg",
                          driver.status === "DISPONIVEL"
                            ? "bg-green-600 hover:bg-green-700 text-white"
                            : ""
                        )}
                      >
                        <CheckCircle size={16} className="mr-2" /> Disponível
                      </Button>
                      <Button
                        onClick={() => handleAvailabilityChange(false)}
                        disabled={!isProfileComplete}
                        variant={
                          driver.status !== "DISPONIVEL"
                            ? "destructive"
                            : "outline"
                        }
                        className="w-full sm:w-36 rounded-lg"
                      >
                        <XCircle size={16} className="mr-2" /> Indisponível
                      </Button>
                    </CardContent>
                  </Card>
                  {driver.status === "DISPONIVEL" && (
                    <div className="pt-4">
                      <h3 className="text-xl font-semibold text-foreground mb-4 px-1">
                        Chamados Abertos
                      </h3>
                      <div className="relative mb-4 px-1">
                        <Search
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                          size={18}
                        />
                        <input
                          type="text"
                          placeholder="Pesquisar por ID da Rota..."
                          value={routeIdSearch}
                          onChange={(e) => setRouteIdSearch(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm bg-card text-foreground focus:ring-primary focus:border-primary"
                        />
                      </div>
                      {filteredOpenCalls.length > 0 ? (
                        <div className="space-y-5">
                          {filteredOpenCalls.map((call) => (
                            <OpenCallCard key={call.id} call={call} />
                          ))}
                        </div>
                      ) : (
                        <Card className="text-center py-10 px-4 shadow-sm mt-6 bg-card">
                          <HelpCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                          <h3 className="mt-2 text-sm font-semibold text-foreground">
                            Nenhum chamado aberto
                          </h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Quando houver chamados no seu hub, eles aparecerão
                            aqui.
                          </p>
                        </Card>
                      )}
                    </div>
                  )}
                </div>

                {/* --- Aba Apoio --- */}
                <div className="w-full flex-shrink-0 overflow-y-auto p-4 sm:p-6">
                  <Card className="shadow-md bg-card">
                    <CardHeader className="flex flex-row items-center space-x-3 pb-4">
                      <AlertTriangle className="text-destructive h-6 w-6" />
                      <CardTitle className="text-lg font-semibold text-foreground">
                        Solicitar Apoio de Transferência
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-6">
                        Precisa de ajuda para transferir pacotes? Clique abaixo
                        para abrir um chamado. Lembre-se que o mínimo são 20
                        pacotes.
                      </p>
                      <Button
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
                        className="w-full bg-gradient-to-r from-red-500 to-primary text-white font-bold py-3 text-base h-auto shadow-md hover:shadow-lg transition-all duration-300 hover:from-red-600 hover:to-orange-500 rounded-lg"
                        disabled={!isProfileComplete || hasActiveRequest}
                      >
                        <Zap size={18} className="mr-2" /> PRECISO DE APOIO
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* --- Aba Meus Chamados --- */}
                <div className="w-full flex-shrink-0 overflow-y-auto p-4 sm:p-6 space-y-5">
                  <h3 className="text-xl font-semibold text-foreground px-1 mb-3">
                    Meus Chamados e Apoios
                  </h3>
                  <div className="flex flex-wrap gap-2 px-1 pb-4 border-b border-border">
                    {(
                      ["all", "inProgress", "requester", "provider"] as const
                    ).map((filter) => {
                      const labels = {
                        all: "Todos",
                        inProgress: "Em Andamento",
                        requester: "Meus Pedidos",
                        provider: "Meus Apoios",
                      };
                      return (
                        <Button
                          key={filter}
                          variant={
                            historyFilter === filter ? "default" : "secondary"
                          }
                          size="sm"
                          onClick={() => setHistoryFilter(filter)}
                          className={cn(
                            "text-xs h-8 px-3 rounded-full",
                            historyFilter === filter
                              ? "shadow-sm"
                              : "text-muted-foreground hover:bg-accent"
                          )}
                        >
                          {labels[filter]}
                        </Button>
                      );
                    })}
                  </div>
                  {filteredCalls.length > 0 ? (
                    <div className="space-y-5">
                      {filteredCalls.map((call) => (
                        <DriverCallHistoryCard key={call.id} call={call} />
                      ))}
                    </div>
                  ) : (
                    <Card className="text-center py-10 px-4 shadow-sm mt-6 bg-card">
                      <Ticket className="mx-auto h-12 w-12 text-muted-foreground" />
                      <h3 className="mt-2 text-sm font-semibold text-foreground">
                        Nenhum chamado
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Seu histórico de pedidos e apoios aparecerá aqui.
                      </p>
                    </Card>
                  )}
                </div>

                {/* --- 4. DIV DA ABA TUTORIAL ADICIONADA --- */}
                <div className="w-full flex-shrink-0 overflow-y-auto p-4 sm:p-6 space-y-6">
                  <h2 className="text-2xl font-bold text-foreground px-1">
                    Central de Ajuda (Tutorial)
                  </h2>
                  <Tabs defaultValue="solicitante" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="solicitante">
                        Para Quem Pede Apoio
                      </TabsTrigger>
                      <TabsTrigger value="prestador">
                        Para Quem Presta Apoio
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="solicitante" className="mt-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>
                            Dúvidas Frequentes (Solicitante)
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Accordion
                            type="single"
                            collapsible
                            className="w-full"
                          >
                            {tutorialsSolicitante.map((tut) => (
                              <AccordionItem value={tut.id} key={tut.id}>
                                <AccordionTrigger className="text-left">
                                  {tut.question}
                                </AccordionTrigger>
                                <AccordionContent>
                                  {tut.answer}
                                </AccordionContent>
                              </AccordionItem>
                            ))}
                          </Accordion>
                        </CardContent>
                      </Card>
                    </TabsContent>
                    <TabsContent value="prestador" className="mt-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>Dúvidas Frequentes (Prestador)</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Accordion
                            type="single"
                            collapsible
                            className="w-full"
                          >
                            {tutorialsPrestador.map((tut) => (
                              <AccordionItem value={tut.id} key={tut.id}>
                                <AccordionTrigger className="text-left">
                                  {tut.question}
                                </AccordionTrigger>
                                <AccordionContent>
                                  {tut.answer}
                                </AccordionContent>
                              </AccordionItem>
                            ))}
                          </Accordion>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </div>
                {/* --- FIM DA ABA TUTORIAL --- */}

                {/* --- Aba Perfil --- */}
                <div className="w-full flex-shrink-0 overflow-y-auto p-4 sm:p-6">
                  <div className="space-y-6">
                    <Card className="shadow-md bg-card">
                      <CardHeader>
                        <CardTitle className="text-lg font-semibold text-foreground">
                          Configurações
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <label
                            htmlFor="soundToggle"
                            className="text-sm font-medium text-foreground pr-4"
                          >
                            Som das notificações
                          </label>
                          <button
                            id="soundToggle"
                            onClick={toggleMute}
                            className={cn(
                              "p-2 rounded-full transition-colors",
                              isMuted
                                ? "bg-muted text-muted-foreground"
                                : "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
                            )}
                          >
                            {isMuted ? (
                              <VolumeX size={20} />
                            ) : (
                              <Volume2 size={20} />
                            )}
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="shadow-md bg-card">
                      <CardHeader>
                        <CardTitle className="text-lg font-semibold text-foreground">
                          Editar Perfil
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 pt-4">
                        <div>
                          <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">
                            ID de Motorista
                          </label>
                          <input
                            type="text"
                            value={shopeeId || "Aguardando cadastro..."}
                            readOnly
                            className="w-full p-2 border rounded-md bg-muted text-muted-foreground cursor-not-allowed text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">
                            Nome Completo
                          </label>
                          <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full p-2 border rounded-md text-sm bg-background text-foreground focus:ring-primary focus:border-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">
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
                            className="w-full p-2 border rounded-md text-sm bg-background text-foreground focus:ring-primary focus:border-primary"
                            placeholder="(XX) XXXXX-XXXX"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">
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
                              className="w-full p-2 border rounded-md pr-10 text-sm bg-background text-foreground focus:ring-primary focus:border-primary"
                              placeholder="Pesquisar Hub..."
                            />
                            <Search
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                              size={18}
                            />
                            {isHubDropdownOpen && filteredHubs.length > 0 && (
                              <div className="absolute z-10 w-full mt-1 bg-card border rounded-md shadow-lg max-h-60 overflow-y-auto text-sm">
                                {filteredHubs.map((h) => (
                                  <div
                                    key={h}
                                    className="p-2 hover:bg-muted cursor-pointer"
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
                          <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">
                            Tipo de Veículo
                          </label>
                          <select
                            value={vehicleType}
                            onChange={(e) => setVehicleType(e.target.value)}
                            className="w-full p-2 border rounded-md text-sm bg-background text-foreground focus:ring-primary focus:border-primary"
                          >
                            <option value="">Selecione seu veículo</option>
                            {vehicleTypesList.map((v) => (
                              <option key={v} value={v}>
                                {v.charAt(0).toUpperCase() + v.slice(1)}
                              </option>
                            ))}
                          </select>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button
                          onClick={handleUpdateProfile}
                          variant="outline"
                          className="w-full border-primary text-primary hover:bg-primary/10 hover:text-primary rounded-lg"
                        >
                          Salvar Alterações
                        </Button>
                      </CardFooter>
                    </Card>
                    <Card className="shadow-md bg-card">
                      <CardHeader>
                        <CardTitle className="text-lg font-semibold text-foreground">
                          Alterar Senha
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 pt-4">
                        <div>
                          <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">
                            Nova Senha
                          </label>
                          <div className="relative">
                            <input
                              type={showPassword ? "text" : "password"}
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              className="w-full p-2 border rounded-md text-sm bg-background text-foreground focus:ring-primary focus:border-primary"
                              placeholder="Mínimo 6 caracteres"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                            >
                              {showPassword ? (
                                <EyeOff size={18} />
                              ) : (
                                <Eye size={18} />
                              )}
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">
                            Confirmar Nova Senha
                          </label>
                          <input
                            type={showPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full p-2 border rounded-md text-sm bg-background text-foreground focus:ring-primary focus:border-primary"
                            placeholder="Confirme a nova senha"
                          />
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button
                          onClick={handleChangePassword}
                          variant="outline"
                          className="w-full border-primary text-primary hover:bg-primary/10 hover:text-primary rounded-lg"
                        >
                          Alterar Senha
                        </Button>
                      </CardFooter>
                    </Card>
                    <Card className="shadow-md border border-destructive/50 bg-card">
                      <CardContent className="p-4">
                        <Button
                          variant="destructive"
                          onClick={() => auth.signOut()}
                          className="w-full rounded-lg"
                        >
                          <LogOut size={16} className="mr-2" />
                          Sair da Conta
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- Modais (Estilizados) --- */}
      {isReauthModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold">
                Confirme sua identidade
              </CardTitle>
              <p className="text-sm text-muted-foreground pt-2">
                Para sua segurança, por favor, insira sua senha atual para
                continuar.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label
                  htmlFor="currentPassword"
                  className="block text-sm font-medium text-muted-foreground mb-1"
                >
                  Senha Atual
                </label>
                <input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full p-2 border rounded-md bg-background"
                  required
                />
              </div>
              {reauthError && (
                <p className="text-sm text-red-600">{reauthError}</p>
              )}
            </CardContent>
            <CardFooter className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsReauthModalOpen(false)}
                disabled={isReauthenticating}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleReauthenticateAndChange}
                disabled={isReauthenticating || !currentPassword}
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 dark:text-white"
              >
                {isReauthenticating ? (
                  <LoaderCircle className="animate-spin mr-2 h-4 w-4" />
                ) : null}
                Confirmar
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {isSupportModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          {/* ADICIONADO: max-h-[90vh] e overflow-y-auto para permitir rolagem em telas pequenas */}
          <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
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
                  htmlFor="hubModal"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Selecione o seu Hub
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <select
                    id="hubModal"
                    name="hub"
                    value={hub}
                    onChange={(e) => setHub(e.target.value)}
                    className="w-full pl-10 pr-8 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary appearance-none text-sm bg-white text-gray-900"
                    required
                  >
                    <option value="">Selecione...</option>
                    {hubs.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg
                      className="fill-current h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label
                  htmlFor="currentLocationModal"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Sua Localização Atual
                </label>
                <div className="flex items-center space-x-2">
                  <div className="relative flex-grow">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      id="currentLocationModal"
                      name="currentLocation"
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Clique no ícone para obter ou digite"
                      className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm bg-white text-gray-900"
                      required
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleGetLocation}
                    disabled={isLocating}
                    className="border-primary text-primary hover:bg-primary/10"
                  >
                    {isLocating ? (
                      <LoaderCircle className="animate-spin h-5 w-5" />
                    ) : (
                      <MapPin className="h-5 w-5" />
                    )}
                  </Button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="packageCountModal"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Número de Pacotes (mín. 20)
                </label>
                <div className="relative">
                  <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    id="packageCountModal"
                    name="packageCount"
                    type="number"
                    min="20"
                    placeholder="Ex: 25"
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm bg-white text-gray-900"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Região(ões) de Entrega
                </label>
                <div className="space-y-2">
                  {deliveryRegions.map((region, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="relative flex-grow">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
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
                          placeholder={`Região ${index + 1}`}
                          className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm bg-white text-gray-900"
                          required
                        />
                      </div>
                      {deliveryRegions.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            handleRemoveField(index, setDeliveryRegions)
                          }
                          className="text-red-500 hover:bg-red-100 h-9 w-9"
                        >
                          <MinusCircle size={18} />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddField(setDeliveryRegions)}
                  className="mt-2 text-xs h-8 text-gray-700 border-gray-300"
                >
                  <PlusCircle size={14} className="mr-1.5" />
                  Adicionar Região
                </Button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Veículo(s) Necessário(s)
                </label>
                <div className="space-y-2">
                  {neededVehicles.map((vehicle, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="relative flex-grow">
                        <Truck className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <select
                          value={vehicle}
                          onChange={(e) =>
                            handleFieldChange(
                              index,
                              e.target.value,
                              setNeededVehicles
                            )
                          }
                          className="w-full pl-10 pr-8 py-2 border rounded-lg appearance-none text-sm bg-white text-gray-900"
                          required
                        >
                          <option value="">Selecione...</option>
                          {vehicleTypesList.map((v) => (
                            <option key={v} value={v}>
                              {v.charAt(0).toUpperCase() + v.slice(1)}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                          <svg
                            className="fill-current h-4 w-4"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                          </svg>
                        </div>
                      </div>
                      {neededVehicles.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            handleRemoveField(index, setNeededVehicles)
                          }
                          className="text-red-500 hover:bg-red-100 h-9 w-9"
                        >
                          <MinusCircle size={18} />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddField(setNeededVehicles)}
                  className="mt-2 text-xs h-8 text-gray-700 border-gray-300"
                >
                  <PlusCircle size={14} className="mr-1.5" />
                  Adicionar Veículo
                </Button>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  id="isBulkyModal"
                  name="isBulky"
                  type="checkbox"
                  className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <label
                  htmlFor="isBulkyModal"
                  className="text-sm font-medium text-gray-700"
                >
                  Contém pacote volumoso
                </label>
              </div>

              {modalError && (
                <div className="text-sm text-center text-red-600 bg-red-100 p-3 rounded-md border border-red-200">
                  {modalError}
                </div>
              )}

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 text-base bg-orange-600 hover:bg-orange-700 text-white font-bold"
                >
                  {isSubmitting ? (
                    <LoaderCircle className="animate-spin mr-2 h-5 w-5" />
                  ) : (
                    "Enviar Solicitação"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md text-center">
            <CardContent className="p-8">
              <CheckCircle size={56} className="text-green-500 mx-auto mb-5" />
              <h2 className="text-xl font-bold text-foreground mb-2">
                Sucesso!
              </h2>
              <p className="text-muted-foreground mb-6">
                Apoio solicitado com sucesso! Aguarde o contato de um motorista
                ou monitor.
              </p>
              <Button
                onClick={() => setShowSuccessModal(false)}
                className="w-full h-10"
              >
                OK
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* --- 5. CHATBOT RENDERIZADO NO FINAL --- */}
      <Chatbot />
    </>
  );
};
