export const VAT_RATE = 0.15;

export const calculateVAT = (subtotal: number): number => {
  return subtotal * VAT_RATE;
};

export const calculateTotal = (subtotal: number): number => {
  return subtotal + calculateVAT(subtotal);
};

export const calculateSubtotalFromTotal = (total: number): number => {
  return total / (1 + VAT_RATE);
};
