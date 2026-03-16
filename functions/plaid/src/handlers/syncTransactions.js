export async function handleSyncTransactions({
  req, res, log, error,
  plaidClient, databases, databaseId, tableId, Query,
}) {
  const { userId } = req.body ?? {};

  if (!userId) {
    error('[syncTransactions] Missing userId in request body');
    return res.json({ error: 'Missing userId' }, 400);
  }

  let items;
  try {
    const result = await databases.listDocuments(databaseId, tableId, [
      Query.equal('userId', userId),
    ]);
    items = result.documents;
  } catch (err) {
    error('[syncTransactions] Failed to list plaid_items: ' + (err.message ?? err));
    return res.json({ error: 'Failed to read linked accounts' }, 500);
  }

  if (!items.length) {
    log('[syncTransactions] No linked items for user: ' + userId);
    return res.json({ transactions: [], message: 'No linked items' });
  }

  const allTransactions = [];

  for (const item of items) {
    const { accessToken, cursor: storedCursor, $id: docId, itemId } = item;

    if (!accessToken) {
      error(`[syncTransactions] Missing accessToken for item ${docId}, skipping`);
      continue;
    }

    let currentCursor = storedCursor || '';
    let hasMore = true;

    try {
      while (hasMore) {
        const response = await plaidClient.transactionsSync({
          access_token: accessToken,
          cursor: currentCursor || undefined,
        });

        const data = response.data;
        const added = data.added ?? [];
        const modified = data.modified ?? [];

        for (const txn of [...added, ...modified]) {
          allTransactions.push({
            transaction_id: txn.transaction_id,
            account_id: txn.account_id,
            date: txn.date,
            amount: txn.amount,
            name: txn.name,
            merchant_name: txn.merchant_name ?? null,
            category: txn.category ?? [],
            personal_finance_category: txn.personal_finance_category ?? null,
            pending: txn.pending,
            payment_channel: txn.payment_channel ?? null,
            location: txn.location ?? null,
            item_id: itemId,
          });
        }

        currentCursor = data.next_cursor;
        hasMore = data.has_more;
      }

      await databases.updateDocument(databaseId, tableId, docId, {
        cursor: currentCursor,
      });
      log(`[syncTransactions] Synced item ${itemId} for user ${userId}, cursor updated`);
    } catch (err) {
      const msg = err.response?.data?.error_message ?? err.message ?? String(err);
      error(`[syncTransactions] Plaid sync failed for item ${itemId}: ${msg}`);
    }
  }

  log(`[syncTransactions] Returning ${allTransactions.length} transactions for user ${userId}`);
  return res.json({ transactions: allTransactions, has_more: false });
}
