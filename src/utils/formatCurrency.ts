export const formatCurrency = (amount: number, locale: string = 'en'): string => {
  const formatted = amount.toFixed(2);
  return locale === 'ar' ? `${formatted} ر.س` : `SAR ${formatted}`;
};

export const formatCurrencyCompact = (amount: number): string => {
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)}K`;
  }
  return amount.toFixed(0);
};
