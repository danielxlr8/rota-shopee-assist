import React from "react";
import { CheckCircle, XCircle, Zap, AlertTriangle, Search, Ticket } from "lucide-react";
import { cn } from "../../lib/utils";
import type { Driver, SupportCall } from "../../types/logistics";
import { OpenCallCard } from "./components/OpenCallCard";

interface StatusSectionProps {
  driver: Driver;
  onAvailabilityChange: (available: boolean) => void;
  filteredOpenCalls: SupportCall[];
  routeIdSearch: string;
  onRouteIdSearchChange: (value: string) => void;
  acceptingCallId: string | null;
  onAcceptCall: (callId: string) => void;
  theme?: "light" | "dark";
}

export const StatusSection: React.FC<StatusSectionProps> = ({
  driver,
  onAvailabilityChange,
  filteredOpenCalls,
  routeIdSearch,
  onRouteIdSearchChange,
  acceptingCallId,
  onAcceptCall,
  theme = "light",
}) => {
  return (
    <div className="space-y-6 tab-content-enter">
      {/* Card de Status Moderno */}
      <div className={cn(
        "relative overflow-hidden rounded-2xl p-6 border shadow-lg transition-all duration-300 backdrop-blur-xl",
        theme === "dark"
          ? "bg-slate-800/90 border-orange-500/30"
          : "bg-white/80 border-orange-200/50"
      )}>
        <div
          className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-10"
          style={{
            background:
              driver.status === "DISPONIVEL"
                ? "radial-gradient(circle, rgba(16, 185, 129, 0.4) 0%, transparent 70%)"
                : "radial-gradient(circle, rgba(239, 68, 68, 0.4) 0%, transparent 70%)",
          }}
        />

        <div className="relative">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className={cn(
                "font-bold text-xl mb-1",
                theme === "dark" ? "text-white" : "text-slate-800"
              )}>
                Status de Operação
              </h3>
              <p className={cn(
                "text-sm",
                theme === "dark" ? "text-slate-300" : "text-slate-600"
              )}>
                Gerencie sua disponibilidade
              </p>
            </div>
            {/* Badge de status */}
            <div
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border",
                driver.status === "DISPONIVEL"
                  ? theme === "dark"
                    ? "text-emerald-400 bg-emerald-500/15 border-emerald-500/30"
                    : "text-emerald-600 bg-emerald-500/15 border-emerald-500/30"
                  : theme === "dark"
                    ? "text-red-400 bg-red-500/15 border-red-500/30"
                    : "text-red-600 bg-red-500/15 border-red-500/30"
              )}
            >
              <div
                className={cn(
                  "w-2 h-2 rounded-full animate-pulse",
                  driver.status === "DISPONIVEL" ? "bg-emerald-400" : "bg-red-400"
                )}
              />
              {driver.status === "DISPONIVEL" ? "Online" : "Offline"}
            </div>
          </div>

          {/* Toggle Switch Moderno e Minimalista */}
          <div className={cn(
            "flex gap-3 mb-6 p-1 rounded-xl border",
            theme === "dark"
              ? "bg-slate-700/50 border-orange-500/30"
              : "bg-orange-50/80 border-orange-200/50"
          )}>
            <button
              onClick={() => onAvailabilityChange(true)}
              className={cn(
                "flex-1 py-4 px-6 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2",
                driver.status === "DISPONIVEL"
                  ? "text-white bg-emerald-500 shadow-lg"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <CheckCircle size={18} />
              <span>Disponível</span>
            </button>
            <button
              onClick={() => onAvailabilityChange(false)}
              className={cn(
                "flex-1 py-4 px-6 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2",
                driver.status !== "DISPONIVEL"
                  ? "text-white bg-red-500 shadow-lg"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <XCircle size={18} />
              <span>Indisponível</span>
            </button>
          </div>

          {/* Card de informação minimalista */}
          <div
            className={cn(
              "p-4 rounded-xl border",
              driver.status === "DISPONIVEL"
                ? "bg-emerald-500/10 border-emerald-500/20"
                : "bg-red-500/10 border-red-500/20"
            )}
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "p-2 rounded-lg",
                  driver.status === "DISPONIVEL"
                    ? theme === "dark"
                      ? "text-emerald-400 bg-emerald-500/15"
                      : "text-emerald-600 bg-emerald-500/15"
                    : theme === "dark"
                      ? "text-red-400 bg-red-500/15"
                      : "text-red-600 bg-red-500/15"
                )}
              >
                {driver.status === "DISPONIVEL" ? (
                  <Zap size={20} />
                ) : (
                  <AlertTriangle size={20} />
                )}
              </div>
              <div className="flex-1">
                <p
                  className={cn(
                    "font-semibold text-sm mb-1",
                    driver.status === "DISPONIVEL"
                      ? theme === "dark"
                        ? "text-emerald-400"
                        : "text-emerald-600"
                      : theme === "dark"
                        ? "text-red-400"
                        : "text-red-600"
                  )}
                >
                  {driver.status === "DISPONIVEL"
                    ? "Pronto para receber chamados"
                    : "Você está indisponível"}
                </p>
                <p className={cn(
                  "text-xs leading-relaxed",
                  theme === "dark" ? "text-slate-300" : "text-slate-600"
                )}>
                  {driver.status === "DISPONIVEL"
                    ? "Você receberá notificações de novos chamados de apoio na sua região."
                    : "Você não receberá novos chamados enquanto estiver indisponível."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {driver.status === "DISPONIVEL" && (
        <div className={cn(
          "relative overflow-hidden rounded-2xl p-6 border shadow-lg tab-content-enter transition-all duration-300 backdrop-blur-xl",
          theme === "dark"
            ? "bg-slate-800/90 border-orange-500/30"
            : "bg-white/80 border-orange-200/50"
        )}>
          <div className="flex justify-between items-center mb-4">
            <h3 className={cn(
              "font-bold text-lg",
              theme === "dark" ? "text-white" : "text-slate-800"
            )}>
              Chamados na Região
            </h3>
            <div
              className="px-3 py-1 rounded-full text-xs font-semibold text-orange-400"
              style={{
                background: "rgba(249, 115, 22, 0.15)",
                border: "1px solid rgba(249, 115, 22, 0.3)",
              }}
            >
              {filteredOpenCalls.length} ativos
            </div>
          </div>

          <div className="relative mb-4">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={18}
            />
            <input
              type="text"
              placeholder="Filtrar rota..."
              value={routeIdSearch}
              onChange={(e) => onRouteIdSearchChange(e.target.value)}
              className={cn(
                "w-full pl-10 pr-4 py-3 rounded-xl text-sm border outline-none transition-all focus:ring-2 focus:ring-orange-500/50",
                theme === "dark"
                  ? "bg-orange-500/20 border-orange-500/30 text-white placeholder:text-slate-400"
                  : "bg-white border-orange-200/50 text-slate-800 placeholder:text-slate-500"
              )}
            />
          </div>

          <div className="space-y-3">
            {filteredOpenCalls.length > 0 ? (
              filteredOpenCalls.map((call) => (
                <OpenCallCard
                  key={call.id}
                  call={call}
                  acceptingCallId={acceptingCallId}
                  onAccept={onAcceptCall}
                />
              ))
            ) : (
              <div className={cn(
                "text-center py-12 rounded-xl border border-dashed",
                theme === "dark"
                  ? "bg-slate-700/50 border-orange-500/30"
                  : "bg-orange-50/80 border-orange-200/50"
              )}>
                <Ticket
                  size={32}
                  className={cn(
                    "mx-auto mb-2",
                    theme === "dark" ? "text-slate-400" : "text-slate-500"
                  )}
                />
                <p className={cn(
                  "text-sm",
                  theme === "dark" ? "text-slate-300" : "text-slate-600"
                )}>
                  Nenhum chamado disponível no momento.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

