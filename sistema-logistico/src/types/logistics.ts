import { Timestamp } from "firebase/firestore";

// Define os níveis de urgência para os chamados de suporte.
export type UrgencyLevel = "URGENTE" | "ALTA" | "MEDIA" | "BAIXA";

// Define os possíveis status para um motorista.
export type DriverStatus =
  | "DISPONIVEL"
  | "INDISPONIVEL"
  | "EM_ROTA"
  | "PAUSADO"
  | "OFFLINE"
  | "EM_ATENDIMENTO";

// CORREÇÃO: Adicionados todos os status usados na aplicação, incluindo EXCLUIDO.
export type CallStatus =
  | "ABERTO"
  | "EM ANDAMENTO"
  | "CONCLUIDO"
  | "AGUARDANDO_APROVACAO"
  | "APROVADO"
  | "EXCLUIDO"; // <-- NOVO STATUS ADICIONADO

// Define a estrutura para um chamado de suporte.
export interface SupportCall {
  id: string;
  solicitante: {
    id: string;
    name: string;
    avatar: string;
    initials: string;
    phone?: string;
  };
  timestamp: Timestamp | { seconds: number; nanoseconds: number } | string;
  urgency: UrgencyLevel;
  location: string;
  description: string;
  status: CallStatus;
  assignedTo?: string;
  vehicleType?: string;
  isBulky?: boolean;
  hub?: string; // Adicionado para permitir a filtragem por hub
}

// Define a estrutura para um motorista.
export interface Driver {
  id: string;
  name: string;
  avatar: string;
  initials: string;
  location: string;
  status: DriverStatus;
  phone: string;
  region: string;
}
