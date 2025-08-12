export const isCallCritical = (createdAt: Date): boolean => {
  const minutesAgo = (Date.now() - createdAt.getTime()) / (1000 * 60);
  return minutesAgo >= 15; // Crítico após 15 minutos
};

export const getCallUrgencyLevel = (createdAt: Date): 'normal' | 'warning' | 'critical' => {
  const minutesAgo = (Date.now() - createdAt.getTime()) / (1000 * 60);
  
  if (minutesAgo >= 15) return 'critical';
  if (minutesAgo >= 10) return 'warning';
  return 'normal';
};

export const sortCallsByTime = <T extends { createdAt: Date }>(calls: T[]): T[] => {
  return [...calls].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
};