import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Timestamp } from "firebase/firestore";

export const formatTimestamp = (
  timestamp: Timestamp | Date | null | undefined
): string => {
  if (!timestamp) return "N/A";
  const date = timestamp instanceof Timestamp ? timestamp.toDate() : timestamp;
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return "Data inválida";
  }
  return format(date, "dd/MM HH:mm", { locale: ptBR });
};

export const formatPhoneNumber = (value: string): string => {
  if (!value) return "";
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
};


