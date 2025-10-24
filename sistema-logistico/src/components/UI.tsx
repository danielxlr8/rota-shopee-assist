import React from "react";
import { Driver, SupportCall, UrgencyLevel } from "../types/logistics";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
// import { Timestamp } from "firebase/firestore"; // Não é usado aqui
import { Avatar, AvatarFallback, AvatarImage } from "./ui/Avatar";
import { Badge } from "./ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
// import { Button } from "./ui/button"; // Não é usado aqui
import { Phone, Mail, Truck, Building, X } from "lucide-react";
import { cn } from "../lib/utils"; // Import cn

// --- AvatarComponent --- (Sem alterações, já usa theme)
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

// --- UrgencyBadge (Cores ajustadas para contraste) ---
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
        urgencyStyles[urgency] || "bg-muted text-muted-foreground" // Fallback para theme
      )}
    >
      {urgency}
    </span>
  );
};

// --- SummaryCard (CORRIGIDO PARA DARK MODE e NÚMERO LARANJA) ---
export const SummaryCard = ({
  title,
  value,
  icon,
  subtext,
  colorClass, // Mantido para a cor do ÍCONE
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  subtext: string;
  colorClass: string;
}) => (
  // Usa bg-card do tema, que no dark é zinc-800
  <Card className="shadow-lg bg-card text-card-foreground border border-border">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">
        {title}
      </CardTitle>
      {/* Ícone usa a cor passada */}
      <div style={{ color: colorClass }} className="h-4 w-4">
        {icon}
      </div>
    </CardHeader>
    <CardContent>
      {/* NÚMERO EM LARANJA */}
      <div className="text-2xl font-bold text-primary">{value}</div>
      <p className="text-xs text-muted-foreground">{subtext}</p>
    </CardContent>
  </Card>
);

// --- KanbanColumn (CORRIGIDO PARA DARK MODE) ---
export const KanbanColumn = ({
  title,
  count,
  colorClass, // Mantido para o indicador de cor
  children,
  headerControls,
}: {
  title: string;
  count: number;
  colorClass: string;
  children: React.ReactNode;
  headerControls?: React.ReactNode;
}) => (
  // Usa bg-card para o fundo principal da coluna no dark mode
  <div className="flex flex-col h-full bg-card rounded-lg overflow-hidden border border-border">
    {/* Header usa bg-background para se misturar um pouco mais */}
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
    {/* Conteúdo com scroll */}
    <div className="p-2 space-y-3 overflow-y-auto h-full">{children}</div>
  </div>
);

// --- DriverInfoModal (CORRIGIDO PARA DARK MODE) ---
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
    // Aceita undefined
    if (!phone) return "N/A";
    const digits = phone.replace(/\D/g, "");
    if (digits.length !== 11) return phone; // Retorna original se não tiver 11 dígitos
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const driverStatus = call
    ? "Em Apoio"
    : driver.status === "DISPONIVEL"
    ? "Disponível"
    : "Indisponível";

  // Usando classes condicionais para cores de status no dark mode
  const statusClasses = cn(
    "mt-2", // Margem comum
    call
      ? "bg-blue-500/20 text-blue-400 border-blue-500/50" // Azul para "Em Apoio"
      : driver.status === "DISPONIVEL"
      ? "bg-green-500/20 text-green-400 border-green-500/50" // Verde para "Disponível"
      : "bg-red-500/20 text-red-400 border-red-500/50" // Vermelho para "Indisponível"
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md relative bg-card text-card-foreground">
        {" "}
        {/* Usa theme */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground"
        >
          <X size={20} />
        </button>
        <CardHeader className="flex flex-col items-center text-center">
          <AvatarComponent user={driver} />
          <CardTitle className="text-xl font-bold mt-3 text-foreground">
            {" "}
            {/* Usa theme */}
            {driver.name}
          </CardTitle>
          {/* Usando Badge com classes condicionais */}
          <Badge variant="outline" className={statusClasses}>
            {" "}
            {/* Usa variant outline + classes condicionais */}
            {driverStatus}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm space-y-2 text-foreground">
            {" "}
            {/* Usa theme */}
            <div className="flex items-center gap-3">
              <Phone size={16} className="text-muted-foreground" />{" "}
              {/* Usa theme */}
              <span>{formatPhoneNumber(driver.phone)}</span>
            </div>
            <div className="flex items-center gap-3">
              <Mail size={16} className="text-muted-foreground" />{" "}
              {/* Usa theme */}
              <span className="truncate">{driver.email || "N/A"}</span>{" "}
              {/* Fallback para email */}
            </div>
            <div className="flex items-center gap-3">
              <Building size={16} className="text-muted-foreground" />{" "}
              {/* Usa theme */}
              <span className="truncate">{driver.hub || "N/A"}</span>{" "}
              {/* Fallback para hub */}
            </div>
            <div className="flex items-center gap-3">
              <Truck size={16} className="text-muted-foreground" />{" "}
              {/* Usa theme */}
              <span className="capitalize">
                {driver.vehicleType || "N/A"}
              </span>{" "}
              {/* Fallback para vehicleType */}
            </div>
          </div>
          {call && (
            <div className="mt-4 pt-4 border-t border-border">
              {" "}
              {/* Usa theme */}
              <h4 className="text-sm font-semibold text-primary mb-2">
                {" "}
                {/* Usa theme */}
                Chamado Ativo
              </h4>
              <p className="text-xs text-muted-foreground">
                {" "}
                {/* Usa theme */}
                {call.description}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
