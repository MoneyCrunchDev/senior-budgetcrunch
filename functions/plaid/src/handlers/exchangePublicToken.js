export async function handleExchangePublicToken({
  req, res, log, error,
  plaidClient, databases, databaseId, tableId, ID,
}) {
  const { publicToken, userId } = req.body ?? {};

  if (!publicToken) {
    error('[exchangePublicToken] Missing publicToken in request body');
    return res.json({ error: 'Missing publicToken' }, 400);
  }

  if (!userId) {
    error('[exchangePublicToken] Missing userId in request body');
    return res.json({ error: 'Missing userId' }, 400);
  }

  let accessToken;
  let itemId;

  try {
    const response = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });
    accessToken = response.data.access_token;
    itemId = response.data.item_id;
    log(`[exchangePublicToken] Token exchanged for user: ${userId}, itemId: ${itemId}`);
  } catch (err) {
    error('[exchangePublicToken] Plaid token exchange failed: ' + (err.response?.data?.error_message ?? err.message));
    return res.json({ error: 'Failed to exchange public token' }, 500);
  }

  try {
    await databases.createDocument(databaseId, tableId, ID.unique(), {
      userId,
      itemId,
      accessToken,
    });
    log(`[exchangePublicToken] Saved plaid_items row for user: ${userId}, itemId: ${itemId}`);
  } catch (err) {
    error('[exchangePublicToken] Failed to save to DB: ' + (err.message ?? err));
    return res.json({ error: 'Token exchanged but failed to persist' }, 500);
  }

  return res.json({ ok: true, item_id: itemId });
}
