export const VEHICLE_TYPES = [
  "moto",
  "carro passeio",
  "carro utilitario",
  "van",
] as const;

export type VehicleType = typeof VEHICLE_TYPES[number];


