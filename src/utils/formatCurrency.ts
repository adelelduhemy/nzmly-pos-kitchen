export const formatCurrency = (amount: number | null | undefined, locale: string = 'en'): string => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return locale === 'ar' ? '0.00 ر.س' : 'SAR 0.00';
  }
  const formatted = amount.toFixed(2);
  return locale === 'ar' ? `${formatted} ر.س` : `SAR ${formatted}`;
};

export const formatCurrencyCompact = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '0';
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)}K`;
  }
  return amount.toFixed(0);
};
