import type { Driver, SupportCall } from "../types/logistics";

// Funções auxiliares para dados mock (permanecem inalteradas)
const getInitials = (name: string) => {
  const names = name.trim().split(" ");
  if (names.length > 1) {
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};
const formatNameForAvatar = (name: string) =>
  name.toLowerCase().replace(/\s/g, "");

// Dados mock corrigidos para o tipo Driver
const driverData = [
  {
    name: "WILLIAN SANDI RIBEIRO",
    phone: "43988345149",
    region: "Londrina",
    hub: "LM Hub_PR_Londrina_Parque ABC II",
    vehicleType: "moto",
  },
  {
    name: "JONATAS FABRICIO DA SILVA",
    phone: "43984121594",
    region: "Maringá",
    hub: "LM Hub_PR_Maringa",
    vehicleType: "carro passeio",
  },
  {
    name: "MISLENE DE JESUS LEGRO",
    phone: "43991805479",
    region: "Londrina",
    hub: "LM Hub_PR_Londrina_Parque ABC II",
    vehicleType: "van",
  },
];

export const mockDrivers: Driver[] = driverData.map((driver, index) => ({
  uid: `d${index + 1}`,
  name: driver.name,
  phone: driver.phone,
  hub: driver.hub,
  vehicleType: driver.vehicleType,
  status: "INDISPONIVEL",
  initials: getInitials(driver.name),
  avatar: `https://i.pravatar.cc/150?u=${formatNameForAvatar(driver.name)}`,
}));

// Dados mock corrigidos para o tipo SupportCall
export const mockCalls: SupportCall[] = [
  {
    id: "c1",
    solicitante: {
      id: "s1",
      name: "Carlos Oliveira",
      avatar: "https://i.pravatar.cc/150?u=carlos",
      initials: "CO",
      phone: "11987654321",
    },
    timestamp: new Date().getTime() - 15 * 60000,
    location: "R. da Consolação, 800 - São Paulo, SP",
    description: "Pneu furado, preciso de apoio urgente",
    urgency: "URGENTE",
    status: "ABERTO",
    routeId: "SPX-123456",
    hub: "LM Hub_PR_Londrina_Parque ABC II",
    vehicleType: "moto",
  },
  {
    id: "c2",
    solicitante: {
      id: "s2",
      name: "Ana Costa",
      avatar: "https://i.pravatar.cc/150?u=ana",
      initials: "AC",
      phone: "11998765432",
    },
    timestamp: new Date().getTime() - 8 * 60000,
    location: "R. Augusta, 500 - São Paulo, SP",
    description: "Mercadoria muito pesada, preciso de ajuda para carregar",
    urgency: "MEDIA",
    status: "ABERTO",
    routeId: "SPX-234567",
    hub: "LM Hub_PR_Maringa",
    vehicleType: "carro passeio",
  },
  {
    id: "c3",
    solicitante: {
      id: "s3",
      name: "Pedro Alves",
      avatar: "https://i.pravatar.cc/150?u=pedro",
      initials: "PA",
      phone: "11999887766",
    },
    timestamp: new Date().getTime() - 60 * 60000,
    location: "Av. Paulista, 1000 - São Paulo, SP",
    description: "Problema na van, não consegue ligar",
    urgency: "ALTA",
    status: "EM ANDAMENTO",
    assignedTo: "d1",
    routeId: "SPX-345678",
    hub: "LM Hub_PR_Londrina_Parque ABC II",
    vehicleType: "van",
  },
  {
    id: "c4",
    solicitante: {
      id: "s4",
      name: "Fernanda Lima",
      avatar: "https://i.pravatar.cc/150?u=fernanda",
      initials: "FL",
      phone: "11977665544",
    },
    timestamp: new Date().getTime() - 120 * 60000,
    location: "R. Oscar Freire, 200 - São Paulo, SP",
    description: "Transferência de pacotes finalizada. Aguardando validação.",
    urgency: "MEDIA",
    status: "AGUARDANDO_APROVACAO",
    assignedTo: "d2",
    routeId: "SPX-456789",
    hub: "LM Hub_PR_Foz do Iguaçu",
    vehicleType: "carro utilitario",
  },
];
