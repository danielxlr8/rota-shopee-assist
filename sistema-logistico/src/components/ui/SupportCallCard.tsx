import {
  SupportCall,
  Driver,
  UrgencyLevel,
  CallStatus,
} from "@/types/logistics";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import {
  Clock,
  MapPin,
  MessageCircle, // Mantido caso queira usar para o Apoio
  AlertTriangle,
  FileText,
  MoreVertical,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Timestamp } from "firebase/firestore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface SupportCallCardProps {
  call: SupportCall;
  requester?: Driver;
  assignedDriver?: Driver;
  onContactRequester: (phone: string) => void;
  onContactAssigned: (phone: string) => void;
  onUpdateStatus?: (id: string, newStatus: CallStatus) => void;
  statusColorClass?: string;
  onCardClick?: () => void;
}

const priorityColors: { [key in UrgencyLevel]: string } = {
  BAIXA: "bg-green-500",
  MEDIA: "bg-yellow-500",
  ALTA: "bg-orange-500",
  URGENTE: "bg-red-600",
};

const statusColors: { [key: string]: string } = {
  ABERTO: "bg-blue-500",
  "EM ANDAMENTO": "bg-indigo-500",
  CONCLUIDO: "bg-gray-500",
  AGUARDANDO_APROVACAO: "bg-purple-500",
  EXCLUIDO: "bg-red-500",
  ARQUIVADO: "bg-gray-400",
};

const statusBorderColors: { [key in CallStatus]?: string } = {
  ABERTO: "border-orange-500 hover:bg-orange-500/10 text-orange-400",
  "EM ANDAMENTO": "border-blue-500 hover:bg-blue-500/10 text-blue-400",
  AGUARDANDO_APROVACAO:
    "border-purple-500 hover:bg-purple-500/10 text-purple-400",
  CONCLUIDO: "border-green-500 hover:bg-green-500/10 text-green-400",
};

export default function SupportCallCard({
  call,
  requester,
  assignedDriver,
  onContactRequester,
  onContactAssigned,
  onUpdateStatus,
  statusColorClass = "border-gray-200",
  onCardClick,
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
  const isGoogleLink = (url: string) => url.startsWith("http");

  const getNextStatus = (): CallStatus | null => {
    switch (call.status) {
      case "ABERTO":
        return "EM ANDAMENTO";
      case "EM ANDAMENTO":
        return "AGUARDANDO_APROVACAO";
      default:
        return null;
    }
  };

  const getPreviousStatus = (): CallStatus | null => {
    switch (call.status) {
      case "EM ANDAMENTO":
        return "ABERTO";
      case "AGUARDANDO_APROVACAO":
        return "EM ANDAMENTO";
      default:
        return null;
    }
  };

  const nextStatus = getNextStatus();
  const prevStatus = getPreviousStatus();

  if (!requester) {
    return (
      <Card className="w-full p-4 text-center text-sm text-gray-500">
        Não foi possível carregar os dados do solicitante.
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "w-full border-2 hover:shadow-lg transition-all duration-300 cursor-pointer",
        statusColorClass,
        isCritical && "animate-pulse shadow-lg shadow-red-600/20"
      )}
      onClick={onCardClick}
    >
      <CardHeader className="pb-3">
        {/* ... (Header content - Status, Urgency, Dropdown - Sem alterações) ... */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge
              className={`${
                statusColors[call.status] || "bg-gray-500"
              } text-white font-medium`}
            >
              {call.status.replace("_", " ")}
            </Badge>
            {isCritical && (
              <Badge className="bg-red-600 text-white animate-pulse">
                <AlertTriangle size={12} className="mr-1" /> URGENTE
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={`${
                priorityColors[call.urgency]
              } text-white border-none capitalize`}
            >
              {call.urgency.toLowerCase()}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <MoreVertical size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="bg-gray-950 text-gray-50 border-gray-700"
              >
                {nextStatus && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateStatus?.(call.id, nextStatus);
                    }}
                    className={cn(
                      "border-l-4 focus:bg-gray-800 focus:text-gray-50",
                      statusBorderColors[nextStatus]
                    )}
                  >
                    <ArrowRight className="mr-2 h-4 w-4" />{" "}
                    <span>Mover para {nextStatus.replace("_", " ")}</span>
                  </DropdownMenuItem>
                )}
                {prevStatus && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateStatus?.(call.id, prevStatus);
                    }}
                    className={cn(
                      "border-l-4 focus:bg-gray-800 focus:text-gray-50",
                      statusBorderColors[prevStatus]
                    )}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />{" "}
                    <span>Mover para {prevStatus.replace("_", " ")}</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div
          className={`flex items-center gap-2 text-sm ${
            isCritical ? "text-red-600 font-medium" : "text-muted-foreground"
          }`}
        >
          <Clock size={14} /> <span>{timeAgo}</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Solicitante */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={requester.avatar} />
              <AvatarFallback>{requester.initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm">{requester.name}</p>
              {requester.shopeeId && (
                <p className="text-xs text-muted-foreground">
                  ID: {requester.shopeeId}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">Solicitante</p>
            </div>
          </div>
          {requester.phone && (
            <Button
              size="icon"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onContactRequester(requester.phone);
              }}
              className="h-9 w-9 rounded-full hover:bg-green-100 flex items-center justify-center p-0" // Padding removido
              title={`Contatar ${requester.name} via WhatsApp`}
            >
              <img
                src="/whatsapp-logo.png"
                alt="WhatsApp"
                // --- Aumentar tamanho da imagem ---
                className="h-9 w-9" // Aumentado para h-7 w-7
              />
            </Button>
          )}
        </div>

        {/* Apoio (assigned driver) */}
        {assignedDriver && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={assignedDriver.avatar} />
                <AvatarFallback>{assignedDriver.initials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm">{assignedDriver.name}</p>
                {assignedDriver.shopeeId && (
                  <p className="text-xs text-muted-foreground">
                    ID: {assignedDriver.shopeeId}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">Apoio</p>
              </div>
            </div>
            {assignedDriver.phone && (
              <Button
                size="icon"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onContactAssigned(assignedDriver.phone);
                }}
                className="h-9 w-9 rounded-full hover:bg-green-100 flex items-center justify-center p-0" // Padding removido
                title={`Contatar ${assignedDriver.name} via WhatsApp`}
              >
                <img
                  src="/whatsapp-logo.png"
                  alt="WhatsApp"
                  // --- Aumentar tamanho da imagem ---
                  className="h-7 w-7" // Aumentado para h-7 w-7
                />
                {/* <MessageCircle size={14} /> */}
              </Button>
            )}
          </div>
        )}

        {/* Localização */}
        <div className="flex items-center gap-2">
          <MapPin size={16} className="text-muted-foreground flex-shrink-0" />
          {isGoogleLink(call.location) ? (
            <a
              href={call.location}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-blue-700 bg-blue-100 hover:bg-blue-200 border border-blue-200 p-2 rounded-lg flex items-center gap-2 transition-all duration-200"
              title="Abrir no Google Maps"
              onClick={(e) => e.stopPropagation()}
            >
              Abrir localização no Mapa{" "}
              <ExternalLink className="h-4 w-4 opacity-70 group-hover:opacity-100" />
            </a>
          ) : (
            <p className="text-sm text-muted-foreground break-all">
              {call.location}
            </p>
          )}
        </div>

        {/* Descrição */}
        {call.description && (
          <div className="bg-gray-50 rounded-lg p-3 border">
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
              <FileText size={12} /> <span>Descrição Gerada</span>
            </div>
            <p className="text-sm text-gray-800">{call.description}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
