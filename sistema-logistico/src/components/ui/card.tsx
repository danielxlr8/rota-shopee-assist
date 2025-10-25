import * as React from "react";
// Importa o 'cn' da sua localização correta
import { cn } from "../../lib/utils";

// --- COMPONENTE Card CORRIGIDO ---
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      // CORREÇÃO: Usa variáveis do tema
      "rounded-xl border bg-card text-card-foreground shadow",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";

// --- COMPONENTE CardHeader CORRIGIDO ---
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    // Ajustado padding e removida borda fixa
    className={cn("flex flex-col space-y-1.5 p-4", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

// --- COMPONENTE CardTitle CORRIGIDO ---
const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      // Removida cor estática, herda de Card
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

// --- COMPONENTE CardDescription CORRIGIDO ---
const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    // CORREÇÃO: Usa variável do tema
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

// --- COMPONENTE CardContent CORRIGIDO ---
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  // Ajustado padding (remove padding-top padrão)
  <div ref={ref} className={cn("p-4 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

// --- COMPONENTE CardFooter CORRIGIDO ---
const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    // Ajustado padding (remove padding-top padrão) e removida borda fixa
    className={cn("flex items-center p-4 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

// Exportando os componentes corrigidos
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};
