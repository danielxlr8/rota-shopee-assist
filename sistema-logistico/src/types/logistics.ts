export type UrgencyLevel = "URGENTE" | "ALTA" | "MEDIA" | "BAIXA";

// ALTERAÇÃO: O ciclo de vida do chamado foi expandido para incluir o fluxo de aprovação.
export type CallStatus =
  | "ABERTO"
  | "EM ANDAMENTO"
  | "AGUARDANDO_APROVACAO"
  | "APROVADO"
  | "CONCLUIDO";

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
  status: CallStatus; // Agora usa o novo ciclo de vida
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
  // O status da conta foi removido, pois a aprovação agora é por chamado.
  region: string;
}
