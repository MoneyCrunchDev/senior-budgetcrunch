export async function handleExchangePublicToken({ req, res, log, error, plaidClient }) {
  const { publicToken, userId } = req.body ?? {};

  if (!publicToken) {
    error('[exchangePublicToken] Missing publicToken in request body');
    return res.json({ error: 'Missing publicToken' }, 400);
  }

  if (!userId) {
    error('[exchangePublicToken] Missing userId in request body');
    return res.json({ error: 'Missing userId' }, 400);
  }

  try {
    const response = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });

    const accessToken = response.data.access_token;
    const itemId = response.data.item_id;

    log(`[exchangePublicToken] Token exchanged for user: ${userId}, itemId: ${itemId}`);

    return res.json({ access_token: accessToken, item_id: itemId });
  } catch (err) {
    error('[exchangePublicToken] Plaid token exchange failed: ' + (err.response?.data?.error_message ?? err.message));
    return res.json({ error: 'Failed to exchange public token' }, 500);
  }
}
