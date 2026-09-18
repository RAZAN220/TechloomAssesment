/**
 * Formats an integer amount of minor units (cents) as a currency string.
 * All financial math stays in integer cents; this is display-only.
 */
export const formatCurrency = (cents, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(
    (Number(cents) || 0) / 100
  );

export default formatCurrency;
