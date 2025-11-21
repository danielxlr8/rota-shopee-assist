import React from "react";
import { LucideIcon } from "lucide-react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  icon: LucideIcon;
  type?: string;
}

export const SearchInput = ({
  value,
  onChange,
  placeholder,
  icon: Icon,
  type = "text",
}: SearchInputProps) => (
  <div className="relative w-full">
    <Icon
      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
      size={16}
    />
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary font-sans text-foreground placeholder:text-muted-foreground"
    />
  </div>
);
