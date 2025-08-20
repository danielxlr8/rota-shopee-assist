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
  Camera,
  User,
  Search, // Importar o ícone de busca
} from "lucide-react";
// Importações do Firebase
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
  getDocs,
  writeBatch,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { updatePassword } from "firebase/auth";

const hubs = [
  "LM Hub_PR_Londrina_Parque ABC II",
  "LM Hub_PR_Maringa",
  "LM Hub_PR_Foz do Iguaçu",
  "LM Hub_PR_Cascavel",
];

const vehicleTypes = ["Moto", "Carro Passeio", "Carro Utilitário", "Van"];

// --- NOVO: Componente de Busca Reutilizável (ComboBox) ---
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

  useEffect(() => {
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

// Componente para renderizar a descrição com links clicáveis e quebras de linha
const RenderDescription = ({ text }: { text: string }) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return (
    <p className="text-sm text-gray-500" style={{ whiteSpace: "pre-wrap" }}>
      {parts.map((part, index) => {
        if (part.match(urlRegex)) {
          return (
            <a
              key={index}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {part}
            </a>
          );
        }
        return part;
      })}
    </p>
  );
};

// Componente para o cartão de histórico
const DriverCallHistoryCard = ({
  call,
  currentDriver,
  allDrivers,
  onCancelSupport,
}: {
  call: SupportCall;
  currentDriver: Driver;
  allDrivers: Driver[];
  onCancelSupport: (callId: string) => void;
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
    } else {
      statusText = `Recebendo Apoio`;
      statusColor = "bg-blue-200 text-blue-800";
      icon = (
        <Truck size={20} className="text-blue-500 transform -scale-x-100" />
      );
    }
  } else {
    title = `Apoio a ${call.solicitante.name}`;
    statusText = "Prestando Apoio";
    statusColor = "bg-green-200 text-green-800";
    icon = <Truck size={20} className="text-green-500" />;
  }
  if (call.status === "CONCLUIDO") {
    statusText = "Concluído";
    statusColor = "bg-gray-200 text-gray-800";
  }

  const handleWhatsAppClick = () => {
    const contactPhone = otherParty?.phone;
    if (!contactPhone) {
      alert("O outro motorista não tem um telefone cadastrado.");
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
            <RenderDescription text={call.description} />
          </div>
        </div>
        <div
          className={`px-3 py-1 text-xs font-semibold rounded-full ${statusColor} self-end sm:self-center`}
        >
          {statusText}
        </div>
      </div>
      {(call.status === "EM ANDAMENTO" ||
        call.status === "AGUARDANDO_APROVACAO" ||
        call.status === "APROVADO") && (
        <div className="mt-3 pt-3 border-t flex flex-wrap gap-2 justify-end">
          {otherParty && (
            <button
              onClick={handleWhatsAppClick}
              className="flex items-center gap-2 px-3 py-1 text-xs font-semibold bg-green-500 text-white rounded-md hover:bg-green-600"
            >
              <Phone size={14} /> Contatar
            </button>
          )}
          {!isRequester && (
            <button
              onClick={() => onCancelSupport(call.id)}
              className="flex items-center gap-2 px-3 py-1 text-xs font-semibold bg-red-500 text-white rounded-md hover:bg-red-600"
            >
              <XCircle size={14} /> Cancelar Apoio
            </button>
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
}: {
  call: SupportCall;
  currentDriverName: string;
  onAccept: (callId: string) => void;
}) => {
  const requesterPhone = call.solicitante.phone || "";
  const handleWhatsAppClick = () => {
    if (!requesterPhone) {
      alert(
        "O motorista solicitante não possui um número de telefone cadastrado."
      );
      return;
    }
    const message = encodeURIComponent(
      `Olá ${call.solicitante.name}, me chamo ${currentDriverName} e aceitei seu chamado e serei seu apoio`
    );
    window.open(`https://wa.me/55${requesterPhone}?text=${message}`, "_blank");
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-yellow-500">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div>
          <p className="font-bold text-gray-800">
            Apoio para {call.solicitante.name}
          </p>
          <RenderDescription text={call.description} />
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
            className="px-4 py-2 bg-orange-600 text-white text-sm font-semibold rounded-lg hover:bg-orange-700"
          >
            Aceitar Apoio
          </button>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t text-xs text-gray-600 space-y-1">
        <p>
          <span className="font-semibold">Local:</span> {call.location}
        </p>
      </div>
    </div>
  );
};

interface DriverInterfaceProps {
  driver: Driver | null;
}

export const DriverInterface = ({
  driver: initialDriver,
}: DriverInterfaceProps) => {
  const [driver, setDriver] = useState<Driver | null>(initialDriver);
  const [allMyCalls, setAllMyCalls] = useState<SupportCall[]>([]);
  const [openSupportCalls, setOpenSupportCalls] = useState<SupportCall[]>([]);
  const [allDrivers, setAllDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  const [activeTab, setActiveTab] = useState<
    "availability" | "support" | "activeCalls" | "profile"
  >("availability");
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Estados para o formulário de suporte
  const [location, setLocation] = useState("");
  const [selectedHub, setSelectedHub] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState("");

  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");
  const [historyFilter, setHistoryFilter] = useState<
    "all" | "requester" | "provider" | "inProgress"
  >("all");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    setDriver(initialDriver);
    if (initialDriver) {
      setProfileName(initialDriver.name);
      setProfilePhone(initialDriver.phone || "");
    }
  }, [initialDriver]);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);

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
            : new Date(a.timestamp as string).getTime();
        const timeB =
          b.timestamp instanceof Timestamp
            ? b.timestamp.toMillis()
            : new Date(b.timestamp as string).getTime();
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
      setLoading(false);
    });

    return () => {
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
    newCall: Partial<Omit<SupportCall, "id" | "timestamp" | "solicitante">>
  ) => {
    if (!driver) return;

    // Lógica para apagar chamado anterior se existir
    const q = query(
      collection(db, "supportCalls"),
      where("solicitante.id", "==", driver.id),
      where("status", "==", "ABERTO")
    );
    const existingCallsSnapshot = await getDocs(q);
    const batch = writeBatch(db);
    existingCallsSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();

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
    if (!userId) return;
    const newStatus = isAvailable ? "DISPONIVEL" : "INDISPONIVEL";
    updateDriver(userId, { status: newStatus });
  };

  const handleAcceptCall = async (callId: string) => {
    if (!userId) return;
    await updateCall(callId, { assignedTo: userId, status: "EM ANDAMENTO" });
    await updateDriver(userId, { status: "EM_ROTA" });
  };

  const handleCancelSupport = async (callId: string) => {
    if (!userId) return;
    await updateCall(callId, {
      assignedTo: undefined,
      status: "ABERTO",
    });
    await updateDriver(userId, { status: "DISPONIVEL" });
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
        const googleMapsLink = `https://www.google.com/maps?q=${latitude.toFixed(
          4
        )},${longitude.toFixed(4)}`;
        setLocation(googleMapsLink);
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
    const packageCount = formData.get("packageCount") as string;
    const deliveryRegion = formData.get("deliveryRegion") as string;
    const isBulky = formData.get("isBulky") === "on";

    const bulkyText = isBulky ? "Sim" : "Não";
    const informalDescription = `
**Hub de Origem:** ${selectedHub}
**Destino da Carga:** ${deliveryRegion}
**Total de Pacotes:** ${packageCount}
**Contém Volumosos:** ${bulkyText}
**Veículo Necessário:** ${selectedVehicle}
**Localização do Motorista:** ${location}
    `;

    try {
      const prompt = `Aja como um assistente de logística. Um motorista descreveu um problema. Sua tarefa é:
        1. Reescrever a descrição de forma clara e profissional para um chamado de suporte, mantendo a estrutura de tópicos e todas as informações essenciais, incluindo o link do Google Maps. Remova qualquer texto redundante.
        2. Classificar a urgência do problema como 'URGENTE', 'ALTA' ou 'MEDIA'.
        
        Descrição do motorista: "${informalDescription}"
        
        Retorne a sua resposta APENAS no formato JSON, seguindo este schema: {"description": "sua descrição profissional", "urgency": "sua classificação de urgência"}`;

      const payload = {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              description: { type: "STRING" },
              urgency: { type: "STRING", enum: ["URGENTE", "ALTA", "MEDIA"] },
            },
            required: ["description", "urgency"],
          },
        },
      };

      const apiKey = ""; // Sua chave de API aqui
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok)
        throw new Error(`${response.statusText} (${response.status})`);
      const result = await response.json();
      const textPart = result?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!textPart)
        throw new Error("Não foi possível processar a resposta da IA.");
      const parsedJson = JSON.parse(textPart);
      if (!parsedJson.description || !parsedJson.urgency)
        throw new Error("A resposta da IA está incompleta.");

      const newCallData = {
        description: parsedJson.description,
        urgency: parsedJson.urgency as UrgencyLevel,
        location: location,
        status: "ABERTO" as const,
        vehicleType: selectedVehicle,
        isBulky: isBulky,
        hub: selectedHub,
      };
      await addNewCall(newCallData);
      setIsSupportModalOpen(false);
      setShowSuccessModal(true);
    } catch (error: any) {
      console.error("Erro detalhado ao criar chamado:", error);
      if (error.message.includes("Failed to fetch")) {
        setModalError(
          "Falha de rede. Verifique a sua ligação à Internet e se a sua chave de API está correta."
        );
      } else {
        setModalError(`Erro: ${error.message}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!event.target.files || event.target.files.length === 0 || !userId) {
      return;
    }
    const file = event.target.files[0];
    const storageRef = ref(storage, `avatars/${userId}/${file.name}`);

    setIsUploading(true);
    try {
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      await updateDriver(userId, { avatar: downloadURL });
    } catch (error) {
      console.error("Erro ao fazer upload da imagem:", error);
      alert("Não foi possível carregar a imagem. Tente novamente.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!userId) return;

    try {
      await updateDriver(userId, {
        name: profileName,
        phone: profilePhone,
      });
      alert("Perfil atualizado com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      alert("Não foi possível atualizar o perfil.");
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (newPassword.length < 6) {
      setPasswordError("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("As senhas não coincidem.");
      return;
    }

    const user = auth.currentUser;
    if (user) {
      try {
        await updatePassword(user, newPassword);
        setPasswordSuccess("Senha alterada com sucesso!");
        setNewPassword("");
        setConfirmPassword("");
      } catch (error: any) {
        console.error("Erro ao alterar a senha:", error);
        setPasswordError(
          "Erro ao alterar a senha. Tente fazer logout e login novamente para continuar."
        );
      }
    }
  };

  const filteredCalls = useMemo(() => {
    if (historyFilter === "requester")
      return allMyCalls.filter((call) => call.solicitante.id === userId);
    if (historyFilter === "provider")
      return allMyCalls.filter((call) => call.assignedTo === userId);
    if (historyFilter === "inProgress")
      return allMyCalls.filter((call) =>
        ["EM ANDAMENTO", "AGUARDANDO_APROVACAO", "APROVADO"].includes(
          call.status
        )
      );
    return allMyCalls;
  }, [allMyCalls, historyFilter, userId]);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        Carregando...
      </div>
    );
  if (!driver)
    return (
      <div className="flex items-center justify-center min-h-screen">
        Perfil não encontrado.
      </div>
    );

  const renderContent = () => {
    switch (activeTab) {
      case "availability":
        return (
          <>
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
              <div className="mt-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">
                  Chamados de Apoio Disponíveis
                </h3>
                {openSupportCalls.length > 0 ? (
                  <div className="space-y-4">
                    {openSupportCalls.map((call) => (
                      <OpenCallCard
                        key={call.id}
                        call={call}
                        currentDriverName={driver.name}
                        onAccept={handleAcceptCall}
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
          </>
        );
      case "support":
        return (
          <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="text-red-500" />
              <h3 className="text-lg font-bold">
                Solicitar Apoio de Transferência
              </h3>
            </div>
            <button
              onClick={() => {
                setModalError("");
                setIsSupportModalOpen(true);
              }}
              className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold py-3 px-4 rounded-lg"
            >
              PRECISO DE APOIO
            </button>
          </div>
        );
      case "activeCalls":
        return (
          <div className="mt-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              Histórico de Chamados
            </h3>
            <div className="flex flex-wrap gap-2 mb-4 border-b pb-2">
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
                  />
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 pt-4">
                Nenhum chamado encontrado.
              </p>
            )}
          </div>
        );
      case "profile":
        return (
          <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
            <h3 className="text-lg font-bold text-gray-800">Editar Perfil</h3>
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div className="relative w-24 h-24 mx-auto group">
                <img
                  src={driver.avatar}
                  alt={`Avatar de ${driver.name}`}
                  className="w-full h-full rounded-full object-cover border-4 border-gray-200"
                />
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarUpload}
                  className="hidden"
                  accept="image/png, image/jpeg"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center rounded-full transition-opacity"
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <LoaderCircle className="animate-spin text-white" />
                  ) : (
                    <Camera className="text-white opacity-0 group-hover:opacity-100" />
                  )}
                </button>
              </div>
              <div>
                <label
                  htmlFor="profileName"
                  className="block text-sm font-medium text-gray-700"
                >
                  Nome Completo
                </label>
                <input
                  type="text"
                  id="profileName"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label
                  htmlFor="profilePhone"
                  className="block text-sm font-medium text-gray-700"
                >
                  Telefone
                </label>
                <input
                  type="tel"
                  id="profilePhone"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border rounded-md"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 px-4 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700"
              >
                Salvar Alterações
              </button>
            </form>

            <div className="border-t pt-6">
              <h4 className="text-md font-bold text-gray-800 mb-4">
                Alterar Senha
              </h4>
              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <div>
                  <label
                    htmlFor="newPassword"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Nova Senha
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border rounded-md"
                    placeholder="Mínimo de 6 caracteres"
                  />
                </div>
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Confirmar Nova Senha
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border rounded-md"
                  />
                </div>
                {passwordError && (
                  <p className="text-sm text-red-600">{passwordError}</p>
                )}
                {passwordSuccess && (
                  <p className="text-sm text-green-600">{passwordSuccess}</p>
                )}
                <button
                  type="submit"
                  className="w-full py-2 px-4 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-800"
                >
                  Trocar Senha
                </button>
              </form>
            </div>
          </div>
        );
    }
  };

  return (
    <>
      <div className="bg-gray-100 min-h-screen p-4 md:p-6 space-y-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white p-6 rounded-lg shadow-md text-center space-y-3 mb-6">
            <h2 className="text-2xl font-bold text-gray-800">{driver.name}</h2>
            <p className="text-sm text-gray-500 font-medium">
              {driver.region || "Região não definida"}
            </p>
            <p className="text-gray-500">Sistema de Apoio Logístico</p>
          </div>
          <div className="bg-white rounded-lg shadow-md">
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab("availability")}
                className={`flex-grow p-3 text-center text-xs sm:text-sm font-semibold flex items-center justify-center space-x-2 ${
                  activeTab === "availability"
                    ? "border-b-2 border-orange-600 text-orange-600"
                    : "text-gray-500"
                }`}
              >
                <Zap size={16} />
                <span>Disponibilidade</span>
              </button>
              <button
                onClick={() => setActiveTab("support")}
                className={`flex-grow p-3 text-center text-xs sm:text-sm font-semibold flex items-center justify-center space-x-2 ${
                  activeTab === "support"
                    ? "border-b-2 border-orange-600 text-orange-600"
                    : "text-gray-500"
                }`}
              >
                <AlertTriangle size={16} />
                <span>Solicitar Apoio</span>
              </button>
              <button
                onClick={() => setActiveTab("activeCalls")}
                className={`flex-grow p-3 text-center text-xs sm:text-sm font-semibold flex items-center justify-center space-x-2 ${
                  activeTab === "activeCalls"
                    ? "border-b-2 border-orange-600 text-orange-600"
                    : "text-gray-500"
                }`}
              >
                <Clock size={16} />
                <span>Meus Chamados</span>
              </button>
              <button
                onClick={() => setActiveTab("profile")}
                className={`flex-grow p-3 text-center text-xs sm:text-sm font-semibold flex items-center justify-center space-x-2 ${
                  activeTab === "profile"
                    ? "border-b-2 border-orange-600 text-orange-600"
                    : "text-gray-500"
                }`}
              >
                <User size={16} />
                <span>Meu Perfil</span>
              </button>
            </div>
            <div
              className="p-4 transition-opacity duration-300"
              key={activeTab}
            >
              {renderContent()}
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
                <SearchableComboBox
                  options={hubs}
                  value={selectedHub}
                  onChange={setSelectedHub}
                  placeholder="Digite ou selecione um hub..."
                />
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
                    placeholder="Ex: 15"
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="deliveryRegion"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Região de Entrega dos Pacotes
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    id="deliveryRegion"
                    name="deliveryRegion"
                    type="text"
                    placeholder="Ex: Zona Leste, São Paulo"
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="vehicleType"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Tipo de Veículo Necessário
                </label>
                <SearchableComboBox
                  options={vehicleTypes}
                  value={selectedVehicle}
                  onChange={setSelectedVehicle}
                  placeholder="Digite ou selecione um veículo..."
                />
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
