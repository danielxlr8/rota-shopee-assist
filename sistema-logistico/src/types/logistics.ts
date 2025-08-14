export type UrgencyLevel = "URGENTE" | "ALTA" | "MEDIA" | "BAIXA";

export type CallStatus = "ABERTO" | "EM ANDAMENTO" | "CONCLUIDO";

export type DriverStatus = "DISPONIVEL" | "INDISPONIVEL" | "EM_ROTA";

export interface SupportCall {
  id: string;
  solicitante: {
    id: string;
    name: string;
    avatar: string;
    initials: string;
  };
  timestamp: number;
  location: string;
  description: string;
  urgency: UrgencyLevel;
  status: CallStatus;
  assignedTo?: string;
}

export interface Driver {
  id: string;
  name: string;
  avatar: string;
  initials: string;
  location: string;
  status: DriverStatus;
  phone: string;
}
