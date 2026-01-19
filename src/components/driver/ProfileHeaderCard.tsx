import React from "react";
import { Building, Truck, Phone, Camera, Clock } from "lucide-react";
import { cn } from "../../lib/utils";
import { formatPhoneNumber } from "../../utils/formatting";
import { Loading } from "../ui/loading";
import type { Driver, SupportCall } from "../../types/logistics";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { WeatherForecast } from "../WeatherForecast";
import { getCityFromHub, normalizeHub } from "../../constants/hubs";

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

  // Cores mágicas Shopee
  const shopeeGradientLight = "linear-gradient(135deg, #FFA832 0%, #FE8330 50%, #FE5F2F 100%)";
  const shopeeGradientDark = "linear-gradient(135deg, #FE5F2F 0%, #FD3A2D 50%, #EE4D2D 100%)";
  const shopeeBackgroundLight = "linear-gradient(135deg, #FFF5F0 0%, #FFE8E0 50%, #FFDBD0 100%)";
  const shopeeBackgroundDark = "linear-gradient(135deg, #1a0a05 0%, #2d0f08 50%, #1a0a05 100%)";

  return (
    <div className="mb-8">
      <div
        className={cn(
          "relative overflow-hidden rounded-3xl border-2 shadow-2xl transition-all duration-500",
          theme === "dark"
            ? "border-orange-500/40"
            : "border-orange-300/60"
        )}
        style={
          theme === "dark"
            ? {
                background: shopeeBackgroundDark,
                boxShadow:
                  "0 25px 50px -12px rgba(254, 95, 47, 0.3), 0 0 0 1px rgba(254, 95, 47, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
              }
            : {
                background: shopeeBackgroundLight,
                boxShadow:
                  "0 25px 50px -12px rgba(254, 95, 47, 0.2), 0 0 0 1px rgba(254, 95, 47, 0.15)",
              }
        }
      >
        {/* Efeitos mágicos de fundo */}
        <div className="absolute inset-0 opacity-30">
          <div
            className="absolute top-0 left-0 w-96 h-96 rounded-full blur-3xl"
            style={{
              background: theme === "dark" ? "rgba(254, 95, 47, 0.2)" : "rgba(255, 168, 50, 0.3)",
              transform: "translate(-50%, -50%)",
            }}
          />
          <div
            className="absolute bottom-0 right-0 w-96 h-96 rounded-full blur-3xl"
            style={{
              background: theme === "dark" ? "rgba(253, 58, 45, 0.2)" : "rgba(254, 131, 48, 0.3)",
              transform: "translate(50%, 50%)",
            }}
          />
        </div>

        {/* Conteúdo */}
        <div className="relative z-10 p-6 md:p-8">
          {/* Header com hora e nome */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6 pb-6 border-b border-orange-500/20">
            {/* Data e Hora */}
            <div className="flex items-center gap-3">
              <div
                className="p-3 rounded-xl"
                style={{
                  background: theme === "dark" ? "rgba(254, 95, 47, 0.2)" : "rgba(255, 168, 50, 0.2)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <Clock
                  size={24}
                  className={theme === "dark" ? "text-orange-400" : "text-orange-600"}
                />
              </div>
              <div className="flex flex-col">
                <span
                  className={cn(
                    "text-2xl md:text-3xl font-bold tracking-tight",
                    theme === "dark" ? "text-white" : "text-slate-900"
                  )}
                  style={{
                    textShadow: theme === "dark" ? "0 2px 10px rgba(254, 95, 47, 0.3)" : "none",
                  }}
                >
                  {format(currentDateTime, "HH:mm:ss", { locale: ptBR })}
                </span>
                <span
                  className={cn(
                    "text-sm md:text-base mt-1",
                    theme === "dark" ? "text-slate-300" : "text-slate-600"
                  )}
                >
                  {format(currentDateTime, "EEEE, dd 'de' MMMM 'de' yyyy", {
                    locale: ptBR,
                  })}
                </span>
              </div>
            </div>

            {/* Nome do Motorista */}
            <div className="flex items-center gap-3">
              <div
                className="relative overflow-hidden rounded-2xl group cursor-pointer transition-transform duration-300 hover:scale-105"
                style={{
                  background: theme === "dark" ? shopeeGradientDark : shopeeGradientLight,
                  width: "80px",
                  height: "80px",
                }}
              >
                {driver.avatar ? (
                  <img
                    src={driver.avatar}
                    alt={driver.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">
                      {driver.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </span>
                  </div>
                )}
                <button
                  onClick={onEditClick}
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300"
                >
                  <Camera className="text-white w-5 h-5" />
                </button>
                {isUploading && (
                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center backdrop-blur-sm">
                    <Loading size="sm" variant="spinner" />
                  </div>
                )}
                {/* Ponto de status */}
                <div
                  className={cn(
                    "absolute -bottom-1 -right-1 w-7 h-7 rounded-full border-4 shadow-lg",
                    theme === "dark" ? "border-slate-900" : "border-white",
                    statusColor
                  )}
                  style={{
                    boxShadow: `0 0 15px ${statusColor === "bg-emerald-500" ? "rgba(16, 185, 129, 0.6)" : "rgba(239, 68, 68, 0.6)"}`,
                  }}
                />
              </div>
              <div className="flex flex-col">
                <h2
                  className={cn(
                    "text-2xl md:text-3xl font-bold mb-1",
                    theme === "dark" ? "text-white" : "text-slate-900"
                  )}
                  style={{
                    textShadow: theme === "dark" ? "0 2px 10px rgba(254, 95, 47, 0.2)" : "none",
                  }}
                >
                  {driver.name}
                </h2>
                {/* Status badge */}
                <div
                  className={cn(
                    "inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border w-fit",
                    theme === "dark"
                      ? statusColor === "bg-red-500"
                        ? "text-red-400 bg-red-500/20 border-red-500/40"
                        : "text-emerald-400 bg-emerald-500/20 border-emerald-500/40"
                      : statusColor === "bg-red-500"
                      ? "text-red-700 bg-red-50 border-red-300"
                      : "text-emerald-700 bg-emerald-50 border-emerald-300"
                  )}
                  style={{
                    boxShadow: theme === "dark" 
                      ? `0 0 10px ${statusColor === "bg-emerald-500" ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`
                      : "none",
                  }}
                >
                  <div className={cn("w-2 h-2 rounded-full animate-pulse", statusColor)} />
                  {status.label}
                </div>
              </div>
            </div>
          </div>

          {/* Informações do Motorista */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Hub/Localização */}
            <div
              className={cn(
                "flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-300",
                theme === "dark"
                  ? "bg-slate-900/40 border-orange-500/30 backdrop-blur-sm"
                  : "bg-white/80 border-orange-300/50"
              )}
              style={{
                boxShadow: theme === "dark"
                  ? "0 4px 15px rgba(254, 95, 47, 0.1)"
                  : "0 2px 10px rgba(254, 95, 47, 0.1)",
              }}
            >
              <div
                className="p-2 rounded-lg"
                style={{
                  background: theme === "dark" ? "rgba(254, 95, 47, 0.2)" : "rgba(255, 168, 50, 0.2)",
                }}
              >
                <Building
                  size={20}
                  className={theme === "dark" ? "text-orange-400" : "text-orange-600"}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className={cn("text-xs font-medium mb-0.5", theme === "dark" ? "text-slate-400" : "text-slate-500")}>
                  Hub
                </div>
                <div className={cn("text-base font-semibold truncate", theme === "dark" ? "text-white" : "text-slate-900")}>
                  {driver.hub
                    ? normalizeHub(driver.hub).split("PR ")[1] || normalizeHub(driver.hub)
                    : "Sem Hub"}
                </div>
              </div>
            </div>

            {/* Tipo de Veículo */}
            <div
              className={cn(
                "flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-300",
                theme === "dark"
                  ? "bg-slate-900/40 border-orange-500/30 backdrop-blur-sm"
                  : "bg-white/80 border-orange-300/50"
              )}
              style={{
                boxShadow: theme === "dark"
                  ? "0 4px 15px rgba(254, 95, 47, 0.1)"
                  : "0 2px 10px rgba(254, 95, 47, 0.1)",
              }}
            >
              <div
                className="p-2 rounded-lg"
                style={{
                  background: theme === "dark" ? "rgba(254, 95, 47, 0.2)" : "rgba(255, 168, 50, 0.2)",
                }}
              >
                <Truck
                  size={20}
                  className={theme === "dark" ? "text-orange-400" : "text-orange-600"}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className={cn("text-xs font-medium mb-0.5", theme === "dark" ? "text-slate-400" : "text-slate-500")}>
                  Veículo
                </div>
                <div className={cn("text-base font-semibold capitalize", theme === "dark" ? "text-white" : "text-slate-900")}>
                  {driver.vehicleType || "N/A"}
                </div>
              </div>
            </div>

            {/* Telefone */}
            <div
              className={cn(
                "flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-300 md:col-span-2",
                theme === "dark"
                  ? "bg-slate-900/40 border-orange-500/30 backdrop-blur-sm"
                  : "bg-white/80 border-orange-300/50"
              )}
              style={{
                boxShadow: theme === "dark"
                  ? "0 4px 15px rgba(254, 95, 47, 0.1)"
                  : "0 2px 10px rgba(254, 95, 47, 0.1)",
              }}
            >
              <div
                className="p-2 rounded-lg"
                style={{
                  background: theme === "dark" ? "rgba(254, 95, 47, 0.2)" : "rgba(255, 168, 50, 0.2)",
                }}
              >
                <Phone
                  size={20}
                  className={theme === "dark" ? "text-orange-400" : "text-orange-600"}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className={cn("text-xs font-medium mb-0.5", theme === "dark" ? "text-slate-400" : "text-slate-500")}>
                  Telefone
                </div>
                <div className={cn("text-base font-semibold", theme === "dark" ? "text-white" : "text-slate-900")}>
                  {formatPhoneNumber(driver.phone)}
                </div>
              </div>
            </div>
          </div>

          {/* Previsão do Tempo */}
          <div className="mt-6 pt-6 border-t border-orange-500/20">
            <WeatherForecast
              city={getCityFromHub(driver.hub)}
              hub={driver.hub}
              theme={theme}
              showDetailed={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
