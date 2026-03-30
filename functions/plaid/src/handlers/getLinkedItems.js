import { resolveInstitutionFromAccessToken, trimLabel } from '../lib/resolveInstitution.js';

function needsInstitutionBackfill(doc) {
  const n = doc.institutionName;
  if (n == null || (typeof n === 'string' && n.trim() === '')) return true;
  return false;
}

export async function handleGetLinkedItems({
  req, res, log, error,
  plaidClient, databases, databaseId, tableId, Query,
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

    const items = [];
    for (const doc of result.documents) {
      let institutionName = trimLabel(doc.institutionName ?? null);
      let institutionId = trimLabel(doc.institutionId ?? null);

      if (needsInstitutionBackfill(doc) && doc.accessToken) {
        const resolved = await resolveInstitutionFromAccessToken(
          plaidClient,
          doc.accessToken,
          log
        );
        if (resolved.institutionName) institutionName = resolved.institutionName;
        if (resolved.institutionId) institutionId = resolved.institutionId;
        if (resolved.institutionName || resolved.institutionId) {
          try {
            const patch = {};
            if (resolved.institutionName) patch.institutionName = resolved.institutionName;
            if (resolved.institutionId) patch.institutionId = resolved.institutionId;
            await databases.updateDocument(databaseId, tableId, doc.$id, patch);
          } catch (updErr) {
            log(
              `[getLinkedItems] Backfill update failed for ${doc.$id}: ${updErr.message ?? updErr}`
            );
          }
        }
      }

      items.push({
        itemId: doc.itemId,
        linkedAt: doc.$createdAt,
        institutionName: institutionName ?? undefined,
        institutionId: institutionId ?? undefined,
      });
    }

    log(`[getLinkedItems] Found ${items.length} linked items for user: ${userId}`);
    return res.json({ items });
  } catch (err) {
    error('[getLinkedItems] Failed to list plaid_items: ' + (err.message ?? err));
    return res.json({ error: 'Failed to read linked accounts' }, 500);
  }
}
