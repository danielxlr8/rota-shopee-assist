import React from "react";
import { useOnlineUsers } from "../hooks/usePresence";
import { Card } from "./ui/card";
import { cn } from "../lib/utils";
import { Users, UserCheck, Shield, Activity, TrendingUp } from "lucide-react";

interface OnlineUsersMonitorProps {
  theme?: "light" | "dark";
}

/**
 * Componente de Monitoramento de Usuários Online
 * Exibe estatísticas em tempo real de usuários conectados ao sistema
 * Usado no Dashboard Admin
 */
export const OnlineUsersMonitor: React.FC<OnlineUsersMonitorProps> = ({
  theme = "light",
}) => {
  const { drivers, admins, total, users } = useOnlineUsers();

  // Calcula a porcentagem de utilização
  const maxUsers = Number(import.meta.env.VITE_MAX_CONCURRENT_USERS || 50);
  const utilizationPercent = Math.round((total / maxUsers) * 100);

  // Define a cor baseada na utilização
  const getUtilizationColor = () => {
    if (utilizationPercent >= 90)
      return "text-red-500 dark:text-red-400 bg-red-500/10 border-red-500/30";
    if (utilizationPercent >= 70)
      return "text-yellow-500 dark:text-yellow-400 bg-yellow-500/10 border-yellow-500/30";
    return "text-green-500 dark:text-green-400 bg-green-500/10 border-green-500/30";
  };

  const isDark = theme === "dark";

  return (
    <Card
      className={cn(
        "border rounded-2xl shadow-xl transition-all",
        isDark
          ? "bg-slate-900/60 border-orange-500/30 backdrop-blur-xl"
          : "bg-white/80 border-orange-200/50"
      )}
    >
      <div
        className={cn(
          "p-4 border-b",
          isDark ? "border-orange-500/30" : "border-orange-200/50"
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "p-2 rounded-xl",
                isDark
                  ? "bg-orange-500/20 text-orange-300"
                  : "bg-orange-50 text-orange-600"
              )}
            >
              <Activity size={20} />
            </div>
            <div>
              <h3
                className={cn(
                  "font-bold text-sm",
                  isDark ? "text-white" : "text-slate-800"
                )}
              >
                Usuários Online
              </h3>
              <p
                className={cn(
                  "text-xs",
                  isDark ? "text-white/60" : "text-slate-600"
                )}
              >
                Monitoramento em tempo real
              </p>
            </div>
          </div>

          {/* Badge de status */}
          <div
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-bold border",
              getUtilizationColor()
            )}
          >
            {total}/{maxUsers}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Barra de Progresso */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span
              className={cn(
                "text-xs font-bold",
                isDark ? "text-white/70" : "text-slate-600"
              )}
            >
              Utilização do Servidor
            </span>
            <span
              className={cn(
                "text-xs font-bold",
                isDark ? "text-white" : "text-slate-800"
              )}
            >
              {utilizationPercent}%
            </span>
          </div>
          <div
            className={cn(
              "h-3 rounded-full overflow-hidden",
              isDark ? "bg-slate-800" : "bg-slate-200"
            )}
          >
            <div
              className={cn(
                "h-full transition-all duration-500 rounded-full",
                utilizationPercent >= 90
                  ? "bg-red-500"
                  : utilizationPercent >= 70
                  ? "bg-yellow-500"
                  : "bg-green-500"
              )}
              style={{ width: `${Math.min(utilizationPercent, 100)}%` }}
            />
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-3 gap-3">
          {/* Total */}
          <div
            className={cn(
              "p-3 rounded-xl border",
              isDark
                ? "bg-blue-500/10 border-blue-500/30"
                : "bg-blue-50 border-blue-200"
            )}
          >
            <div className="flex items-center gap-2 mb-1">
              <Users
                size={16}
                className={cn(
                  isDark ? "text-blue-300" : "text-blue-600"
                )}
              />
              <span
                className={cn(
                  "text-[10px] font-bold uppercase",
                  isDark ? "text-blue-300" : "text-blue-600"
                )}
              >
                Total
              </span>
            </div>
            <p
              className={cn(
                "text-2xl font-bold",
                isDark ? "text-white" : "text-slate-800"
              )}
            >
              {total}
            </p>
          </div>

          {/* Motoristas */}
          <div
            className={cn(
              "p-3 rounded-xl border",
              isDark
                ? "bg-green-500/10 border-green-500/30"
                : "bg-green-50 border-green-200"
            )}
          >
            <div className="flex items-center gap-2 mb-1">
              <UserCheck
                size={16}
                className={cn(
                  isDark ? "text-green-300" : "text-green-600"
                )}
              />
              <span
                className={cn(
                  "text-[10px] font-bold uppercase",
                  isDark ? "text-green-300" : "text-green-600"
                )}
              >
                Drivers
              </span>
            </div>
            <p
              className={cn(
                "text-2xl font-bold",
                isDark ? "text-white" : "text-slate-800"
              )}
            >
              {drivers}
            </p>
          </div>

          {/* Admins */}
          <div
            className={cn(
              "p-3 rounded-xl border",
              isDark
                ? "bg-purple-500/10 border-purple-500/30"
                : "bg-purple-50 border-purple-200"
            )}
          >
            <div className="flex items-center gap-2 mb-1">
              <Shield
                size={16}
                className={cn(
                  isDark ? "text-purple-300" : "text-purple-600"
                )}
              />
              <span
                className={cn(
                  "text-[10px] font-bold uppercase",
                  isDark ? "text-purple-300" : "text-purple-600"
                )}
              >
                Admins
              </span>
            </div>
            <p
              className={cn(
                "text-2xl font-bold",
                isDark ? "text-white" : "text-slate-800"
              )}
            >
              {admins}
            </p>
          </div>
        </div>

        {/* Vagas Disponíveis */}
        <div
          className={cn(
            "p-3 rounded-xl border flex items-center justify-between",
            isDark
              ? "bg-orange-500/10 border-orange-500/30"
              : "bg-orange-50 border-orange-200"
          )}
        >
          <div className="flex items-center gap-2">
            <TrendingUp
              size={18}
              className={cn(
                isDark ? "text-orange-300" : "text-orange-600"
              )}
            />
            <span
              className={cn(
                "text-sm font-bold",
                isDark ? "text-white" : "text-slate-800"
              )}
            >
              Vagas Disponíveis
            </span>
          </div>
          <span
            className={cn(
              "text-xl font-bold",
              isDark ? "text-orange-300" : "text-orange-600"
            )}
          >
            {Math.max(0, maxUsers - total)}
          </span>
        </div>

        {/* Lista de Usuários Online (opcional) */}
        {users.length > 0 && (
          <div className="mt-4">
            <details>
              <summary
                className={cn(
                  "cursor-pointer text-xs font-bold uppercase mb-2",
                  isDark ? "text-white/70" : "text-slate-600"
                )}
              >
                Ver usuários online ({users.length})
              </summary>
              <div className="space-y-2 mt-2 max-h-48 overflow-y-auto">
                {users.map((user) => (
                  <div
                    key={user.uid}
                    className={cn(
                      "p-2 rounded-lg text-xs flex items-center justify-between",
                      isDark ? "bg-slate-800/60" : "bg-slate-100"
                    )}
                  >
                    <div>
                      <p
                        className={cn(
                          "font-bold",
                          isDark ? "text-white" : "text-slate-800"
                        )}
                      >
                        {user.name}
                      </p>
                      <p
                        className={cn(
                          "text-[10px]",
                          isDark ? "text-white/60" : "text-slate-600"
                        )}
                      >
                        {user.email}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "px-2 py-1 rounded-full text-[10px] font-bold",
                        user.userType === "admin"
                          ? "bg-purple-500/20 text-purple-300"
                          : "bg-green-500/20 text-green-300"
                      )}
                    >
                      {user.userType}
                    </span>
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}
      </div>
    </Card>
  );
};
