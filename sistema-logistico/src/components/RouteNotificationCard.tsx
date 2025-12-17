import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Package, MapPin, User, Truck, AlertCircle } from "lucide-react";
import type { SupportCall } from "../types/logistics";
import { cn } from "../lib/utils";

interface RouteNotificationCardProps {
  call: SupportCall;
  onClose: () => void;
  theme: "light" | "dark";
  index: number;
}

export const RouteNotificationCard: React.FC<RouteNotificationCardProps> = ({
  call,
  onClose,
  theme,
  index,
}) => {
  const urgencyColors = {
    URGENTE: "from-red-500 to-red-700",
    ALTA: "from-orange-500 to-orange-700",
    MEDIA: "from-yellow-500 to-yellow-700",
    BAIXA: "from-blue-500 to-blue-700",
  };

  const urgencyColor = urgencyColors[call.urgency] || urgencyColors.BAIXA;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 300, scale: 0.9 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 300, scale: 0.9 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
          delay: index * 0.1,
        }}
        className={cn(
          "fixed right-4 z-50 w-full max-w-sm",
          `top-${20 + index * 120}`
        )}
        style={{
          top: `${20 + index * 120}px`,
        }}
      >
        <div
          className={cn(
            "relative rounded-2xl border-2 shadow-2xl backdrop-blur-xl overflow-hidden",
            theme === "dark"
              ? "bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 border-orange-500/50"
              : "bg-white/95 border-orange-300/60"
          )}
          style={{
            boxShadow:
              theme === "dark"
                ? "0 20px 40px -10px rgba(238, 77, 45, 0.4), 0 0 0 1px rgba(238, 77, 45, 0.2)"
                : "0 20px 40px -10px rgba(238, 77, 45, 0.3), 0 0 0 1px rgba(238, 77, 45, 0.1)",
          }}
        >
          {/* Barra de urgência no topo */}
          <div
            className={cn(
              "h-1.5 w-full bg-gradient-to-r",
              urgencyColor
            )}
          />

          <div className="p-5">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "p-2.5 rounded-xl",
                    theme === "dark"
                      ? "bg-orange-500/20 border border-orange-500/40"
                      : "bg-orange-100 border border-orange-300"
                  )}
                >
                  <AlertCircle
                    size={24}
                    className={cn(
                      theme === "dark" ? "text-orange-400" : "text-orange-600"
                    )}
                  />
                </div>
                <div>
                  <h3
                    className={cn(
                      "font-bold text-lg",
                      theme === "dark" ? "text-white" : "text-slate-900"
                    )}
                  >
                    Nova Rota Disponível
                  </h3>
                  <p
                    className={cn(
                      "text-xs font-medium uppercase tracking-wide",
                      theme === "dark" ? "text-orange-400" : "text-orange-600"
                    )}
                  >
                    {call.urgency}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className={cn(
                  "p-1.5 rounded-lg transition-all hover:scale-110",
                  theme === "dark"
                    ? "text-slate-400 hover:text-white hover:bg-slate-700/50"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                )}
                aria-label="Fechar notificação"
              >
                <X size={20} />
              </button>
            </div>

            {/* Informações da rota */}
            <div className="space-y-3">
              {/* Rota ID */}
              {call.routeId && (
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "p-1.5 rounded-lg",
                      theme === "dark"
                        ? "bg-slate-800/60"
                        : "bg-orange-50"
                    )}
                  >
                    <Package
                      size={16}
                      className={cn(
                        theme === "dark" ? "text-orange-400" : "text-orange-600"
                      )}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-xs font-medium uppercase tracking-wide",
                        theme === "dark" ? "text-slate-400" : "text-slate-600"
                      )}
                    >
                      Rota ID
                    </p>
                    <p
                      className={cn(
                        "text-sm font-bold truncate",
                        theme === "dark" ? "text-white" : "text-slate-900"
                      )}
                    >
                      {call.routeId}
                    </p>
                  </div>
                </div>
              )}

              {/* Solicitante */}
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "p-1.5 rounded-lg",
                    theme === "dark"
                      ? "bg-slate-800/60"
                      : "bg-orange-50"
                  )}
                >
                  <User
                    size={16}
                    className={cn(
                      theme === "dark" ? "text-orange-400" : "text-orange-600"
                    )}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "text-xs font-medium uppercase tracking-wide",
                      theme === "dark" ? "text-slate-400" : "text-slate-600"
                    )}
                  >
                    Solicitante
                  </p>
                  <p
                    className={cn(
                      "text-sm font-bold truncate",
                      theme === "dark" ? "text-white" : "text-slate-900"
                    )}
                  >
                    {call.solicitante.name}
                  </p>
                </div>
              </div>

              {/* Localização */}
              {call.location && (
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "p-1.5 rounded-lg",
                      theme === "dark"
                        ? "bg-slate-800/60"
                        : "bg-orange-50"
                    )}
                  >
                    <MapPin
                      size={16}
                      className={cn(
                        theme === "dark" ? "text-orange-400" : "text-orange-600"
                      )}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-xs font-medium uppercase tracking-wide",
                        theme === "dark" ? "text-slate-400" : "text-slate-600"
                      )}
                    >
                      Localização
                    </p>
                    <p
                      className={cn(
                        "text-sm font-semibold truncate",
                        theme === "dark" ? "text-white" : "text-slate-900"
                      )}
                    >
                      {call.location}
                    </p>
                  </div>
                </div>
              )}

              {/* Pacotes */}
              {call.packageCount && (
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "p-1.5 rounded-lg",
                      theme === "dark"
                        ? "bg-slate-800/60"
                        : "bg-orange-50"
                    )}
                  >
                    <Package
                      size={16}
                      className={cn(
                        theme === "dark" ? "text-orange-400" : "text-orange-600"
                      )}
                    />
                  </div>
                  <div className="flex-1">
                    <p
                      className={cn(
                        "text-xs font-medium uppercase tracking-wide",
                        theme === "dark" ? "text-slate-400" : "text-slate-600"
                      )}
                    >
                      Pacotes
                    </p>
                    <p
                      className={cn(
                        "text-sm font-bold",
                        theme === "dark" ? "text-white" : "text-slate-900"
                      )}
                    >
                      {call.packageCount} {call.packageCount === 1 ? "pacote" : "pacotes"}
                    </p>
                  </div>
                </div>
              )}

              {/* Regiões de entrega */}
              {call.deliveryRegions && call.deliveryRegions.length > 0 && (
                <div className="flex items-start gap-2">
                  <div
                    className={cn(
                      "p-1.5 rounded-lg",
                      theme === "dark"
                        ? "bg-slate-800/60"
                        : "bg-orange-50"
                    )}
                  >
                    <MapPin
                      size={16}
                      className={cn(
                        theme === "dark" ? "text-orange-400" : "text-orange-600"
                      )}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-xs font-medium uppercase tracking-wide mb-1",
                        theme === "dark" ? "text-slate-400" : "text-slate-600"
                      )}
                    >
                      Regiões
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {call.deliveryRegions.slice(0, 3).map((region, idx) => (
                        <span
                          key={idx}
                          className={cn(
                            "px-2 py-1 rounded-lg text-xs font-semibold",
                            theme === "dark"
                              ? "bg-orange-500/20 text-orange-300 border border-orange-500/30"
                              : "bg-orange-100 text-orange-700 border border-orange-300"
                          )}
                        >
                          {region}
                        </span>
                      ))}
                      {call.deliveryRegions.length > 3 && (
                        <span
                          className={cn(
                            "px-2 py-1 rounded-lg text-xs font-semibold",
                            theme === "dark"
                              ? "bg-slate-700/50 text-slate-300"
                              : "bg-slate-100 text-slate-600"
                          )}
                        >
                          +{call.deliveryRegions.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Veículo */}
              {call.vehicleType && (
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "p-1.5 rounded-lg",
                      theme === "dark"
                        ? "bg-slate-800/60"
                        : "bg-orange-50"
                    )}
                  >
                    <Truck
                      size={16}
                      className={cn(
                        theme === "dark" ? "text-orange-400" : "text-orange-600"
                      )}
                    />
                  </div>
                  <div className="flex-1">
                    <p
                      className={cn(
                        "text-xs font-medium uppercase tracking-wide",
                        theme === "dark" ? "text-slate-400" : "text-slate-600"
                      )}
                    >
                      Tipo de Veículo
                    </p>
                    <p
                      className={cn(
                        "text-sm font-semibold capitalize",
                        theme === "dark" ? "text-white" : "text-slate-900"
                      )}
                    >
                      {call.vehicleType}
                    </p>
                  </div>
                </div>
              )}

              {/* Hub */}
              {call.hub && (
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "p-1.5 rounded-lg",
                      theme === "dark"
                        ? "bg-slate-800/60"
                        : "bg-orange-50"
                    )}
                  >
                    <MapPin
                      size={16}
                      className={cn(
                        theme === "dark" ? "text-orange-400" : "text-orange-600"
                      )}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-xs font-medium uppercase tracking-wide",
                        theme === "dark" ? "text-slate-400" : "text-slate-600"
                      )}
                    >
                      Hub
                    </p>
                    <p
                      className={cn(
                        "text-sm font-semibold truncate",
                        theme === "dark" ? "text-white" : "text-slate-900"
                      )}
                    >
                      {call.hub.split("_").pop() || call.hub}
                    </p>
                  </div>
                </div>
              )}

              {/* Volumoso */}
              {call.isBulky && (
                <div
                  className={cn(
                    "px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wide",
                    theme === "dark"
                      ? "bg-red-500/20 text-red-300 border border-red-500/30"
                      : "bg-red-100 text-red-700 border border-red-300"
                  )}
                >
                  ⚠️ Carga Volumosa
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};




