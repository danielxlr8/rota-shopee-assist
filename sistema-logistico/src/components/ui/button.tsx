import * as React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?:
    | "default"
    | "ghost"
    | "outline"
    | "secondary"
    | "destructive"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
};

function cn(...cls: (string | false | null | undefined)[]) {
  return cls.filter(Boolean).join(" ");
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium " +
      "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 " +
      "disabled:pointer-events-none disabled:opacity-50";
    const variants = {
      default:
        "bg-orange-600 text-white hover:bg-orange-700 focus-visible:ring-orange-600",
      ghost: "bg-transparent hover:bg-black/5",
      outline: "border border-gray-300 hover:bg-gray-100",
      secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200",
      destructive:
        "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600",
      link: "text-orange-700 underline-offset-4 hover:underline bg-transparent",
    } as const;
    const sizes = {
      default: "h-10 px-4 py-2",
      sm: "h-9 px-3",
      lg: "h-11 px-8",
      icon: "h-10 w-10 p-0",
    } as const;

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
export default Button;
