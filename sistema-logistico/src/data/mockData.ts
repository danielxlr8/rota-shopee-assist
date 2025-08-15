import type { Driver, SupportCall } from "../types/logistics";

// ... (funções auxiliares getInitials e formatNameForAvatar continuam iguais)
const getInitials = (name: string) => {
  const names = name.trim().split(" ");
  if (names.length > 1) {
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};
const formatNameForAvatar = (name: string) =>
  name.toLowerCase().replace(/\s/g, "");

const driverData = [
  { name: "WILLIAN SANDI RIBEIRO", phone: "43988345149", region: "Londrina" },
  {
    name: "JONATAS FABRICIO DA SILVA",
    phone: "43984121594",
    region: "Maringá",
  },
  { name: "MISLENE DE JESUS LEGRO", phone: "43991805479", region: "Londrina" },
];

export const mockDrivers: Driver[] = driverData.map((driver, index) => ({
  id: `d${index + 1}`,
  name: driver.name,
  phone: driver.phone,
  location: `LM Hub_PR_${driver.region}`,
  status: "INDISPONIVEL",
  region: driver.region,
  initials: getInitials(driver.name),
  avatar: `https://i.pravatar.cc/150?u=${formatNameForAvatar(driver.name)}`,
}));

export const mockCalls: SupportCall[] = [
  {
    id: "1419969",
    solicitante: {
      id: "1419969",
      name: "teste",
      avatar: "https://i.pravatar.cc/150?u=carlos",
      initials: "CO",
    },
    timestamp: new Date().getTime() - 15 * 60000,
    location: "R. da Consolação, 800 - São Paulo, SP",
    description: "Pneu furado, preciso de apoio urgente",
    urgency: "URGENTE",
    status: "ABERTO",
  },
  {
    id: "c2",
    solicitante: {
      id: "s2",
      name: "Ana Costa",
      avatar: "https://i.pravatar.cc/150?u=ana",
      initials: "AC",
    },
    timestamp: new Date().getTime() - 8 * 60000,
    location: "R. Augusta, 500 - São Paulo, SP",
    description: "Mercadoria muito pesada, preciso de ajuda para carregar",
    urgency: "MEDIA",
    status: "ABERTO",
  },
  {
    id: "c3",
    solicitante: {
      id: "s3",
      name: "Pedro Alves",
      avatar: "https://i.pravatar.cc/150?u=pedro",
      initials: "PA",
    },
    timestamp: new Date().getTime() - 60 * 60000,
    location: "Av. Paulista, 1000 - São Paulo, SP",
    description: "Problema na van, não consegue ligar",
    urgency: "ALTA",
    status: "EM ANDAMENTO",
    assignedTo: "d1",
  },
  // NOVO CHAMADO DE TESTE: Aguardando aprovação
  {
    id: "c4",
    solicitante: {
      id: "s4",
      name: "Fernanda Lima",
      avatar: "https://i.pravatar.cc/150?u=fernanda",
      initials: "FL",
    },
    timestamp: new Date().getTime() - 120 * 60000,
    location: "R. Oscar Freire, 200 - São Paulo, SP",
    description: "Transferência de pacotes finalizada. Aguardando validação.",
    urgency: "MEDIA",
    status: "AGUARDANDO_APROVACAO",
    assignedTo: "d2",
  },
];
