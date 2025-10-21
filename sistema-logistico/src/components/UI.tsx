import React from "react";
import { Driver, SupportCall, UrgencyLevel } from "../types/logistics";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Timestamp } from "firebase/firestore";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/Avatar"; // Usando seu Avatar.tsx
import { Badge } from "./ui/Badge"; // Usando sua Badge.tsx
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"; // Usando seu card.tsx
import { Button } from "./ui/button"; // Usando seu button.tsx
import { Phone, Mail, Truck, Building, X } from "lucide-react";

// --- AvatarComponent (Corrigido para Dark Mode) ---
export const AvatarComponent = ({
  user,
  onClick,
}: {
  user: {
    avatar?: string | null;
    initials?: string;
    name?: string;
  };
  onClick?: () => void;
}) => {
  return (
    <Avatar onClick={onClick} className={onClick ? "cursor-pointer" : ""}>
      <AvatarImage src={user.avatar || undefined} alt={user.name || "Avatar"} />
      <AvatarFallback className="bg-muted text-muted-foreground font-semibold">
        {user.initials || user.name?.charAt(0) || "?"}
      </AvatarFallback>
    </Avatar>
  );
};

// --- UrgencyBadge (Corrigido para Dark Mode) ---
export const UrgencyBadge = ({ urgency }: { urgency: UrgencyLevel }) => {
  const urgencyStyles = {
    URGENTE: "bg-red-600 text-white",
    ALTA: "bg-orange-500 text-white",
    MEDIA: "bg-yellow-400 text-yellow-900",
    BAIXA: "bg-blue-200 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  };
  return (
    <span
      className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
        urgencyStyles[urgency] || "bg-gray-200 text-gray-800"
      }`}
    >
      {urgency}
    </span>
  );
};

// --- SummaryCard (Corrigido para Dark Mode) ---
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
  <Card className="shadow-lg bg-card">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">
        {title}
      </CardTitle>
      <div style={{ color: colorClass }} className="h-4 w-4">
        {icon}
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-foreground">{value}</div>
      <p className="text-xs text-muted-foreground">{subtext}</p>
    </CardContent>
  </Card>
);

// --- KanbanColumn (Corrigido para Dark Mode) ---
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
  <div className="flex flex-col h-full bg-muted/50 dark:bg-card-foreground/5 rounded-lg">
    <div className="p-4 sticky top-0 bg-muted/50 dark:bg-card-foreground/5 z-10 rounded-t-lg">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: colorClass }}
          />
          <h3 className="font-semibold text-sm uppercase text-foreground">
            {title}
          </h3>
        </div>
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ backgroundColor: `${colorClass}33`, color: colorClass }}
        >
          {count}
        </span>
      </div>
      {headerControls && <div className="mt-2">{headerControls}</div>}
    </div>
    <div className="p-2 space-y-3 overflow-y-auto h-full">{children}</div>
  </div>
);

// --- DriverInfoModal (Corrigido para Dark Mode) ---
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

  const formatPhoneNumber = (phone: string) => {
    if (!phone) return "N/A";
    const digits = phone.replace(/\D/g, "");
    if (digits.length !== 11) return phone;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const driverStatus = call
    ? "Em Apoio"
    : driver.status === "DISPONIVEL"
    ? "Disponível"
    : "Indisponível";
  const statusColor = call
    ? "bg-blue-100 text-blue-700"
    : driver.status === "DISPONIVEL"
    ? "bg-green-100 text-green-700"
    : "bg-red-100 text-red-700";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground"
        >
          <X size={20} />
        </button>
        <CardHeader className="flex flex-col items-center text-center">
          <AvatarComponent user={driver} />
          <CardTitle className="text-xl font-bold mt-3">
            {driver.name}
          </CardTitle>
          <Badge className={`mt-2 ${statusColor} hover:${statusColor}`}>
            {driverStatus}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm space-y-2 text-foreground">
            <div className="flex items-center gap-3">
              <Phone size={16} className="text-muted-foreground" />
              <span>{formatPhoneNumber(driver.phone)}</span>
            </div>
            <div className="flex items-center gap-3">
              <Mail size={16} className="text-muted-foreground" />
              <span className="truncate">{driver.email}</span>
            </div>
            <div className="flex items-center gap-3">
              <Building size={16} className="text-muted-foreground" />
              <span className="truncate">{driver.hub}</span>
            </div>
            <div className="flex items-center gap-3">
              <Truck size={16} className="text-muted-foreground" />
              <span className="capitalize">{driver.vehicleType}</span>
            </div>
          </div>
          {call && (
            <div className="mt-4 pt-4 border-t border-border">
              <h4 className="text-sm font-semibold text-primary mb-2">
                Chamado Ativo
              </h4>
              <p className="text-xs text-muted-foreground">
                {call.description}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
