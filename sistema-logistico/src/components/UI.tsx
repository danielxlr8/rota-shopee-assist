import React from "react";
import type { Driver, SupportCall, UrgencyLevel } from "../types/logistics";
import {
  // Ícones não utilizados foram removidos desta lista
  Building,
  Truck,
  Phone,
  MapPin,
  X,
} from "lucide-react";

// Tipo para o usuário que pode ser um Driver ou o solicitante de um chamado
type UserLike = Partial<Driver> | Partial<SupportCall["solicitante"]>;

// Componente Avatar corrigido para aceitar props que podem ser undefined
export const AvatarComponent = ({
  user,
  onClick,
}: {
  user: UserLike;
  onClick?: () => void;
}) => (
  <div
    className={`relative w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm ${
      onClick ? "cursor-pointer" : ""
    }`}
    onClick={onClick}
  >
    {user.avatar ? (
      <img
        src={user.avatar}
        alt={user.name || "Avatar"}
        className="w-full h-full object-cover"
      />
    ) : (
      <span className="text-sm font-bold text-gray-600">
        {user.initials || user.name?.charAt(0) || "?"}
      </span>
    )}
  </div>
);

export const UrgencyBadge = ({ urgency }: { urgency: UrgencyLevel }) => {
  const urgencyStyles: { [key in UrgencyLevel]: string } = {
    URGENTE: "bg-red-600 text-white",
    ALTA: "bg-orange-500 text-white",
    MEDIA: "bg-yellow-400 text-gray-800",
    BAIXA: "bg-blue-400 text-white",
  };
  return (
    <span
      className={`px-2 py-1 text-xs font-bold rounded-full ${urgencyStyles[urgency]}`}
    >
      {urgency}
    </span>
  );
};

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
  <div className="bg-white p-4 rounded-lg shadow-md flex items-center space-x-4">
    <div
      className="p-3 rounded-full"
      style={{ backgroundColor: `${colorClass}20`, color: colorClass }}
    >
      {icon}
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-sm font-semibold text-gray-600">{title}</p>
      <p className="text-xs text-gray-400">{subtext}</p>
    </div>
  </div>
);

export const KanbanColumn = ({
  title,
  count,
  colorClass,
  children,
  headerControls,
}: {
  title: string;
  count: number;
  colorClass: string;
  children: React.ReactNode;
  headerControls?: React.ReactNode;
}) => (
  <div className="flex flex-col h-full">
    <div className="p-2 sticky top-0 bg-inherit z-10">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: colorClass }}
          ></div>
          <h3 className="font-bold text-gray-800">{title}</h3>
        </div>
        <span className="px-2 py-0.5 text-xs font-semibold bg-gray-200 text-gray-700 rounded-full">
          {count}
        </span>
      </div>
      {headerControls && <div className="mb-2">{headerControls}</div>}
    </div>
    <div className="flex-grow overflow-y-auto space-y-3 px-2 pb-2">
      {children}
    </div>
  </div>
);

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
      <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
        >
          <X size={24} />
        </button>
        <div className="flex flex-col items-center text-center">
          <AvatarComponent user={driver} />
          <h2 className="text-xl font-bold mt-4">{driver.name}</h2>
          <div className="text-sm text-gray-500 mt-2 space-y-1">
            <p className="flex items-center gap-2">
              <Building size={14} /> {driver.hub}
            </p>
            <p className="flex items-center gap-2">
              <Truck size={14} /> {driver.vehicleType}
            </p>
            <p className="flex items-center gap-2">
              <Phone size={14} /> {driver.phone}
            </p>
          </div>
        </div>
        {call && (
          <div className="mt-4 pt-4 border-t">
            <h3 className="font-bold text-center mb-2">Apoio em Andamento</h3>
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <MapPin size={14} /> <strong>Local:</strong> {call.location}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
