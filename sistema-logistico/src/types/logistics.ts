// Tipos para o Sistema Logístico
export type UrgencyLevel = "BAIXA" | "MEDIA" | "ALTA" | "URGENTE";

export type CallStatus =
  | "ABERTO"
  | "EM ANDAMENTO"
  | "AGUARDANDO_APROVACAO"
  | "CONCLUIDO"
  | "EXCLUIDO"
  | "ARQUIVADO";

export interface Driver {
  uid: string;
  name: string;
  email: string;
  phone: string;
  status: "DISPONIVEL" | "INDISPONIVEL" | "EM_ROTA" | "OFFLINE";
  hub: string;
  vehicleType: string;
  avatar?: string;
  initials?: string;
  createdAt?: any;
  googleUid?: string;
  shopeeId?: string; // Propriedade para o ID interno da Shopee
}

export interface SupportCall {
  id: string;
  solicitante: {
    id: string;
    name: string;
    avatar?: string;
    initials?: string;
    phone?: string;
    shopeeId?: string;
  };
  assignedTo?: string;
  description: string;
  location: string;
  status: CallStatus;
  timestamp: any;
  urgency: UrgencyLevel;
  routeId?: string;
  vehicleType?: string;
  isBulky?: boolean;
  hub?: string;
  approvedBy?: string;
  deletedAt?: any;
  deletedBy?: string;
  packageCount?: number;
  deliveryRegions?: string[];
}

// --- CORREÇÃO ADICIONADA ABAIXO ---
// Interface para o histórico de mensagens do Chatbot
export interface ChatHistoryMessage {
  role: "user" | "model";
  parts: [{ text: string }];
}
