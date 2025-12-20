import {
  SupportCall,
  Driver,
  UrgencyLevel,
  CallStatus,
} from "@/types/logistics";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Clock,
  MapPin,
  AlertTriangle,
  FileText,
  MoreVertical,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Trash2,
  Building,
  Package,
  Truck,
  Weight,
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
  onDelete?: (id: string) => void;
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
  onDelete,
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
        isCritical && "blink-critical shadow-lg shadow-red-600/20"
      )}
      onClick={onCardClick}
    >
      <CardHeader className="pb-3">
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
                {onDelete && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(call.id);
                    }}
                    className="focus:bg-red-900/50 focus:text-red-400 text-red-500"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Mover para Lixeira</span>
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
              className="h-9 w-9 rounded-full hover:bg-green-100 flex items-center justify-center p-0"
              title={`Contatar ${requester.name} via WhatsApp`}
            >
              <img
                src="/whatsapp-logo.png"
                alt="WhatsApp"
                className="h-9 w-9"
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
                className="h-9 w-9 rounded-full hover:bg-green-100 flex items-center justify-center p-0"
                title={`Contatar ${assignedDriver.name} via WhatsApp`}
              >
                <img
                  src="/whatsapp-logo.png"
                  alt="WhatsApp"
                  className="h-7 w-7"
                />
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

        {/* Informações Organizadas */}
        {call.description &&
          (() => {
            // Parsear a descrição para extrair informações
            const parseDescription = (desc: string) => {
              const info: any = {};

              // Extrair MOTIVO
              const motivoMatch = desc.match(/MOTIVO:\s*([^.]+)/i);
              if (motivoMatch) info.motivo = motivoMatch[1].trim();

              // Extrair DETALHES
              const detalhesMatch = desc.match(
                /DETALHES:\s*([^.]+(?:\.[^H]|$))/i
              );
              if (detalhesMatch) info.detalhes = detalhesMatch[1].trim();

              // Extrair Hub
              const hubMatch = desc.match(/Hub:\s*([^.]+)/i);
              if (hubMatch) info.hub = hubMatch[1].trim();

              // Extrair Loc (localização)
              const locMatch = desc.match(/Loc:\s*([^.]+)/i);
              if (locMatch) info.loc = locMatch[1].trim();

              // Extrair Qtd
              const qtdMatch = desc.match(/Qtd:\s*(\d+)/i);
              if (qtdMatch) info.qtd = qtdMatch[1].trim();

              // Extrair Regiões
              const regioesMatch = desc.match(/Regiões:\s*([^.]+)/i);
              if (regioesMatch) {
                info.regioes = regioesMatch[1]
                  .split(",")
                  .map((r) => r.trim())
                  .filter(Boolean);
              }

              // Extrair Veículos
              const veiculosMatch = desc.match(/Veículos:\s*([^.]+)/i);
              if (veiculosMatch) {
                info.veiculos = veiculosMatch[1]
                  .split(",")
                  .map((v) => v.trim())
                  .filter(Boolean);
              }

              // Verificar se é VOLUMOSO
              info.volumoso = /VOLUMOSO/i.test(desc);

              return info;
            };

            const parsedInfo = parseDescription(call.description);
            const hasParsedInfo = Object.keys(parsedInfo).length > 0;

            return (
              <div className="space-y-4">
                {hasParsedInfo ? (
                  <>
                    {/* Motivo e Detalhes */}
                    {(parsedInfo.motivo || parsedInfo.detalhes) && (
                      <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-xl p-4 border-2 border-red-200/50 dark:border-red-800/30">
                        {parsedInfo.motivo && (
                          <div className="mb-3">
                            <div className="flex items-center gap-2 mb-1.5">
                              <AlertTriangle
                                size={16}
                                className="text-red-600 dark:text-red-400"
                              />
                              <span className="text-xs font-bold uppercase tracking-wide text-red-700 dark:text-red-300">
                                Motivo
                              </span>
                            </div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white pl-6">
                              {parsedInfo.motivo}
                            </p>
                          </div>
                        )}
                        {parsedInfo.detalhes && (
                          <div>
                            <div className="flex items-center gap-2 mb-1.5">
                              <FileText
                                size={16}
                                className="text-orange-600 dark:text-orange-400"
                              />
                              <span className="text-xs font-bold uppercase tracking-wide text-orange-700 dark:text-orange-300">
                                Detalhes
                              </span>
                            </div>
                            <p className="text-sm text-gray-800 dark:text-gray-200 pl-6 leading-relaxed">
                              {parsedInfo.detalhes}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Grid de Informações */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Hub */}
                      {parsedInfo.hub && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 border border-blue-200/50 dark:border-blue-800/30">
                          <div className="flex items-center gap-2 mb-1">
                            <Building
                              size={14}
                              className="text-blue-600 dark:text-blue-400"
                            />
                            <span className="text-xs font-bold uppercase tracking-wide text-blue-700 dark:text-blue-300">
                              Hub
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white pl-5">
                            {parsedInfo.hub}
                          </p>
                        </div>
                      )}

                      {/* Quantidade de Pacotes */}
                      {parsedInfo.qtd && (
                        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3 border border-purple-200/50 dark:border-purple-800/30">
                          <div className="flex items-center gap-2 mb-1">
                            <Package
                              size={14}
                              className="text-purple-600 dark:text-purple-400"
                            />
                            <span className="text-xs font-bold uppercase tracking-wide text-purple-700 dark:text-purple-300">
                              Quantidade
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white pl-5">
                            {parsedInfo.qtd}{" "}
                            {parsedInfo.qtd === "1" ? "pacote" : "pacotes"}
                          </p>
                        </div>
                      )}

                      {/* Regiões */}
                      {parsedInfo.regioes && parsedInfo.regioes.length > 0 && (
                        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 border border-green-200/50 dark:border-green-800/30 md:col-span-2">
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin
                              size={14}
                              className="text-green-600 dark:text-green-400"
                            />
                            <span className="text-xs font-bold uppercase tracking-wide text-green-700 dark:text-green-300">
                              Regiões de Entrega
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2 pl-5">
                            {parsedInfo.regioes.map(
                              (regiao: string, idx: number) => (
                                <span
                                  key={idx}
                                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-100 dark:bg-green-800/40 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700"
                                >
                                  {regiao}
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      )}

                      {/* Veículos */}
                      {parsedInfo.veiculos &&
                        parsedInfo.veiculos.length > 0 && (
                          <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-3 border border-indigo-200/50 dark:border-indigo-800/30 md:col-span-2">
                            <div className="flex items-center gap-2 mb-2">
                              <Truck
                                size={14}
                                className="text-indigo-600 dark:text-indigo-400"
                              />
                              <span className="text-xs font-bold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">
                                Veículos Necessários
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2 pl-5">
                              {parsedInfo.veiculos.map(
                                (veiculo: string, idx: number) => (
                                  <span
                                    key={idx}
                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-100 dark:bg-indigo-800/40 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700 capitalize"
                                  >
                                    {veiculo}
                                  </span>
                                )
                              )}
                            </div>
                          </div>
                        )}

                      {/* Volumoso */}
                      {parsedInfo.volumoso && (
                        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3 border-2 border-orange-300 dark:border-orange-700 md:col-span-2">
                          <div className="flex items-center gap-2">
                            <Weight
                              size={16}
                              className="text-orange-600 dark:text-orange-400"
                            />
                            <span className="text-sm font-bold uppercase tracking-wide text-orange-700 dark:text-orange-300">
                              ⚠️ Carga Volumosa
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Localização (se não foi parseada) */}
                    {parsedInfo.loc && parsedInfo.loc !== call.location && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 border border-blue-200/50 dark:border-blue-800/30">
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin
                            size={14}
                            className="text-blue-600 dark:text-blue-400"
                          />
                          <span className="text-xs font-bold uppercase tracking-wide text-blue-700 dark:text-blue-300">
                            Localização
                          </span>
                        </div>
                        {isGoogleLink(parsedInfo.loc) ? (
                          <a
                            href={parsedInfo.loc}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-semibold text-blue-700 dark:text-blue-300 hover:underline flex items-center gap-2 pl-5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Abrir no Google Maps
                            <ExternalLink size={12} />
                          </a>
                        ) : (
                          <p className="text-sm text-gray-800 dark:text-gray-200 pl-5 break-all">
                            {parsedInfo.loc}
                          </p>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  // Fallback para descrição não parseada
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
                      <FileText size={12} /> <span>Descrição</span>
                    </div>
                    <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                      {call.description}
                    </p>
                  </div>
                )}
              </div>
            );
          })()}
      </CardContent>
    </Card>
  );
}
