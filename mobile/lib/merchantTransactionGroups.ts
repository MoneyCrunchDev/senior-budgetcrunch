import type { Transaction } from "@/lib/plaidApi";
import { formatTransactionDateShort } from "@/lib/formatTransaction";

export function rowTitle(t: Transaction): string {
  return t.merchant_name || t.name || "Unknown";
}

function formatCategory(raw: string | null): string | null {
  if (!raw?.trim()) return null;
  return raw
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Hide Plaid metadata / JSON blobs (e.g. confidence) from subtitles. */
export function displayCategory(raw: string | null): string | null {
  if (!raw?.trim()) return null;
  const t = raw.trim();
  if (/confidence/i.test(t)) return null;
  if (t.startsWith("{")) {
    try {
      const o = JSON.parse(t) as Record<string, unknown>;
      if ("Confidence Level" in o || "confidence_level" in o) return null;
      return null;
    } catch {
      return null;
    }
  }
  if (t.includes("{") || t.includes("}")) return null;
  const formatted = formatCategory(t);
  if (!formatted || /confidence|\{/.test(formatted)) return null;
  return formatted;
}

export type MerchantGroup = {
  label: string;
  transactions: Transaction[];
  merchantTotal: number;
};

export function groupTransactionsByMerchant(
  transactions: Transaction[]
): MerchantGroup[] {
  const map = new Map<string, Transaction[]>();
  for (const t of transactions) {
    const label = rowTitle(t);
    const list = map.get(label) ?? [];
    list.push(t);
    map.set(label, list);
  }
  const groups: MerchantGroup[] = [...map.entries()].map(([label, txs]) => {
    const sorted = [...txs].sort((a, b) => {
      const da = a.date ?? "";
      const db = b.date ?? "";
      return db.localeCompare(da);
    });
    const merchantTotal = txs.reduce((s, x) => s + Math.abs(x.amount), 0);
    return { label, transactions: sorted, merchantTotal };
  });
  groups.sort((a, b) => b.merchantTotal - a.merchantTotal);
  return groups;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function avatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) >>> 0;
  }
  const hue = h % 360;
  return `hsl(${hue}, 52%, 42%)`;
}

export function merchantAggregates(
  transactions: Transaction[]
): { label: string; total: number }[] {
  const map = new Map<string, number>();
  for (const t of transactions) {
    const label = rowTitle(t);
    map.set(label, (map.get(label) ?? 0) + Math.abs(t.amount));
  }
  return [...map.entries()]
    .map(([label, total]) => ({ label, total }))
    .sort((a, b) => b.total - a.total);
}

export function totalSpent(transactions: Transaction[]): number {
  return transactions.reduce((acc, t) => acc + Math.abs(t.amount), 0);
}

export function computeFormattedDateSpan(transactions: Transaction[]): {
  from: string;
  to: string;
  same: boolean;
} | null {
  const dateStrs = transactions
    .map((t) => t.date)
    .filter((d): d is string => Boolean(d));
  if (dateStrs.length === 0) return null;
  const sorted = [...dateStrs].sort();
  const lo = sorted[0];
  const hi = sorted[sorted.length - 1];
  return {
    from: formatTransactionDateShort(lo),
    to: formatTransactionDateShort(hi),
    same: lo === hi,
  };
}
