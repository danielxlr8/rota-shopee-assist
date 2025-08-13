import React from "react";
import type {
  UrgencyLevel,
  DriverStatus,
  SupportCall,
  Driver,
} from "../types/logistics";
import { Clock, MapPin, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

// Componente Avatar
export const AvatarComponent = ({
  user,
}: {
  user: { avatar: string; initials: string; name: string };
}) => (
  <div className="relative inline-block">
    <img
      className="h-10 w-10 rounded-full"
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
    ALTA: "bg-yellow-100 text-yellow-800 border-yellow-500",
    MEDIA: "bg-blue-100 text-blue-800 border-blue-500",
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
  const statusInfo = {
    DISPONIVEL: { text: "Disponível", class: "bg-green-100 text-green-800" },
    INDISPONIVEL: { text: "Indisponível", class: "bg-gray-100 text-gray-800" },
    EM_ROTA: { text: "Em Rota", class: "bg-yellow-100 text-yellow-800" },
  };
  const { text, class: className } = statusInfo[status];
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
  const timeAgo = formatDistanceToNow(new Date(call.timestamp), {
    addSuffix: true,
    locale: ptBR,
  });

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

// Componente DriverCard
// A função 'onAction' espera um 'id' (string), e o botão passa o 'driver.id'.
export const DriverCard = ({
  driver,
  onAction,
}: {
  driver: Driver;
  onAction: (id: string) => void;
}) => (
  <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200 flex items-center justify-between">
    <div className="flex items-center space-x-3">
      <AvatarComponent user={driver} />
      <div>
        <p className="font-bold text-gray-800">{driver.name}</p>
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
}: {
  title: string;
  count: number;
  children: React.ReactNode;
  colorClass: string;
}) => (
  <div className="bg-gray-50 rounded-lg p-4 flex-1 min-w-[300px]">
    <div className="flex items-center mb-4">
      <div
        className="w-2 h-2 rounded-full mr-2"
        style={{ backgroundColor: colorClass }}
      ></div>
      <h3 className="font-bold text-gray-800">{title}</h3>
      <span className="ml-2 bg-gray-200 text-gray-600 text-xs font-semibold px-2 py-1 rounded-full">
        {count}
      </span>
    </div>
    <div className="space-y-4">{children}</div>
  </div>
);
