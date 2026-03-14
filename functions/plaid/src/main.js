import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';
import { handleCreateLinkToken } from './handlers/createLinkToken.js';
import { handleExchangePublicToken } from './handlers/exchangePublicToken.js';

const ACTIONS = {
  createLinkToken: handleCreateLinkToken,
  exchangePublicToken: handleExchangePublicToken,
};

export default async ({ req, res, log, error }) => {
  if (req.method !== 'POST') {
    return res.json({ error: 'Method Not Allowed' }, 405);
  }

  const { action } = req.body ?? {};

  if (!action) {
    error('Missing action in request body');
    return res.json({ error: 'Missing action' }, 400);
  }

  const handler = ACTIONS[action];

  if (!handler) {
    error(`Unknown action: ${action}`);
    return res.json({ error: `Unknown action: ${action}` }, 400);
  }

  const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID;
  const PLAID_SECRET = process.env.PLAID_SANDBOX_SECRET_KEY;

  if (!PLAID_CLIENT_ID || !PLAID_SECRET) {
    error('Missing Plaid credentials in environment variables');
    return res.json({ error: 'Server configuration error' }, 500);
  }

  const config = new Configuration({
    basePath: PlaidEnvironments.sandbox,
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': PLAID_CLIENT_ID,
        'PLAID-SECRET': PLAID_SECRET,
      },
    },
  });

  const plaidClient = new PlaidApi(config);

  return handler({ req, res, log, error, plaidClient });
};
