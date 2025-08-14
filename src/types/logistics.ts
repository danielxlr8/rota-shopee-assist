export type CallStatus = 'ABERTO' | 'EM_ANDAMENTO' | 'CONCLUIDO';
export type DriverStatus = 'DISPONIVEL' | 'INDISPONIVEL' | 'EM_ROTA';

export interface Driver {
  id: string;
  name: string;
  phone: string;
  status: DriverStatus;
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
  avatar?: string;
}

export interface SupportCall {
  id: string;
  requesterId: string;
  assignedDriverId?: string;
  status: CallStatus;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  createdAt: Date;
  acceptedAt?: Date;
  completedAt?: Date;
  description?: string;
  priority: 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE';
}

export interface MockData {
  drivers: Driver[];
  supportCalls: SupportCall[];
}