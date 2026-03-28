export async function handleGetLinkedItems({
  req, res, log, error,
  databases, databaseId, tableId, Query,
}) {
  const { userId } = req.body ?? {};

  if (!userId) {
    error('[getLinkedItems] Missing userId in request body');
    return res.json({ error: 'Missing userId' }, 400);
  }

  try {
    const result = await databases.listDocuments(databaseId, tableId, [
      Query.equal('userId', userId),
    ]);

    const items = result.documents.map((doc) => ({
      itemId: doc.itemId,
      linkedAt: doc.$createdAt,
    }));

    log(`[getLinkedItems] Found ${items.length} linked items for user: ${userId}`);
    return res.json({ items });
  } catch (err) {
    error('[getLinkedItems] Failed to list plaid_items: ' + (err.message ?? err));
    return res.json({ error: 'Failed to read linked accounts' }, 500);
  }
}
