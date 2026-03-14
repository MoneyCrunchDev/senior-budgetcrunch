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

export type PlaidAction = "createLinkToken" | "exchangePublicToken";

type CreateLinkTokenBody = { action: "createLinkToken"; userId: string };
type ExchangeBody = {
  action: "exchangePublicToken";
  userId: string;
  publicToken: string;
};
type PlaidRequestBody = CreateLinkTokenBody | ExchangeBody;

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
  access_token: string;
  item_id: string;
}

/**
 * Exchange the one-time public_token (from Plaid Link onSuccess) for a
 * permanent access_token + item_id. Must be called immediately after Link
 * succeeds — public tokens are single-use and expire in 30 minutes.
 */
export async function exchangePublicToken(
  userId: string,
  publicToken: string
): Promise<ExchangeResult> {
  const data = await postPlaidAction<ExchangeResult & { error?: string }>({
    action: "exchangePublicToken",
    userId,
    publicToken,
  });
  if (!data.access_token || !data.item_id) {
    throw new Error(
      (data as { error?: string }).error ?? "Exchange did not return access_token / item_id"
    );
  }
  return { access_token: data.access_token, item_id: data.item_id };
}
