import React from "react";
import { Driver, SupportCall, UrgencyLevel } from "../types/logistics";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Phone, Mail, Truck, Building, X } from "lucide-react";
import { cn } from "../lib/utils";

// --- AvatarComponent ---
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

// --- UrgencyBadge ---
export const UrgencyBadge = ({ urgency }: { urgency: UrgencyLevel }) => {
  const urgencyStyles = {
    URGENTE: "bg-red-600 text-white dark:bg-red-700 dark:text-red-100",
    ALTA: "bg-orange-500 text-white dark:bg-orange-600 dark:text-orange-100",
    MEDIA:
      "bg-yellow-400 text-yellow-900 dark:bg-yellow-600 dark:text-yellow-100",
    BAIXA: "bg-blue-200 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  };
  return (
    <span
      className={cn(
        "px-2.5 py-0.5 text-xs font-semibold rounded-full whitespace-nowrap",
        urgencyStyles[urgency] || "bg-muted text-muted-foreground"
      )}
    >
      {urgency}
    </span>
  );
};

// --- SummaryCard ---
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
  <Card className="shadow-lg bg-card text-card-foreground border border-border">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">
        {title}
      </CardTitle>
      <div style={{ color: colorClass }} className="h-4 w-4">
        {icon}
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-primary">{value}</div>
      <p className="text-xs text-muted-foreground">{subtext}</p>
    </CardContent>
  </Card>
);

// --- KanbanColumn ---
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
  <div className="flex flex-col h-full bg-card rounded-lg overflow-hidden border border-border">
    <div className="p-4 sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: colorClass }}
          />
          <h3 className="font-semibold text-sm uppercase text-foreground truncate">
            {title}
          </h3>
        </div>
        <Badge
          variant="secondary"
          style={{ borderColor: colorClass, color: colorClass }}
        >
          {count}
        </Badge>
      </div>
      {headerControls && <div className="mt-2">{headerControls}</div>}
    </div>
    <div className="p-2 space-y-3 overflow-y-auto h-full">{children}</div>
  </div>
);

// --- DriverInfoModal ---
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

  const formatPhoneNumber = (phone: string | undefined) => {
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

  const statusClasses = cn(
    "mt-2",
    call
      ? "bg-blue-500/20 text-blue-400 border-blue-500/50"
      : driver.status === "DISPONIVEL"
      ? "bg-green-500/20 text-green-400 border-green-500/50"
      : "bg-red-500/20 text-red-400 border-red-500/50"
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md relative bg-card text-card-foreground">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground"
        >
          <X size={20} />
        </button>
        <CardHeader className="flex flex-col items-center text-center">
          <AvatarComponent user={driver} />
          <CardTitle className="text-xl font-bold mt-3 text-foreground">
            {driver.name}
          </CardTitle>
          <Badge variant="outline" className={statusClasses}>
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
              <span className="truncate">{driver.email || "N/A"}</span>
            </div>
            <div className="flex items-center gap-3">
              <Building size={16} className="text-muted-foreground" />
              <span className="truncate">{driver.hub || "N/A"}</span>
            </div>
            <div className="flex items-center gap-3">
              <Truck size={16} className="text-muted-foreground" />
              <span className="capitalize">{driver.vehicleType || "N/A"}</span>
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
