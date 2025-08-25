import React from "react";
import type {
  UrgencyLevel,
  DriverStatus,
  SupportCall,
  Driver,
} from "../types/logistics";
import { Clock, MapPin, Send, Phone, Info, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { Timestamp } from "firebase/firestore"; // Importar o tipo Timestamp

// --- CORREÇÃO AQUI ---
// Adicionada a propriedade opcional 'onClick' para tornar o componente clicável
export const AvatarComponent = ({
  user,
  onClick,
}: {
  user: { avatar: string; initials: string; name: string };
  onClick?: () => void;
}) => (
  <div className="relative inline-block" onClick={onClick}>
    <img
      className={`h-10 w-10 rounded-full ${onClick ? "cursor-pointer" : ""}`}
      src={user.avatar}
      alt={`Avatar de ${user.name}`}
      onError={(e) => {
        e.currentTarget.src = `https://i.pravatar.cc/150?u=${user.name}`;
      }}
    />
  </div>
);

// Componente UrgencyBadge
export const UrgencyBadge = ({ urgency }: { urgency: UrgencyLevel }) => {
  const urgencyClasses = {
    URGENTE: "bg-red-100 text-red-800 border-red-500",
    ALTA: "bg-orange-100 text-orange-800 border-orange-500",
    MEDIA: "bg-yellow-100 text-yellow-800 border-yellow-500",
    BAIXA: "bg-blue-100 text-blue-800 border-blue-500",
  };
  return (
    <span
      className={`px-2 py-1 text-xs font-medium rounded-full border ${urgencyClasses[urgency]}`}
    >
      {urgency}
    </span>
  );
};

// Componente StatusBadge
export const StatusBadge = ({ status }: { status: DriverStatus }) => {
  const statusInfo: Record<DriverStatus, { text: string; class: string }> = {
    DISPONIVEL: { text: "Disponível", class: "bg-green-100 text-green-800" },
    INDISPONIVEL: { text: "Indisponível", class: "bg-gray-100 text-gray-800" },
    EM_ROTA: { text: "Em Rota", class: "bg-yellow-100 text-yellow-800" },
    PAUSADO: { text: "Pausado", class: "bg-orange-100 text-orange-800" },
    OFFLINE: { text: "Offline", class: "bg-red-100 text-red-800" },
    EM_ATENDIMENTO: {
      text: "Em Atendimento",
      class: "bg-blue-100 text-blue-800",
    },
  };
  const info = statusInfo[status];
  if (!info) {
    return null;
  }
  const { text, class: className } = info;
  return (
    <span
      className={`px-3 py-1 text-sm font-semibold rounded-full ${className}`}
    >
      {text}
    </span>
  );
};

// Componente CallCard
export const CallCard = ({
  call,
  onAction,
  actionText,
}: {
  call: SupportCall;
  onAction?: (id: string) => void;
  actionText?: string;
}) => {
  const formatTimestamp = (timestamp: any): string => {
    if (!timestamp) return "Horário indisponível";
    if (timestamp instanceof Timestamp) {
      return formatDistanceToNow(timestamp.toDate(), {
        addSuffix: true,
        locale: ptBR,
      });
    }
    if (typeof timestamp === "number") {
      return formatDistanceToNow(new Date(timestamp), {
        addSuffix: true,
        locale: ptBR,
      });
    }
    return "Data inválida";
  };

  const timeAgo = formatTimestamp(call.timestamp);

  return (
    <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200 space-y-3">
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
      <div className="text-sm text-gray-600 space-y-2">
        <div className="flex items-center space-x-2">
          <Clock size={16} className="text-gray-400" />
          <span>{timeAgo}</span>
        </div>
        <div className="flex items-center space-x-2">
          <MapPin size={16} className="text-gray-400" />
          <span>{call.location}</span>
        </div>
      </div>
      <p className="text-gray-700 bg-gray-50 p-3 rounded-md">
        {call.description}
      </p>
      {onAction && actionText && (
        <button
          onClick={() => onAction(call.id)}
          className="w-full flex justify-center items-center space-x-2 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <span>{actionText}</span>
          <Send size={16} />
        </button>
      )}
    </div>
  );
};

// Componente SummaryCard
export const SummaryCard = ({
  title,
  value,
  icon,
  subtext,
  colorClass,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  subtext: string;
  colorClass: string;
}) => (
  <div
    className="bg-white p-4 rounded-lg shadow-sm border-l-4"
    style={{ borderColor: colorClass }}
  >
    <div className="flex justify-between items-center">
      <div className="space-y-1">
        <p className="text-gray-500 text-sm font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        <p className="text-xs text-gray-400">{subtext}</p>
      </div>
      <div
        className={`p-3 rounded-full bg-opacity-20`}
        style={{ backgroundColor: `${colorClass}33`, color: colorClass }}
      >
        {icon}
      </div>
    </div>
  </div>
);

// Componente KanbanColumn
export const KanbanColumn = ({
  title,
  count,
  children,
  colorClass,
  headerControls,
  className,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
  colorClass: string;
  headerControls?: React.ReactNode;
  className?: string;
}) => (
  <div className={`p-4 ${className}`}>
    <div className="flex justify-between items-center mb-4">
      <div className="flex items-center">
        <div
          className="w-2 h-2 rounded-full mr-2"
          style={{ backgroundColor: colorClass }}
        ></div>
        <h3 className="font-bold text-gray-800">{title}</h3>
        <span className="ml-2 bg-gray-200 text-gray-600 text-xs font-semibold px-2 py-1 rounded-full">
          {count}
        </span>
      </div>
      {headerControls}
    </div>
    <div className="space-y-4 h-[calc(100vh-22rem)] overflow-y-auto pr-2">
      {children}
    </div>
  </div>
);

// Componente DriverCard com ícone de informação
export const DriverCard = ({
  driver,
  onAction,
  onInfoClick,
}: {
  driver: Driver;
  onAction: (id: string) => void;
  onInfoClick: () => void;
}) => (
  <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200 flex items-center justify-between">
    <div className="flex items-center space-x-3">
      <AvatarComponent user={driver} />
      <div>
        <div className="flex items-center space-x-2">
          <p className="font-bold text-gray-800">{driver.name}</p>
          <button
            onClick={onInfoClick}
            className="text-gray-400 hover:text-blue-600"
          >
            <Info size={16} />
          </button>
        </div>
        <p className="text-sm text-gray-500">{driver.location}</p>
      </div>
    </div>
    <div className="flex flex-col items-end space-y-2">
      <StatusBadge status={driver.status} />
      <button
        onClick={() => onAction(driver.id)}
        className="bg-blue-500 text-white text-sm font-semibold py-1 px-3 rounded-md hover:bg-blue-600 transition-colors"
      >
        Acionar
      </button>
    </div>
  </div>
);

// Novo Componente: Modal de Informações do Motorista
export const DriverInfoModal = ({
  driver,
  call,
  onClose,
}: {
  driver: Driver | null;
  call: SupportCall | null;
  onClose: () => void;
}) => {
  if (!driver) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            Informações do Motorista
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-200"
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <AvatarComponent user={driver} />
            <div>
              <p className="font-bold text-lg">{driver.name}</p>
              <p className="text-sm text-gray-500">{driver.region}</p>
            </div>
          </div>
          <div className="border-t pt-4">
            <h3 className="font-semibold text-gray-700 mb-2">Contato</h3>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Phone size={16} />
              <span>{driver.phone}</span>
            </div>
          </div>
          {call && (
            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-700 mb-2">
                Chamado Ativo
              </h3>
              <div className="space-y-1 text-sm text-gray-600">
                <p>
                  <span className="font-medium">Status:</span> {call.status}
                </p>
                <p>
                  <span className="font-medium">Local:</span> {call.location}
                </p>
                <p>
                  <span className="font-medium">Descrição:</span>{" "}
                  {call.description}
                </p>
              </div>
            </div>
          )}
          {!call && (
            <div className="border-t pt-4 text-sm text-gray-500">
              Este motorista não tem um chamado ativo no momento.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
