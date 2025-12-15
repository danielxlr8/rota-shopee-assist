import React from "react";
import { Building, Truck, Phone, Camera, Clock, Mountain } from "lucide-react";
import { cn } from "../../lib/utils";
import { formatPhoneNumber } from "../../utils/formatting";
import { Loading } from "../ui/loading";
import type { Driver, SupportCall } from "../../types/logistics";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ProfileHeaderCardProps {
  driver: Driver;
  onEditClick: () => void;
  isUploading: boolean;
  activeCall: SupportCall | null;
  theme?: "light" | "dark";
  currentDateTime?: Date;
}

const statusConfig = {
  DISPONIVEL: {
    label: "Disponível",
    color: "bg-emerald-500",
    text: "text-emerald-400",
    glow: "shadow-emerald-500/50",
  },
  INDISPONIVEL: {
    label: "Indisponível",
    color: "bg-red-500",
    text: "text-red-400",
    glow: "shadow-red-500/50",
  },
  EM_ROTA: {
    label: "Em Rota",
    color: "bg-blue-500",
    text: "text-blue-400",
    glow: "shadow-blue-500/50",
  },
  OFFLINE: {
    label: "Offline",
    color: "bg-slate-500",
    text: "text-slate-400",
    glow: "shadow-slate-500/50",
  },
};

export const ProfileHeaderCard: React.FC<ProfileHeaderCardProps> = ({
  driver,
  onEditClick,
  isUploading,
  activeCall,
  theme = "light",
  currentDateTime = new Date(),
}) => {
  if (!driver) return null;

  const status =
    activeCall && activeCall.status === "ABERTO"
      ? {
          label: "Aguardando Apoio",
          color: "bg-orange-500",
          dotColor: "bg-orange-500",
        }
      : statusConfig[driver.status as keyof typeof statusConfig] ||
        statusConfig.OFFLINE;

  const isAvailable = driver.status === "DISPONIVEL";
  const statusColor = isAvailable ? "bg-emerald-500" : "bg-red-500";

  return (
    <div className="mb-8">
      <div className={cn(
        "relative overflow-hidden rounded-3xl p-6 border-2 shadow-xl transition-all duration-300",
        theme === "dark"
          ? "bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 border-orange-500/40"
          : "bg-white/95 border-orange-200/60"
      )}
        style={theme === "dark" ? {
          boxShadow: "0 20px 40px -10px rgba(238, 77, 45, 0.2), 0 0 0 1px rgba(238, 77, 45, 0.1)",
        } : {
          boxShadow: "0 20px 40px -10px rgba(238, 77, 45, 0.15), 0 0 0 1px rgba(238, 77, 45, 0.1)",
        }}
      >
        {/* Data e Hora no topo */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-orange-200/30">
          <div className="flex items-center gap-2">
            <Clock size={20} className={cn(
              theme === "dark" ? "text-orange-400" : "text-orange-600"
            )} />
            <div className="flex flex-col">
              <span className={cn(
                "text-2xl font-bold",
                theme === "dark" ? "text-white" : "text-slate-900"
              )}>
                {format(currentDateTime, "HH:mm:ss", { locale: ptBR })}
              </span>
              <span className={cn(
                "text-sm",
                theme === "dark" ? "text-slate-400" : "text-slate-600"
              )}>
                {format(currentDateTime, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </span>
            </div>
          </div>
        </div>

        <div className="relative flex items-start gap-6">
          {/* Foto de perfil à esquerda - estilo da foto */}
          <div className="relative flex-shrink-0">
            <div
              className="w-24 h-24 rounded-2xl overflow-hidden relative group"
              style={{
                background: "linear-gradient(135deg, #FFA832 0%, #FE8330 50%, #FE5F2F 100%)",
              }}
            >
              {driver.avatar ? (
                <img
                  src={driver.avatar}
                  alt={driver.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-white"
                  style={{
                    background: "linear-gradient(135deg, rgba(255, 168, 50, 0.8) 0%, rgba(254, 95, 47, 0.9) 100%)",
                  }}
                >
                  <Mountain size={32} className="mb-1 opacity-80" />
                  <span className="text-xs font-bold">{driver.name}</span>
                </div>
              )}
              <button
                onClick={onEditClick}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-2xl"
              >
                <Camera className="text-white w-5 h-5" />
              </button>
              {isUploading && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm rounded-2xl">
                  <Loading size="sm" variant="spinner" />
                </div>
              )}
            </div>
            {/* Ponto de status no canto inferior direito da foto */}
            <div
              className={cn(
                "absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4",
                theme === "dark" ? "border-slate-800" : "border-white",
                statusColor
              )}
            />
          </div>

          {/* Informações à direita */}
          <div className="flex-1 min-w-0">
            {/* Nome e Status no topo direito */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1 min-w-0">
                <h2 className={cn(
                  "text-3xl font-bold mb-2 truncate",
                  theme === "dark" ? "text-white" : "text-slate-900"
                )}>
                  {driver.name}
                </h2>
              </div>

              {/* Status badge no topo direito */}
              <div
                className={cn(
                  "px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 flex-shrink-0 border-2",
                  theme === "dark"
                    ? statusColor === "bg-red-500"
                      ? "text-red-400 bg-red-500/15 border-red-500/40"
                      : "text-emerald-400 bg-emerald-500/15 border-emerald-500/40"
                    : statusColor === "bg-red-500"
                    ? "text-red-700 bg-red-50 border-red-300"
                    : "text-emerald-700 bg-emerald-50 border-emerald-300"
                )}
              >
                <div className={cn("w-2.5 h-2.5 rounded-full", statusColor)} />
                {status.label}
              </div>
            </div>

            {/* Localização */}
            <div className="mb-3">
              <div className={cn(
                "flex items-center gap-2 text-base",
                theme === "dark" ? "text-slate-300" : "text-slate-700"
              )}>
                <Building size={18} className={cn(
                  theme === "dark" ? "text-orange-400" : "text-orange-600"
                )} />
                <span className="font-medium">
                  {driver.hub ? driver.hub.split("_")[2] || driver.hub : "Sem Hub"}
                </span>
              </div>
            </div>

            {/* Tipo de Veículo e Telefone - estilo da foto */}
            <div className="flex flex-col gap-2">
              <div className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm border-2 transition-all",
                theme === "dark"
                  ? "bg-slate-800/60 border-orange-500/40"
                  : "bg-white border-orange-300"
              )}>
                <Truck size={18} className={cn(
                  theme === "dark" ? "text-orange-400" : "text-orange-600"
                )} />
                <span className={cn(
                  "capitalize font-semibold",
                  theme === "dark" ? "text-white" : "text-slate-900"
                )}>
                  {driver.vehicleType || "N/A"}
                </span>
              </div>
              <div className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm border-2 transition-all",
                theme === "dark"
                  ? "bg-slate-800/60 border-orange-500/40"
                  : "bg-white border-orange-300"
              )}>
                <Phone size={18} className={cn(
                  theme === "dark" ? "text-orange-400" : "text-orange-600"
                )} />
                <span className={cn(
                  "font-semibold",
                  theme === "dark" ? "text-white" : "text-slate-900"
                )}>
                  {formatPhoneNumber(driver.phone)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

