import Constants from "expo-constants";

/**
 * Base URL of the unified Appwrite `plaid` function (no trailing slash required).
 * Set EXPO_PUBLIC_PLAID_FUNCTION_URL in .env — same host you curl for createLinkToken.
 */
function getPlaidFunctionBaseUrl(): string {
  const url =
    process.env.EXPO_PUBLIC_PLAID_FUNCTION_URL ??
    (Constants.expoConfig?.extra as { plaidFunctionUrl?: string } | undefined)
      ?.plaidFunctionUrl ??
    "";
  return url.replace(/\/$/, "");
}

export type PlaidAction =
  | "createLinkToken"
  | "exchangePublicToken"
  | "syncTransactions"
  | "getLinkedItems"
  | "getTransactions";

type CreateLinkTokenBody = { action: "createLinkToken"; userId: string };
type ExchangeBody = {
  action: "exchangePublicToken";
  userId: string;
  publicToken: string;
  /** From Plaid Link `metadata.institution` when available. */
  institutionName?: string;
  institutionId?: string;
};
type SyncTransactionsBody = { action: "syncTransactions"; userId: string };
type GetLinkedItemsBody = { action: "getLinkedItems"; userId: string };
type GetTransactionsBody = {
  action: "getTransactions";
  userId: string;
  item_id?: string;
  month?: number;
  year?: number;
  transaction_id?: string;
  limit?: number;
};
type PlaidRequestBody =
  | CreateLinkTokenBody
  | ExchangeBody
  | SyncTransactionsBody
  | GetLinkedItemsBody
  | GetTransactionsBody;

/**
 * POST JSON to the plaid function. Always use JSON.stringify (like PowerShell ConvertTo-Json)
 * so Appwrite parses the body — avoids 400/500 parse errors.
 */
export async function postPlaidAction<T>(body: PlaidRequestBody): Promise<T> {
  const base = getPlaidFunctionBaseUrl();
  if (!base) {
    throw new Error(
      "EXPO_PUBLIC_PLAID_FUNCTION_URL is missing. Add it to .env and restart Expo."
    );
  }

  const res = await fetch(`${base}/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Plaid function non-JSON response (${res.status}): ${text.slice(0, 200)}`);
  }

  if (!res.ok) {
    const err = data as { error?: string };
    throw new Error(err.error ?? `Plaid function HTTP ${res.status}`);
  }

  return data as T;
}

/** Ask the server for a Link token (Plaid Link UI). */
export async function createLinkToken(userId: string): Promise<string> {
  const data = await postPlaidAction<{ link_token?: string; error?: string }>({
    action: "createLinkToken",
    userId,
  });
  if (!data.link_token) {
    throw new Error(data.error ?? "No link_token in response");
  }
  return data.link_token;
}

export interface ExchangeResult {
  ok: boolean;
  item_id: string;
}

/**
 * Exchange the one-time public_token (from Plaid Link onSuccess) for a
 * permanent access_token + item_id. The access_token is stored server-side
 * in the plaid_items table — never returned to the device.
 */
export async function exchangePublicToken(
  userId: string,
  publicToken: string,
  options?: { institutionName?: string; institutionId?: string }
): Promise<ExchangeResult> {
  const data = await postPlaidAction<ExchangeResult & { error?: string }>({
    action: "exchangePublicToken",
    userId,
    publicToken,
    ...(options?.institutionName != null && options.institutionName !== ""
      ? { institutionName: options.institutionName }
      : {}),
    ...(options?.institutionId != null && options.institutionId !== ""
      ? { institutionId: options.institutionId }
      : {}),
  });
  if (!data.ok || !data.item_id) {
    throw new Error(
      (data as { error?: string }).error ?? "Exchange failed or missing item_id"
    );
  }
  return { ok: data.ok, item_id: data.item_id };
}

export interface LinkedItem {
  itemId: string;
  linkedAt: string;
  institutionName?: string;
  institutionId?: string;
}

/** Fetch the list of linked bank items for the current user (no secrets). */
export async function getLinkedItems(userId: string): Promise<LinkedItem[]> {
  const data = await postPlaidAction<{ items?: LinkedItem[]; error?: string }>({
    action: "getLinkedItems",
    userId,
  });
  return data.items ?? [];
}

export interface SyncResult {
  transactions: Array<Record<string, unknown>>;
  saved: number;
  has_more: boolean;
}

/** Trigger a transaction sync for the current user. */
export async function syncTransactions(userId: string): Promise<SyncResult> {
  const data = await postPlaidAction<SyncResult & { error?: string }>({
    action: "syncTransactions",
    userId,
  });
  return {
    transactions: data.transactions ?? [],
    saved: data.saved ?? 0,
    has_more: data.has_more ?? false,
  };
}

export interface Transaction {
  transaction_id: string;
  item_id: string;
  date: string | null;
  amount: number;
  name: string | null;
  merchant_name: string | null;
  category: string | null;
  personal_finance_category: string | null;
  pending: boolean;
  payment_channel: string | null;
  /**
   * Plaid `location` payload from Appwrite, either as JSON string or parsed object.
   * We normalize both forms in `transactionLocation.ts`.
   */
  location: string | Record<string, unknown> | null;
}

export type GetTransactionsOptions = {
  item_id?: string;
  month?: number;
  year?: number;
  transaction_id?: string;
  limit?: number;
};

/** Fetch transactions from plaid_transactions for the current user. */
export async function getTransactions(
  userId: string,
  options?: GetTransactionsOptions
): Promise<Transaction[]> {
  const body: GetTransactionsBody = {
    action: "getTransactions",
    userId,
    ...options,
  };
  const data = await postPlaidAction<{ transactions?: Transaction[]; error?: string }>(body);
  return data.transactions ?? [];
}
