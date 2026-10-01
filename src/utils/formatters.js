/**
 * Format number as currency (USD / INR / generic)
 */
export const formatCurrency = (value, currency = 'USD') => {
  if (value === null || value === undefined || isNaN(value)) return '--';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 2,
  }).format(value);
};

/**
 * Format number as percentage with sign
 */
export const formatPercentage = (value, showSign = true) => {
  if (value === null || value === undefined || isNaN(value)) return '--';
  const prefix = showSign && value > 0 ? '+' : '';
  return `${prefix}${Number(value).toFixed(2)}%`;
};

/**
 * Format large numbers into K, M, B
 */
export const formatCompactNumber = (value) => {
  if (value === null || value === undefined || isNaN(value)) return '--';
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 2,
  }).format(value);
};

/**
 * Format date string
 */
export const formatDate = (dateString) => {
  if (!dateString) return '--';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};
