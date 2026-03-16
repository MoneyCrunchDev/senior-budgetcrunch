function safeStringify(val) {
  if (val == null) return null;
  if (typeof val === 'string') return val;
  return JSON.stringify(val);
}

export async function handleSyncTransactions({
  req, res, log, error,
  plaidClient, databases, databaseId, tableId, transactionsTableId, ID, Query,
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
    return res.json({ transactions: [], saved: 0, message: 'No linked items' });
  }

  const allTransactions = [];
  let savedCount = 0;

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
          const normalized = {
            transaction_id: txn.transaction_id,
            account_id: txn.account_id ?? null,
            date: txn.date ?? null,
            amount: txn.amount ?? 0,
            name: txn.name ?? null,
            merchant_name: txn.merchant_name ?? null,
            category: safeStringify(txn.category),
            personal_finance_category: safeStringify(txn.personal_finance_category),
            pending: txn.pending ?? false,
            payment_channel: txn.payment_channel ?? null,
            location: safeStringify(txn.location),
            item_id: itemId,
          };

          allTransactions.push(normalized);

          if (transactionsTableId) {
            try {
              const existing = await databases.listDocuments(databaseId, transactionsTableId, [
                Query.equal('transaction_id', txn.transaction_id),
                Query.limit(1),
              ]);

              if (existing.documents.length === 0) {
                await databases.createDocument(databaseId, transactionsTableId, ID.unique(), {
                  userId,
                  ...normalized,
                });
                savedCount++;
              }
            } catch (dbErr) {
              error(`[syncTransactions] Failed to save txn ${txn.transaction_id}: ${dbErr.message ?? dbErr}`);
            }
          }
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

  log(`[syncTransactions] Returning ${allTransactions.length} transactions (${savedCount} new) for user ${userId}`);
  return res.json({ transactions: allTransactions, saved: savedCount, has_more: false });
}
