import { cn } from "../../../lib/utils";
import type { UrgencyLevel } from "../../../types/logistics";

interface UrgencyBadgeProps {
  urgency: UrgencyLevel | undefined;
}

export const UrgencyBadge: React.FC<UrgencyBadgeProps> = ({ urgency }) => {
  const styles = {
    BAIXA:
      "bg-orange-50/80 dark:bg-orange-500/20 text-orange-800 dark:text-white/70 border-orange-200/50 dark:border-orange-500/30 backdrop-blur-sm",
    MEDIA:
      "bg-blue-500/20 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-400/30 backdrop-blur-sm",
    ALTA: "bg-orange-500/20 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-400/30 backdrop-blur-sm",
    URGENTE:
      "bg-red-500/20 dark:bg-red-500/20 text-red-700 dark:text-red-300 border-red-400/30 backdrop-blur-sm",
  };
  const style = styles[urgency || "BAIXA"];

  return (
    <span
      className={cn(
        "text-[10px] font-bold px-2 py-0.5 rounded-xl border uppercase tracking-wide shadow-lg shadow-black/5 dark:shadow-black/10",
        style
      )}
    >
      {urgency || "Normal"}
    </span>
  );
};
