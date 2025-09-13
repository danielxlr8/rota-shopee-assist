import mongoose, { Document, Schema } from "mongoose";

// Interface for the Ticket document
export interface ITicket extends Document {
  userId: string;
  prompt: string;
  description: string;
  createdAt: Date;
}

// Ticket Schema
const TicketSchema: Schema = new Schema({
  userId: { type: String, required: true },
  prompt: { type: String, required: true },
  description: { type: String, required: true, maxlength: 100 },
  createdAt: { type: Date, default: Date.now },
});

// Export the model
export const Ticket = mongoose.model<ITicket>("Ticket", TicketSchema);
