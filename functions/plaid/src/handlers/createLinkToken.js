import { Products, CountryCode } from 'plaid';

export async function handleCreateLinkToken({ req, res, log, error, plaidClient }) {
  const { userId } = req.body ?? {};

  if (!userId) {
    error('[createLinkToken] Missing userId in request body');
    return res.json({ error: 'Missing userId' }, 400);
  }

  try {
    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: userId },
      client_name: 'MoneyCrunch',
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: 'en',
    });

    log('[createLinkToken] Link token created for user: ' + userId);
    return res.json({ link_token: response.data.link_token });
  } catch (err) {
    error('[createLinkToken] Plaid linkTokenCreate failed: ' + (err.response?.data?.error_message ?? err.message));
    return res.json({ error: 'Failed to create link token' }, 500);
  }
}
