import type { Transaction } from "./plaidApi";

export type PersonalFinanceCategory = {
  primary: string;
  detailed: string;
  confidence_level: string;
};

/**
 * Parse the raw `personal_finance_category` field stored as a JSON string
 * in Appwrite.  Returns null when the value is missing or unparsable.
 */
export function parsePFC(
  raw: string | null | undefined
): PersonalFinanceCategory | null {
  if (!raw) return null;
  try {
    const obj = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (obj && typeof obj.primary === "string") {
      return {
        primary: obj.primary,
        detailed: obj.detailed ?? obj.primary,
        confidence_level: obj.confidence_level ?? "",
      };
    }
  } catch {
    /* unparsable */
  }
  return null;
}

/**
 * Turn a Plaid slug like `FOOD_AND_DRINK_FAST_FOOD` into
 * `"Food & Drink Fast Food"`.
 */
export function humanize(slug: string): string {
  return slug
    .toLowerCase()
    .split("_")
    .map((w) => (w === "and" ? "&" : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

/**
 * Humanised **primary** category for a transaction.
 * Falls back to the legacy `category` field, then "Uncategorized".
 */
export function getPrimaryLabel(t: Transaction): string {
  const pfc = parsePFC(t.personal_finance_category);
  if (pfc) return humanize(pfc.primary);

  if (t.category) {
    try {
      const parsed = JSON.parse(t.category);
      if (Array.isArray(parsed) && parsed.length) return parsed[parsed.length - 1];
      if (typeof parsed === "string") return parsed;
    } catch {
      return t.category;
    }
  }
  return "Uncategorized";
}

/**
 * Humanised **detailed** category — intended for the transaction detail view.
 * Falls back to primary, then legacy `category`, then "Uncategorized".
 */
export function getDetailedLabel(t: Transaction): string {
  const pfc = parsePFC(t.personal_finance_category);
  if (pfc) {
    const detail = humanize(pfc.detailed);
    const primary = humanize(pfc.primary);
    if (detail !== primary) return `${primary} › ${detail}`;
    return primary;
  }

  if (t.category) {
    try {
      const parsed = JSON.parse(t.category);
      if (Array.isArray(parsed) && parsed.length) return parsed.join(" › ");
      if (typeof parsed === "string") return parsed;
    } catch {
      return t.category;
    }
  }
  return "Uncategorized";
}

/**
 * Extract the raw primary slug (e.g. `"FOOD_AND_DRINK"`) from a transaction.
 * Returns `"UNCATEGORIZED"` when no category data exists.
 */
export function getPrimarySlug(t: Transaction): string {
  const pfc = parsePFC(t.personal_finance_category);
  return pfc?.primary ?? "UNCATEGORIZED";
}
