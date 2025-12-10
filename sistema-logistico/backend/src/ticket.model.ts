import mongoose, { Document, Schema } from "mongoose";
// Se o import abaixo der erro de caminho, verifique se o caminho relativo está correto
// ou use 'any' temporariamente se o arquivo de types não estiver acessível ao backend
import type { UrgencyLevel, CallStatus } from "../../src/types/logistics";

// --- Schema para o objeto aninhado 'solicitante' ---
const SolicitanteSchema: Schema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    avatar: { type: String, default: null },
    initials: { type: String },
    phone: { type: String, default: null },
    shopeeId: { type: String, required: false },
  },
  { _id: false }
);

// --- Interface para o documento Ticket ---
export interface ITicket extends Document {
  // ADIÇÃO CRÍTICA: Tipagem explícita do _id
  _id: mongoose.Types.ObjectId;
  userId: string;
  prompt: string;
  description: string;
  reason?: string; // <--- NOVO CAMPO: Motivo da solicitação
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

// --- Schema principal do Ticket ---
const TicketSchema: Schema = new Schema({
  userId: { type: String, required: true },
  prompt: { type: String, required: true },
  description: { type: String, required: true },
  reason: { type: String, required: false }, // <--- NOVO CAMPO NO SCHEMA
  createdAt: { type: Date, default: Date.now },
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
