import React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Timestamp } from "firebase/firestore";
import { Trash2, Ticket, Building, Clock, MapPin, Phone } from "lucide-react";
import type { SupportCall } from "../../types/logistics";
import { AvatarComponent, UrgencyBadge } from "../UI"; // Sobe 1 nível
import { Button } from "../ui/button"; // Sobe 1 nível
import { cn } from "../../lib/utils"; // Sobe 2 níveis

interface CallCardProps {
  call: SupportCall;
  onDelete: (call: SupportCall) => void;
  onClick: (call: SupportCall) => void;
  onContact: (phone?: string) => void;
}

export const CallCard = ({
  call,
  onDelete,
  onClick,
  onContact,
}: CallCardProps) => {
  const formatTimestamp = (timestamp: any): string => {
    if (!timestamp) return "Horário indisponível";
    let date;
    if (timestamp instanceof Timestamp) {
      date = timestamp.toDate();
    } else if (timestamp && typeof timestamp.seconds === "number") {
      date = new Date(timestamp.seconds * 1000);
    } else {
      return "Data inválida";
    }
    if (isNaN(date.getTime())) return "Data inválida";
    return format(date, "dd/MM/yyyy HH:mm", { locale: ptBR });
  };

  const timeAgo = formatTimestamp(call.timestamp);

  const cleanDescription = (desc: string) => {
    if (desc.includes("Aqui está a descrição")) {
      const parts = desc.split('"');
      return parts[1] || desc;
    }
    return desc;
  };

  return (
    <div
      className={cn(
        "bg-card p-4 rounded-lg shadow-md border border-border space-y-3 hover:shadow-lg transition-shadow cursor-pointer",
        call.urgency === "URGENTE" && "animate-blink"
      )}
      onClick={() => onClick(call)}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-3">
          <AvatarComponent user={call.solicitante} />
          <div>
            <div className="flex items-center gap-2">
              <p className="font-bold text-foreground">
                {call.solicitante.name}
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(call);
                }}
                className="p-1 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                title="Excluir Solicitação"
              >
                <Trash2 size={14} />
              </button>
            </div>
            <p className="text-sm text-muted-foreground">Solicitante</p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <UrgencyBadge urgency={call.urgency} />
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 rounded-full text-green-500 hover:bg-green-500/10 hover:text-green-600"
            onClick={(e) => {
              e.stopPropagation();
              onContact(call.solicitante.phone);
            }}
          >
            <Phone size={16} />
          </Button>
        </div>
      </div>

      <div className="text-sm text-muted-foreground space-y-2">
        <div className="flex items-center space-x-2">
          <Ticket size={16} className="text-primary" />
          <span>{call.routeId || "N/A"}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Building size={16} className="text-primary" />
          <span>{call.hub || "N/A"}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Clock size={16} className="text-muted-foreground" />
          <span>{timeAgo}</span>
        </div>
        <div className="flex items-center space-x-2">
          <MapPin size={16} className="text-primary" />
          <span>{call.location}</span>
        </div>
      </div>
      <p className="font-sans text-base font-medium text-foreground bg-muted/50 p-3 rounded-md whitespace-pre-wrap">
        {cleanDescription(call.description)}
      </p>
    </div>
  );
};
