import mongoose, { Document, Schema } from "mongoose";

// Interface para o documento Ticket
export interface ITicket extends Document {
  userId: string;
  prompt: string;
  description: string;
  createdAt: Date;
}

// Schema do Ticket
const TicketSchema: Schema = new Schema({
  userId: { type: String, required: true },
  prompt: { type: String, required: true },
  description: { type: String, required: true, maxlength: 100 },
  createdAt: { type: Date, default: Date.now },
});

// Exporta o modelo
export const Ticket = mongoose.model<ITicket>("Ticket", TicketSchema);
