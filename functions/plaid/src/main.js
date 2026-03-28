import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';
import { Client, Databases, ID, Query } from 'node-appwrite';
import { handleCreateLinkToken } from './handlers/createLinkToken.js';
import { handleExchangePublicToken } from './handlers/exchangePublicToken.js';
import { handleSyncTransactions } from './handlers/syncTransactions.js';
import { handleGetLinkedItems } from './handlers/getLinkedItems.js';
import { handleGetTransactions } from './handlers/getTransactions.js';

const ACTIONS = {
  createLinkToken: handleCreateLinkToken,
  exchangePublicToken: handleExchangePublicToken,
  syncTransactions: handleSyncTransactions,
  getLinkedItems: handleGetLinkedItems,
  getTransactions: handleGetTransactions,
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

  const APPWRITE_ENDPOINT = process.env.APPWRITE_ENDPOINT;
  const APPWRITE_PROJECT_ID = process.env.APPWRITE_PROJECT_ID;
  const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY;
  const APPWRITE_DATABASE_ID = process.env.APPWRITE_DATABASE_ID;
  const APPWRITE_PLAID_ITEMS_TABLE_ID = process.env.APPWRITE_PLAID_ITEMS_TABLE_ID;

  if (!APPWRITE_ENDPOINT || !APPWRITE_PROJECT_ID || !APPWRITE_API_KEY ||
      !APPWRITE_DATABASE_ID || !APPWRITE_PLAID_ITEMS_TABLE_ID) {
    error('Missing Appwrite env vars (ENDPOINT / PROJECT_ID / API_KEY / DATABASE_ID / PLAID_ITEMS_TABLE_ID)');
    return res.json({ error: 'Server configuration error' }, 500);
  }

  const appwriteClient = new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID)
    .setKey(APPWRITE_API_KEY);

  const databases = new Databases(appwriteClient);

  const APPWRITE_PLAID_TRANSACTIONS_TABLE_ID = process.env.APPWRITE_PLAID_TRANSACTIONS_TABLE_ID || null;

  return handler({
    req, res, log, error,
    plaidClient,
    databases,
    databaseId: APPWRITE_DATABASE_ID,
    tableId: APPWRITE_PLAID_ITEMS_TABLE_ID,
    transactionsTableId: APPWRITE_PLAID_TRANSACTIONS_TABLE_ID,
    ID,
    Query,
  });
};
