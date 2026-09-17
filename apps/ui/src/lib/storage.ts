export const formatStorageBytes = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1000)), 4);
  const value = bytes / 1000 ** index;
  return value.toFixed(index === 0 ? 0 : 1) + ' ' + units[index];
};

export const storageUsedPercent = (usedBytes: number, limitBytes: number) =>
  limitBytes > 0 ? Math.max(0, (usedBytes / limitBytes) * 100) : 0;

export const formatStoragePercent = (percent: number) => {
  if (percent > 0 && percent < 0.1) return '<0.1%';
  return String(Math.round(percent * 10) / 10) + '%';
};
