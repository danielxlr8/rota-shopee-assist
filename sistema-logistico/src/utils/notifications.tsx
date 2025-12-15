import { toast as sonnerToast } from "sonner";
import { X, CheckCircle, AlertTriangle } from "lucide-react";
import { cn } from "../lib/utils";

type NotificationType = "success" | "error" | "warning" | "info";

export const showNotification = (
  type: NotificationType,
  title: string,
  message: string
) => {
  const styles = {
    success: {
      icon: CheckCircle,
      color: "text-green-300",
      border: "border-l-4 border-green-500",
    },
    error: {
      icon: AlertTriangle,
      color: "text-red-300",
      border: "border-l-4 border-red-500",
    },
    warning: {
      icon: AlertTriangle,
      color: "text-orange-300",
      border: "border-l-4 border-orange-500",
    },
    info: {
      icon: CheckCircle,
      color: "text-blue-300",
      border: "border-l-4 border-blue-500",
    },
  };

  const { icon: Icon, color, border } = styles[type];

  sonnerToast.custom((t) => (
    <div
      className={cn(
        "flex w-full max-w-sm bg-slate-800/95 backdrop-blur-xl shadow-xl shadow-black/30 rounded-2xl overflow-hidden border border-white/20",
        border
      )}
    >
      <div className="p-4 flex items-start gap-3 w-full">
        <Icon size={20} className={cn("shrink-0 mt-0.5", color)} />
        <div className="flex-1">
          <p className="font-semibold text-sm text-white">{title}</p>
          <p className="text-xs text-white/70 mt-1">{message}</p>
        </div>
        <button
          onClick={() => sonnerToast.dismiss(t)}
          className="text-white/50 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  ));
};

