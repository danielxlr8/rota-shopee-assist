import { Building, Truck } from "lucide-react";
import type { Driver } from "../../types/logistics";
import { AvatarComponent } from "../UI";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";

interface EnhancedDriverCardProps {
  driver: Driver;
  onAction: (phone?: string) => void;
  onInfoClick: (driver: Driver) => void;
}

export const EnhancedDriverCard = ({
  driver,
  onAction,
  onInfoClick,
}: EnhancedDriverCardProps) => {
  const isDark = document.documentElement.classList.contains("dark");
  
  return (
    <div
      className={cn(
        "p-4 rounded-xl flex items-center justify-between gap-3 group transition-all cursor-pointer backdrop-blur-xl",
        isDark
          ? "bg-gradient-to-br from-slate-800/90 via-slate-700/90 to-slate-800/90 border-slate-600/50"
          : "bg-white/80 border-orange-200/50"
      )}
      style={{
        border: isDark ? "1px solid rgba(16, 185, 129, 0.2)" : "1px solid rgba(254, 131, 48, 0.3)",
        boxShadow: isDark ? "0 4px 20px rgba(0, 0, 0, 0.2)" : "0 2px 10px rgba(0, 0, 0, 0.1)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = isDark ? "rgba(16, 185, 129, 0.4)" : "rgba(254, 131, 48, 0.5)";
        e.currentTarget.style.boxShadow = isDark 
          ? "0 8px 32px rgba(16, 185, 129, 0.2)" 
          : "0 4px 20px rgba(254, 131, 48, 0.2)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = isDark ? "rgba(16, 185, 129, 0.2)" : "rgba(254, 131, 48, 0.3)";
        e.currentTarget.style.boxShadow = isDark 
          ? "0 4px 20px rgba(0, 0, 0, 0.2)" 
          : "0 2px 10px rgba(0, 0, 0, 0.1)";
      }}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div onClick={() => onInfoClick(driver)} className="cursor-pointer">
          <AvatarComponent user={driver} />
        </div>
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "font-bold cursor-pointer truncate text-sm",
              isDark ? "text-white" : "text-slate-800"
            )}
            onClick={() => onInfoClick(driver)}
            title={driver.name}
          >
            {driver.name}
          </p>
          <div className={cn(
            "text-xs flex flex-col sm:flex-row sm:items-center sm:gap-3 mt-1.5",
            isDark ? "text-slate-400" : "text-slate-600"
          )}>
            <div className="flex items-center gap-1.5 truncate" title={driver.hub}>
              <Building size={12} className={isDark ? "text-orange-400" : "text-orange-600"} />
              <span className="truncate">{driver.hub?.split("_")[2] || "N/A"}</span>
            </div>
            <div className="flex items-center gap-1.5 capitalize">
              <Truck size={12} className={isDark ? "text-orange-400" : "text-orange-600"} />
              <span>{driver.vehicleType || "N/A"}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col items-end gap-2">
        <Badge
          className="px-2.5 py-1 text-xs font-semibold"
          style={{
            background: "rgba(16, 185, 129, 0.15)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            color: "#10b981",
          }}
        >
          Disponível
        </Badge>
        <Button
          onClick={() => onAction(driver.phone)}
          size="sm"
          className="h-8 text-xs rounded-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md"
        >
          Acionar
        </Button>
      </div>
    </div>
  );
};
