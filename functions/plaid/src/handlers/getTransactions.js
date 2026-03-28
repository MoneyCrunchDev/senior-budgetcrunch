/**
 * List transactions from plaid_transactions for a user.
 * Optional filters: item_id (one linked account), month/year, transaction_id (single).
 */
export async function handleGetTransactions({
  req, res, log, error,
  databases, databaseId, transactionsTableId, Query,
}) {
  const { userId, item_id, month, year, transaction_id, limit } = req.body ?? {};

  if (!userId) {
    error('[getTransactions] Missing userId in request body');
    return res.json({ error: 'Missing userId' }, 400);
  }

  if (!transactionsTableId) {
    error('[getTransactions] Transactions table not configured');
    return res.json({ error: 'Transactions not available' }, 503);
  }

  const queries = [Query.equal('userId', userId)];

  if (item_id) {
    queries.push(Query.equal('item_id', item_id));
  }

  if (transaction_id) {
    queries.push(Query.equal('transaction_id', transaction_id));
  }

  if (month != null && year != null) {
    const m = Number(month);
    const y = Number(year);
    if (!Number.isNaN(m) && m >= 1 && m <= 12 && !Number.isNaN(y)) {
      const start = `${y}-${String(m).padStart(2, '0')}-01`;
      const lastDay = new Date(y, m, 0).getDate();
      const end = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      queries.push(Query.greaterThanEqual('date', start));
      queries.push(Query.lessThanEqual('date', end));
    }
  }

  queries.push(Query.orderDesc('date'));
  queries.push(Query.limit(transaction_id ? 1 : (Number(limit) || 200)));

  try {
    const result = await databases.listDocuments(
      databaseId,
      transactionsTableId,
      queries
    );

    const transactions = result.documents.map((doc) => ({
      transaction_id: doc.transaction_id,
      item_id: doc.item_id,
      date: doc.date,
      amount: doc.amount,
      name: doc.name,
      merchant_name: doc.merchant_name,
      category: doc.category,
      personal_finance_category: doc.personal_finance_category,
      pending: doc.pending,
      payment_channel: doc.payment_channel,
      // JSON string from Plaid (lat/lon, city, etc.) — same shape syncTransactions saves
      location: doc.location ?? null,
    }));

    log(`[getTransactions] Returning ${transactions.length} transactions for user ${userId}`);
    return res.json({ transactions });
  } catch (err) {
    error('[getTransactions] Failed to list transactions: ' + (err.message ?? err));
    return res.json({ error: 'Failed to load transactions' }, 500);
  }
}
