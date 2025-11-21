import React from "react";
import { Building, Truck } from "lucide-react";
import type { Driver } from "../../types/logistics";
import { AvatarComponent } from "../UI";
import { Card } from "../ui/card";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/button";

interface EnhancedDriverCardProps {
  driver: Driver;
  onAction: (phone?: string) => void; // Alterado para receber telefone, pois o "Acionar" é contato
  onInfoClick: (driver: Driver) => void;
}

export const EnhancedDriverCard = ({
  driver,
  onAction,
  onInfoClick,
}: EnhancedDriverCardProps) => (
  <Card className="p-3 rounded-xl shadow-lg flex items-center justify-between gap-2 border-l-4 border-green-500 bg-card">
    <div className="flex items-center gap-3 flex-1 min-w-0">
      <AvatarComponent user={driver} onClick={() => onInfoClick(driver)} />
      <div className="flex-1 min-w-0">
        <p
          className="font-semibold text-foreground cursor-pointer truncate"
          onClick={() => onInfoClick(driver)}
          title={driver.name}
        >
          {driver.name}
        </p>
        <div className="text-xs text-muted-foreground flex flex-col sm:flex-row sm:items-center sm:gap-3 mt-1">
          <div className="flex items-center gap-1 truncate" title={driver.hub}>
            <Building size={12} />
            <span className="truncate">{driver.hub || "N/A"}</span>
          </div>
          <div className="flex items-center gap-1 capitalize">
            <Truck size={12} />
            <span>{driver.vehicleType || "N/A"}</span>
          </div>
        </div>
      </div>
    </div>
    <div className="flex flex-col items-end gap-2">
      <Badge
        variant="outline"
        className="text-green-500 border-green-500/50 dark:text-green-400 dark:border-green-400/50"
      >
        Disponível
      </Badge>
      <Button
        onClick={() => onAction(driver.phone)}
        size="sm"
        className="h-7 text-xs rounded-lg"
      >
        Acionar
      </Button>
    </div>
  </Card>
);
