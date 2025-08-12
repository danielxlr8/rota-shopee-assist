import { MockData, Driver, SupportCall } from '@/types/logistics';

export const mockDrivers: Driver[] = [
  {
    id: '1',
    name: 'João Santos',
    phone: '11999888777',
    status: 'DISPONIVEL',
    location: {
      lat: -23.5505,
      lng: -46.6333,
      address: 'Av. Paulista, 1000 - São Paulo, SP'
    },
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face'
  },
  {
    id: '2',
    name: 'Maria Silva',
    phone: '11888777666',
    status: 'DISPONIVEL',
    location: {
      lat: -23.5489,
      lng: -46.6388,
      address: 'R. Augusta, 500 - São Paulo, SP'
    },
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b412?w=100&h=100&fit=crop&crop=face'
  },
  {
    id: '3',
    name: 'Carlos Oliveira',
    phone: '11777666555',
    status: 'EM_ROTA',
    location: {
      lat: -23.5629,
      lng: -46.6544,
      address: 'R. da Consolação, 800 - São Paulo, SP'
    },
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face'
  },
  {
    id: '4',
    name: 'Ana Costa',
    phone: '11666555444',
    status: 'INDISPONIVEL',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face'
  },
  {
    id: '5',
    name: 'Roberto Lima',
    phone: '11555444333',
    status: 'DISPONIVEL',
    location: {
      lat: -23.5558,
      lng: -46.6396,
      address: 'Av. Brasil, 1200 - São Paulo, SP'
    },
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face'
  }
];

export const mockSupportCalls: SupportCall[] = [
  {
    id: 'call-1',
    requesterId: '3',
    status: 'ABERTO',
    location: {
      lat: -23.5629,
      lng: -46.6544,
      address: 'R. da Consolação, 800 - São Paulo, SP'
    },
    createdAt: new Date(Date.now() - 25 * 60 * 1000), // 25 min ago - Urgente!
    description: 'Pneu furado, preciso de apoio urgente',
    priority: 'URGENTE'
  },
  {
    id: 'call-2',
    requesterId: '1',
    assignedDriverId: '2',
    status: 'EM_ANDAMENTO',
    location: {
      lat: -23.5505,
      lng: -46.6333,
      address: 'Av. Paulista, 1000 - São Paulo, SP'
    },
    createdAt: new Date(Date.now() - 45 * 60 * 1000), // 45 min ago
    acceptedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 min ago
    description: 'Problema na van, não consegue ligar',
    priority: 'ALTA'
  },
  {
    id: 'call-3',
    requesterId: '5',
    assignedDriverId: '4',
    status: 'CONCLUIDO',
    location: {
      lat: -23.5558,
      lng: -46.6396,
      address: 'Av. Brasil, 1200 - São Paulo, SP'
    },
    createdAt: new Date(Date.now() - 120 * 60 * 1000), // 2h ago
    acceptedAt: new Date(Date.now() - 105 * 60 * 1000), // 1h45 ago
    completedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 min ago
    description: 'Bateria descarregada',
    priority: 'MEDIA'
  },
  {
    id: 'call-4',
    requesterId: '2',
    status: 'ABERTO',
    location: {
      lat: -23.5489,
      lng: -46.6388,
      address: 'R. Augusta, 500 - São Paulo, SP'
    },
    createdAt: new Date(Date.now() - 8 * 60 * 1000), // 8 min ago
    description: 'Mercadoria muito pesada, preciso de ajuda para carregar',
    priority: 'MEDIA'
  },
  {
    id: 'call-5',
    requesterId: '1',
    status: 'ABERTO',
    location: {
      lat: -23.5450,
      lng: -46.6320,
      address: 'Av. Faria Lima, 200 - São Paulo, SP'
    },
    createdAt: new Date(Date.now() - 18 * 60 * 1000), // 18 min ago - Crítico!
    description: 'Van quebrada no meio da rua, bloqueando trânsito',
    priority: 'URGENTE'
  }
];

export const mockData: MockData = {
  drivers: mockDrivers,
  supportCalls: mockSupportCalls
};