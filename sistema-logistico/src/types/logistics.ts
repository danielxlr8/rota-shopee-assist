export type UrgencyLevel = "BAIXA" | "MEDIA" | "ALTA" | "URGENTE";

// Adicionado "ARQUIVADO" para corresponder ao uso no AdminDashboard
export type CallStatus =
  | "ABERTO"
  | "EM ANDAMENTO"
  | "AGUARDANDO_APROVACAO"
  | "CONCLUIDO"
  | "EXCLUIDO"
  | "ARQUIVADO";

export interface Driver {
  id: string;
  name: string;
  phone: string;
  status: "DISPONIVEL" | "INDISPONIVEL" | "EM_ROTA" | "OFFLINE";
  hub: string;
  vehicleType: string;
  avatar?: string;
  initials?: string;
  uid?: string;
  googleUid?: string;
}

export interface SupportCall {
  id: string;
  solicitante: {
    id: string;
    name: string;
    avatar?: string;
    initials?: string;
    phone?: string;
  };
  assignedTo?: string;
  description: string;
  location: string;
  status: CallStatus; // Usando o tipo CallStatus atualizado
  timestamp: any;
  urgency: UrgencyLevel;
  routeId?: string;
  vehicleType?: string;
  isBulky?: boolean;
  hub?: string;
  approvedBy?: string;
  deletedAt?: any; // Propriedade opcional adicionada
}
