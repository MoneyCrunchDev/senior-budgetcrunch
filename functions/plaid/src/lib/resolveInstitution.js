/**
 * Resolve human-readable institution labels from a Plaid access token.
 * Used after Link (exchange) and as a lazy backfill for older plaid_items rows.
 */

const MAX_LABEL_LEN = 256;

export function trimLabel(value) {
  if (value == null || typeof value !== 'string') return null;
  const t = value.trim();
  if (!t) return null;
  return t.length > MAX_LABEL_LEN ? t.slice(0, MAX_LABEL_LEN) : t;
}

/**
 * @param {import('plaid').PlaidApi} plaidClient
 * @param {string} accessToken
 * @param {{ (msg: string): void }} log
 * @returns {Promise<{ institutionName: string | null; institutionId: string | null }>}
 */
export async function resolveInstitutionFromAccessToken(plaidClient, accessToken, log) {
  let institutionName = null;
  let institutionId = null;

  try {
    const itemRes = await plaidClient.itemGet({ access_token: accessToken });
    const item = itemRes.data?.item;
    if (item) {
      institutionId = trimLabel(item.institution_id ?? null) ?? null;
      institutionName = trimLabel(item.institution_name ?? null) ?? null;
    }
  } catch (err) {
    log(
      `[resolveInstitution] itemGet failed: ${err.response?.data?.error_message ?? err.message}`
    );
    return { institutionName: null, institutionId: null };
  }

  if (!institutionName && institutionId) {
    try {
      const instRes = await plaidClient.institutionsGetById({
        institution_id: institutionId,
        country_codes: ['US', 'CA'],
      });
      const name = instRes.data?.institution?.name;
      institutionName = trimLabel(name ?? null) ?? null;
    } catch (err) {
      log(
        `[resolveInstitution] institutionsGetById failed: ${err.response?.data?.error_message ?? err.message}`
      );
    }
  }

  return { institutionName, institutionId };
}
