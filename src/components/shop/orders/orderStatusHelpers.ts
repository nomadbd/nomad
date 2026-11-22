export const getUnifiedStatus = (rawStatus: string) => {
  if (!rawStatus) return 'PENDING';
  const s = rawStatus.trim().toLowerCase();

  if (s === 'received') return 'RECEIVED';
  if (s === 'shipped') return 'SHIPPED';
  if (s === 'delivered' || s === 'completed' || s === 'delivered / completed') return 'DELIVERED';
  if (s === 'cancelled') return 'CANCELLED';
  if (s === 'processing') return 'PROCESSING';

  return rawStatus.trim().toUpperCase();
};

export const getStepIndex = (rawStatus: string) => {
  if (!rawStatus) return 0;
  const s = rawStatus.toLowerCase().trim();
  if (s === 'delivered' || s === 'completed' || s === 'delivered / completed') return 3;
  if (s === 'shipped') return 2;
  if (s === 'received' || s === 'processing') return 1;
  return 0;
};
