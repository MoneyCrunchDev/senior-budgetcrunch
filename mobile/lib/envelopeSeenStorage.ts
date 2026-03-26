/**
 * Phase E — Persist which untracked (no-map-location) transaction IDs the user has opened
 * in the envelope sheet, so we can show a red "new" badge for unseen IDs.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@moneycrunch/envelope_seen_untracked_txn_ids";

export async function loadEnvelopeSeenTransactionIds(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((x): x is string => typeof x === "string"));
  } catch {
    return new Set();
  }
}

export async function markEnvelopeTransactionIdsSeen(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const current = await loadEnvelopeSeenTransactionIds();
  ids.forEach((id) => current.add(id));
  const arr = Array.from(current);
  const capped = arr.length > 4000 ? arr.slice(arr.length - 4000) : arr;
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(capped));
}
