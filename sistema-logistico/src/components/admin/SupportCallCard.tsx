import { SupportCall, Driver, UrgencyLevel } from "../../types/logistics";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/Avatar";
import {
  Clock,
  MapPin,
  Phone,
  MessageCircle,
  AlertTriangle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Timestamp } from "firebase/firestore";

interface SupportCallCardProps {
  call: SupportCall;
  requester: Driver;
  assignedDriver?: Driver;
  onContactRequester: (phone: string) => void;
  onContactAssigned: (phone: string) => void;
}

const priorityColors: { [key in UrgencyLevel]: string } = {
  BAIXA: "bg-status-completed",
  MEDIA: "bg-primary",
  ALTA: "bg-warning",
  URGENTE: "bg-destructive",
};

const statusColors = {
  ABERTO: "bg-status-open",
  "EM ANDAMENTO": "bg-status-progress",
  CONCLUIDO: "bg-status-completed",
  AGUARDANDO_APROVACAO: "bg-purple-500",
  EXCLUIDO: "bg-red-500",
  ARQUIVADO: "bg-gray-500",
};

// Esta função não é usada no componente atual, mas foi mantida no outro arquivo
// para consistência com o restante do projeto
// const isCallCritical = (createdAt: Date): boolean => {
//   const minutesAgo = (Date.now() - createdAt.getTime()) / (1000 * 60);
//   return minutesAgo >= 15;
// };

// const getCallUrgencyLevel = (createdAt: Date): 'normal' | 'warning' | 'critical' => {
//   const minutesAgo = (Date.now() - createdAt.getTime()) / (1000 * 60);
//   if (minutesAgo >= 15) return 'critical';
//   if (minutesAgo >= 10) return 'warning';
//   return 'normal';
// };

export default function SupportCallCard({
  call,
  requester,
  assignedDriver,
  onContactRequester,
  onContactAssigned,
}: SupportCallCardProps) {
  const formatTimestamp = (timestamp: any): string => {
    if (!timestamp) return "Horário indisponível";
    let date;
    if (timestamp instanceof Timestamp) {
      date = timestamp.toDate();
    } else if (timestamp && typeof timestamp.seconds === "number") {
      date = new Date(timestamp.seconds * 1000);
    } else if (typeof timestamp === "number") {
      date = new Date(timestamp);
    } else {
      return "Data inválida";
    }
    if (isNaN(date.getTime())) return "Data inválida";
    return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
  };

  const timeAgo = formatTimestamp(call.timestamp);

  const isCritical = call.urgency === "URGENTE";

  return (
    <Card
      className={`w-full hover:shadow-md transition-all duration-300 border-l-4 ${
        isCritical
          ? "border-l-destructive animate-pulse shadow-lg shadow-destructive/20"
          : "border-l-primary"
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge
              className={`${statusColors[call.status]} text-white font-medium`}
            >
              {call.status.replace("_", " ")}
            </Badge>
            {isCritical && (
              <Badge className="bg-destructive text-white animate-pulse">
                <AlertTriangle size={12} className="mr-1" />
                URGENTE
              </Badge>
            )}
          </div>
          <Badge
            variant="outline"
            className={`${priorityColors[call.urgency]} text-white border-none`}
          >
            {call.urgency}
          </Badge>
        </div>

        <div
          className={`flex items-center gap-2 text-sm ${
            isCritical
              ? "text-destructive font-medium"
              : "text-muted-foreground"
          }`}
        >
          <Clock size={14} />
          <span>{timeAgo}</span>
          {isCritical && (
            <AlertTriangle
              size={14}
              className="text-destructive animate-pulse"
            />
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Solicitante */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={requester.avatar} />
              <AvatarFallback>{requester.initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm">{requester.name}</p>
              <p className="text-xs text-muted-foreground">Solicitante</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onContactRequester(requester.phone)}
            className="h-8 w-8 p-0"
          >
            <MessageCircle size={14} />
          </Button>
        </div>

        {/* Motorista Designado */}
        {assignedDriver && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={assignedDriver.avatar} />
                <AvatarFallback>{assignedDriver.initials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm">{assignedDriver.name}</p>
                <p className="text-xs text-muted-foreground">Apoio</p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onContactAssigned(assignedDriver.phone)}
              className="h-8 w-8 p-0"
            >
              <MessageCircle size={14} />
            </Button>
          </div>
        )}

        {/* Localização */}
        <div className="flex items-start gap-2">
          <MapPin
            size={14}
            className="text-muted-foreground mt-1 flex-shrink-0"
          />
          <p className="text-sm text-muted-foreground">{call.location}</p>
        </div>

        {/* Descrição */}
        {call.description && (
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-sm">{call.description}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
