/**
 * Shared display formatting for transaction amounts (Plaid: + = outflow, - = inflow).
 */

/** Outflow shows negative, inflow shows positive. */
export function formatTransactionAmount(amount: number): string {
  const abs = Math.abs(amount);
  if (amount > 0) return `-$${abs.toFixed(2)}`;
  if (amount < 0) return `+$${abs.toFixed(2)}`;
  return `$0.00`;
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function formatTransactionDateShort(dateStr: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "Z");
  if (Number.isNaN(d.getTime())) return dateStr;
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}
