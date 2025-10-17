import mongoose, { Document, Schema } from "mongoose";
import type { UrgencyLevel, CallStatus } from "../../src/types/logistics";

// --- Schema para o objeto aninhado 'solicitante' ---
const SolicitanteSchema: Schema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    avatar: { type: String, default: null },
    initials: { type: String },
    phone: { type: String, default: null },
    shopeeId: { type: String, required: false }, // Adicionado aqui
  },
  { _id: false } // Impede a criação de um _id para o subdocumento
);

// --- Interface para o documento Ticket, agora completa ---
export interface ITicket extends Document {
  userId: string;
  prompt: string;
  description: string;
  createdAt: Date;
  solicitante: {
    id: string;
    name: string;
    avatar?: string | null;
    initials?: string;
    phone?: string | null;
    shopeeId?: string;
  };
  location: string;
  hub: string;
  vehicleType: string;
  isBulky: boolean;
  routeId: string;
  urgency: UrgencyLevel;
  status: CallStatus;
  timestamp: Date;
  packageCount: number;
  deliveryRegions: string[];
}

// --- Schema principal do Ticket, agora completo ---
const TicketSchema: Schema = new Schema({
  userId: { type: String, required: true },
  prompt: { type: String, required: true },
  // --- ALTERAÇÃO 1: Removido o 'maxlength' ---
  description: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },

  // --- ALTERAÇÃO 2: Adicionados todos os novos campos ---
  solicitante: { type: SolicitanteSchema, required: true },
  location: { type: String, required: true },
  hub: { type: String, required: true },
  vehicleType: { type: String, required: true },
  isBulky: { type: Boolean, default: false },
  routeId: { type: String, required: true },
  urgency: {
    type: String,
    enum: ["BAIXA", "MEDIA", "ALTA", "URGENTE"],
    required: true,
  },
  status: {
    type: String,
    enum: [
      "ABERTO",
      "EM ANDAMENTO",
      "AGUARDANDO_APROVACAO",
      "CONCLUIDO",
      "EXCLUIDO",
      "ARQUIVADO",
    ],
    default: "ABERTO",
  },
  timestamp: { type: Date, default: Date.now },
  packageCount: { type: Number, required: true },
  deliveryRegions: { type: [String], required: true },
});

// Exporta o modelo
export const Ticket = mongoose.model<ITicket>("Ticket", TicketSchema);
