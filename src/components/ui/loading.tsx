import React from "react";
import { cn } from "../../lib/utils";

interface LoadingProps {
  size?: "sm" | "md" | "lg";
  variant?: "spinner" | "dots" | "pulse";
  className?: string;
  text?: string;
}

export const Loading: React.FC<LoadingProps> = ({
  size = "md",
  variant = "spinner",
  className,
  text,
}) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  if (variant === "spinner") {
    return (
      <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
        <div
          className={cn(
            "relative",
            sizeClasses[size]
          )}
        >
          <div
            className="absolute inset-0 rounded-full border-4 border-transparent"
            style={{
              borderTopColor: "#f97316",
              borderRightColor: "#f97316",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <div
            className="absolute inset-0 rounded-full border-4 border-transparent opacity-50"
            style={{
              borderBottomColor: "#ea580c",
              borderLeftColor: "#ea580c",
              animation: "spin 0.8s linear infinite reverse",
            }}
          />
        </div>
        {text && (
          <p className="text-sm font-semibold tracking-wide" style={{ 
            color: "#ffffff",
            fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif",
            letterSpacing: "0.5px"
          }}>{text}</p>
        )}
      </div>
    );
  }

  if (variant === "dots") {
    return (
      <div className={cn("flex items-center justify-center gap-2", className)}>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-full"
              style={{
                width: size === "sm" ? "6px" : size === "md" ? "8px" : "12px",
                height: size === "sm" ? "6px" : size === "md" ? "8px" : "12px",
                background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                animation: `bounce 1.4s ease-in-out infinite`,
                animationDelay: `${i * 0.16}s`,
              }}
            />
          ))}
        </div>
        {text && (
          <p className="text-sm font-semibold tracking-wide ml-2" style={{ 
            color: "#ffffff",
            fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif",
            letterSpacing: "0.5px"
          }}>{text}</p>
        )}
      </div>
    );
  }

  if (variant === "pulse") {
    return (
      <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
        <div
          className={cn(
            "rounded-full",
            sizeClasses[size]
          )}
          style={{
            background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
            animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
            boxShadow: "0 0 0 0 rgba(249, 115, 22, 0.7)",
          }}
        />
        {text && (
          <p className="text-sm font-semibold tracking-wide" style={{ 
            color: "#ffffff",
            fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif",
            letterSpacing: "0.5px"
          }}>{text}</p>
        )}
      </div>
    );
  }

  return null;
};

// Loading Overlay para telas cheias
interface LoadingOverlayProps {
  isLoading: boolean;
  text?: string;
  variant?: "spinner" | "dots" | "pulse";
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  text,
  variant = "spinner",
}) => {
  if (!isLoading) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        background: "rgba(15, 23, 42, 0.8)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div
        className="rounded-2xl p-8"
        style={{
          background: "linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
        }}
      >
        <Loading variant={variant} size="lg" text={text} />
      </div>
    </div>
  );
};

// Loading Skeleton para conteúdo
export const LoadingSkeleton: React.FC<{
  className?: string;
  lines?: number;
}> = ({ className, lines = 3 }) => {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 rounded-lg"
          style={{
            background: "linear-gradient(90deg, rgba(30, 41, 59, 0.5) 25%, rgba(15, 23, 42, 0.8) 50%, rgba(30, 41, 59, 0.5) 75%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 1.5s ease-in-out infinite",
          }}
        />
      ))}
    </div>
  );
};

