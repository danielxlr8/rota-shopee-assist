import React from "react";
import {
  Building,
  Package,
  Truck,
  MapPin,
  Download,
  Image as ImageIcon,
  Weight,
  AlertTriangle,
  FileText,
} from "lucide-react";
import { UrgencyBadge } from "./UrgencyBadge";
import { Loading } from "../../ui/loading";
import { cn } from "../../../lib/utils";
import type { SupportCall } from "../../../types/logistics";

interface OpenCallCardProps {
  call: SupportCall;
  acceptingCallId: string | null;
  onAccept: (callId: string) => void;
}

export const OpenCallCard: React.FC<OpenCallCardProps> = ({
  call,
  acceptingCallId,
  onAccept,
}) => {
  const isAccepting = acceptingCallId === call.id;

  // Parsear descrição para extrair informações
  const parseDescription = (desc: string) => {
    if (!desc) return null;
    const info: any = {};

    const motivoMatch = desc.match(/MOTIVO:\s*([^.]+)/i);
    if (motivoMatch) info.motivo = motivoMatch[1].trim();

    const detalhesMatch = desc.match(/DETALHES:\s*([^.]+(?:\.[^H]|$))/i);
    if (detalhesMatch) info.detalhes = detalhesMatch[1].trim();

    const regioesMatch = desc.match(/Regiões:\s*([^.]+)/i);
    if (regioesMatch) {
      info.regioes = regioesMatch[1]
        .split(",")
        .map((r: string) => r.trim())
        .filter(Boolean);
    }

    info.volumoso = /VOLUMOSO/i.test(desc);

    return Object.keys(info).length > 0 ? info : null;
  };

  const parsedInfo = call.description
    ? parseDescription(call.description)
    : null;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl p-4 group transition-all border-l-4 border-l-primary border border-border shadow-lg backdrop-blur-xl",
        "dark:bg-gradient-to-br dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 dark:border-slate-600/50",
        "bg-white/80 border-orange-200/50"
      )}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-primary font-bold text-sm bg-primary/15 border border-primary/30">
            {call.solicitante.initials}
          </div>
          <div>
            <h4
              className={cn(
                "font-bold text-sm",
                "dark:text-white text-slate-800"
              )}
            >
              {call.solicitante.name}
            </h4>
            <div
              className={cn(
                "flex items-center gap-1 text-xs",
                "dark:text-slate-300 text-slate-600"
              )}
            >
              <Building size={10} />
              <span className="truncate max-w-[150px]">
                {call.hub?.split("_")[2]}
              </span>
            </div>
          </div>
        </div>
        <UrgencyBadge urgency={call.urgency} />
      </div>

      {/* Motivo */}
      {parsedInfo?.motivo && (
        <div
          className={cn(
            "mb-3 p-2.5 rounded-lg border",
            "dark:bg-red-900/20 dark:border-red-800/30",
            "bg-red-50 border-red-200/50"
          )}
        >
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle
              size={12}
              className="text-red-600 dark:text-red-400"
            />
            <span className="text-[10px] font-bold uppercase tracking-wide text-red-700 dark:text-red-300">
              Motivo
            </span>
          </div>
          <p className="text-xs font-semibold text-gray-900 dark:text-white pl-4 break-words overflow-wrap-anywhere">
            {parsedInfo.motivo}
          </p>
        </div>
      )}

      {/* Detalhes */}
      {parsedInfo?.detalhes && (
        <div
          className={cn(
            "mb-3 p-2.5 rounded-lg border",
            "dark:bg-orange-900/20 dark:border-orange-800/30",
            "bg-orange-50 border-orange-200/50"
          )}
        >
          <div className="flex items-center gap-2 mb-1">
            <FileText
              size={12}
              className="text-orange-600 dark:text-orange-400"
            />
            <span className="text-[10px] font-bold uppercase tracking-wide text-orange-700 dark:text-orange-300">
              Detalhes
            </span>
          </div>
          <p className="text-xs text-gray-800 dark:text-gray-200 pl-4 leading-relaxed break-words overflow-wrap-anywhere">
            {parsedInfo.detalhes}
          </p>
        </div>
      )}

      <div className="flex gap-2 mb-4">
        <div className="flex-1 rounded-xl px-3 py-2 bg-muted/50 border border-border">
          <span className="text-[10px] font-bold text-muted-foreground uppercase block">
            Pacotes
          </span>
          <span
            className={cn(
              "font-bold text-lg flex items-center gap-1",
              "dark:text-white text-slate-800"
            )}
          >
            <Package size={16} className="text-primary" /> {call.packageCount}
          </span>
        </div>
        <div
          className={cn(
            "flex-1 rounded-xl px-3 py-2 border",
            "dark:bg-slate-700/50 dark:border-slate-600/50",
            "bg-orange-50/80 border-orange-200/50"
          )}
        >
          <span
            className={cn(
              "text-[10px] font-bold uppercase block",
              "dark:text-slate-300 text-slate-600"
            )}
          >
            Veículo
          </span>
          <span
            className={cn(
              "font-bold text-sm flex items-center gap-1 capitalize h-7",
              "dark:text-white text-slate-800"
            )}
          >
            <Truck size={16} className="text-primary" /> {call.vehicleType}
          </span>
        </div>
      </div>

      {/* Volumoso */}
      {(parsedInfo?.volumoso || call.isBulky) && (
        <div
          className={cn(
            "mb-3 p-2.5 rounded-lg border-2",
            "dark:bg-orange-900/20 dark:border-orange-700",
            "bg-orange-50 border-orange-300"
          )}
        >
          <div className="flex items-center gap-2">
            <Weight
              size={14}
              className="text-orange-600 dark:text-orange-400"
            />
            <span className="text-[10px] font-bold uppercase tracking-wide text-orange-700 dark:text-orange-300">
              Volumoso
            </span>
          </div>
        </div>
      )}

      {/* Regiões de Entrega */}
      {(parsedInfo?.regioes && parsedInfo.regioes.length > 0) ||
      (call.deliveryRegions && call.deliveryRegions.length > 0) ? (
        <div
          className={cn(
            "mb-3 p-2.5 rounded-lg border",
            "dark:bg-green-900/20 dark:border-green-800/30",
            "bg-green-50 border-green-200/50"
          )}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <MapPin size={12} className="text-green-600 dark:text-green-400" />
            <span className="text-[10px] font-bold uppercase tracking-wide text-green-700 dark:text-green-300">
              Regiões de Entrega
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 pl-4">
            {(parsedInfo?.regioes || call.deliveryRegions || [])
              .slice(0, 3)
              .map((regiao: string, idx: number) => (
                <span
                  key={idx}
                  className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-semibold border",
                    "dark:bg-green-800/40 dark:text-green-300 dark:border-green-700",
                    "bg-green-100 text-green-700 border-green-300"
                  )}
                >
                  {regiao}
                </span>
              ))}
            {(parsedInfo?.regioes || call.deliveryRegions || []).length > 3 && (
              <span
                className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-semibold",
                  "dark:bg-gray-800 text-gray-400",
                  "bg-gray-100 text-gray-600"
                )}
              >
                +
                {(parsedInfo?.regioes || call.deliveryRegions || []).length - 3}
              </span>
            )}
          </div>
        </div>
      ) : null}

      {/* Foto da Carga */}
      {call.cargoPhotoUrl && (
        <div className="mb-3 p-2 rounded-xl bg-primary/10 border border-primary/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon size={16} className="text-primary" />
              <span className="text-xs font-semibold text-foreground">
                Foto da Carga Disponível
              </span>
            </div>
            <a
              href={call.cargoPhotoUrl}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-primary-foreground bg-primary hover:bg-primary/90 transition-all shadow-md"
            >
              <Download size={14} />
              <span>Baixar Foto</span>
            </a>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div
          className={cn(
            "flex-1 flex items-center gap-2 text-xs p-2 rounded-xl truncate min-w-[200px] border",
            "dark:bg-slate-700/50 dark:border-slate-600/50 dark:text-slate-300",
            "bg-orange-50/80 border-orange-200/50 text-slate-700"
          )}
        >
          <MapPin
            size={14}
            className="shrink-0 dark:text-slate-300 text-slate-600"
          />
          <span className="truncate">{call.location}</span>
        </div>
        <button
          onClick={() => onAccept(call.id)}
          disabled={!!acceptingCallId}
          className="px-4 py-2 rounded-xl text-xs font-bold text-primary-foreground bg-primary hover:bg-primary/90 transition-all disabled:opacity-50 shadow-lg"
        >
          {isAccepting ? <Loading size="sm" variant="spinner" /> : "ACEITAR"}
        </button>
      </div>
    </div>
  );
};
