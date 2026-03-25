# Spending map & envelope — implementation phases

Track progress here across sessions. Full plan lives in team notes / prior spec.

| Phase | Description | Status |
|-------|-------------|--------|
| **A** | Data plumbing: API returns `location`; app `Transaction` includes `location` | **Done** |

| **B** | Parse lat/lon; split tracked vs untracked; outflow filter helper | **Done** |

| **C** | Home map: GeoJSON + HeatmapLayer; empty copy when no points | **Done** |

| **D** | Envelope FAB + bottom sheet (untracked list) | **Done** |

| **E** | Red “new” badge + AsyncStorage (seen transaction ids) | **Done** |

| **F** | Polish: map refresh FAB + memoized GeoJSON | **Done** |

| **G** | Production parity: why KFC stayed in envelope + heatmap fix (deploy + bundle) | **Done** |

---

## Phase A (complete) — what changed

1. **`functions/plaid/src/handlers/getTransactions.js`**  
   Each transaction in the JSON response now includes `location`: the same field stored in Appwrite (`doc.location`), or `null` if missing.

2. **`mobile/lib/plaidApi.ts`**  
   The `Transaction` interface now includes `location: string | null` so TypeScript matches the API.

**Deploy note:** Redeploy the Plaid Appwrite function after changing `getTransactions.js` so production returns `location`.

---

## Phase B (complete) — what changed

**New file: `mobile/lib/transactionLocation.ts`**

Single source of truth for map-related classification:

| Export | Purpose |
|--------|---------|
| `LatLon` | `{ lat, lon }` in WGS84 |
| `parseLocationFieldToLatLon(raw)` | Parse JSON string → coordinates or `null` |
| `getTransactionLatLon(t)` | Same, for a `Transaction` |
| `isPlaidOutflow(amount)` | `amount > 0` (spending in Plaid convention) |
| `hasValidMapLocation(t)` | Has parsable lat/lon in range |
| `isTrackedPhysicalOutflow(t)` | Outflow **and** map location → **heatmap** (Phase C) |
| `filterHeatmapOutflowTransactions(list)` | Array for heatmap |
| `filterUntrackedTransactions(list)` | No coords → **envelope** (Phase D) |

**Parsing details:** Accepts Plaid `lat`/`lon` or `latitude`/`longitude`; coerces numeric strings; rejects invalid JSON and out-of-range coordinates.

**Next:** Phase C imports `filterHeatmapOutflowTransactions` + `getTransactionLatLon`; Phase D imports `filterUntrackedTransactions`.

---

## Phase C (complete) — what changed

1. **`mobile/lib/spendingHeatmapGeoJson.ts`**  
   - `buildSpendingHeatmapGeoJson(transactions)` → GeoJSON `FeatureCollection` of Points (`[lon, lat]`).  
   - Uses Phase B filters; each feature has `properties.weight` (from dollar amount, capped/floored for stable heatmap scaling).  
   - `countHeatmapFeatures(collection)` for UI checks.

2. **`mobile/app/(tabs)/index.tsx`**  
   - `useTransactions()` → same list as Timeline (updates after sync).  
   - `useMemo` rebuilds GeoJSON when `transactions` change.  
   - **`Mapbox.ShapeSource`** + **`Mapbox.HeatmapLayer`** (only when `heatmapPointCount > 0`): blue → white → orange → **red** by density; `heatmapWeight` from `weight` property.  
   - **Layer order:** Camera → heatmap → `UserLocation` (user dot on top).  
   - **Empty hint** (top card, `pointerEvents="none"`): when not loading, no heatmap points — either “sync first” (0 txns) or “no map locations in loaded data” (has txns but none geocoded for heatmap).

**Try it:** After sync, any Plaid outflow with `lat`/`lon` in `location` should glow on the map; Sandbox often has sparse locations.

---

## Phase D + E (complete) — envelope & “new” badge

1. **`@react-native-async-storage/async-storage`** — persist seen untracked `transaction_id`s.

2. **`mobile/lib/envelopeSeenStorage.ts`**  
   - `loadEnvelopeSeenTransactionIds()` → `Set<string>`  
   - `markEnvelopeTransactionIdsSeen(ids)` — merge and save (cap ~4000 ids to limit storage)

3. **`mobile/lib/formatTransaction.ts`** — `formatTransactionAmount`, `formatTransactionDateShort` for sheet rows.

4. **`mobile/components/UntrackedEnvelopeSheetContent.tsx`**  
   - `BottomSheetFlatList` of `filterUntrackedTransactions` output (sorted date desc).  
   - Explains Sandbox / online / missing coordinates; empty state when none.

5. **`mobile/app/(tabs)/index.tsx`**  
   - **Envelope FAB** bottom-right (`mail-outline`), above tab bar; opens sheet.  
   - **Red dot** when any untracked `transaction_id` is not in the seen set; cleared after **open** (all current untracked ids marked seen). New txns after sync → badge again.  
   - **Recenter** FAB moved up to stack above the envelope.  
   - Top hint copy updated to point at the envelope.

**Sandbox:** No heatmap is expected when Plaid omits coordinates; envelope lists those transactions instead.

---

## Phase F (complete) — map refresh FAB

- **`mobile/app/(tabs)/index.tsx`:** Bottom-**left** circular FAB (`refresh-outline`) calls **`syncAndRefresh()`** from `TransactionContext` (same as Timeline pull-to-refresh / Settings). Shows **`ActivityIndicator`** while **`syncing`**; button disabled during sync. GeoJSON was already memoized in Phase C.

---

## Phase G (complete) — troubleshooting: KFC on map vs envelope (“it works in Appwrite but not in the app”)

This phase documents a real end-to-end break between **what Appwrite stored**, **what the Plaid function returned**, and **what the mobile app could classify**. It is worth reading before the next manual deploy.

### Symptom

- A sandbox **KFC** transaction was edited in the Appwrite console so **`location`** contained a full Plaid-style JSON object (address, **numeric `lat` / `lon`**, etc.).
- After rebuilds and refreshes, **nothing appeared on the heatmap** near that coordinate, and **KFC still appeared** in the envelope sheet (“No map location”).
- Other transactions without coordinates correctly remained in the envelope; the map UX was behaving as coded—the **payload** did not match expectations.

### What we tried first (client-side) — useful hardening, not the root cause

We improved **`mobile/lib/transactionLocation.ts`** so the app could handle more real-world shapes:

| Change | Why we tried it | Outcome |
|--------|------------------|--------|
| Accept `location` as **JSON string or already-parsed object** | Appwrite / serializers sometimes return objects; `JSON.parse` on an object fails and yields “no coordinates.” | Good for robustness; **did not fix KFC** once we measured the API. |
| **Double-encoded** JSON strings, **`lng` / `long`**, nested **`coordinates` / `location`** | Manual edits and odd payloads can trip a strict parser. | Same: helpful; **not** why KFC stayed untracked. |
| **`Transaction.location` type** widened in **`plaidApi.ts`** | TypeScript should reflect API reality. | Correct typing only; no effect on missing data. |

We also re-checked product rules: **heatmap uses outflow only** (`amount > 0` in Plaid convention), and **camera** may center on the user so you must **pan to the merchant** to see the heat. KFC’s amount was positive outflow; viewport was a red herring once data was missing.

**Lesson:** If the envelope still lists a row, `hasValidMapLocation` is false for the **in-memory** transaction list—always verify the **function response**, not only the console grid.

### What misled us: Appwrite UI vs HTTP response

- The **table view** in Appwrite showed a populated **`location`** cell for `transaction_id` `NQ11gV1M56H33L7DADmdHjMwXBR5z9fndX3Qx`.
- A direct **REST `GET` document by `$id`** (`/databases/.../collections/plaid_transactions/documents/{documentId}`) showed the same: **`location`** as a **string** with valid **`lat` / `lon`**.

So the **database row was correct**.

### The real break: `getTransactions` over HTTP returned no `location`

We reproduced the app’s path: **`POST`** to the deployed Plaid function URL with `action: "getTransactions"` and the logged-in **`userId`**.

Critical detours:

1. **Wrong `userId` in PowerShell** (typo: `...13af...` vs `...134f...`)  
   - One returned **0** transactions; the other returned **51**.  
   - **Lesson:** Copy the user id from the session / logs; a single character mismatch looks like “the API is broken.”

2. **With the correct user**, listing KFC rows showed **`location` empty** in the function JSON, while the document GET showed it present.  
   - That meant: **not** Mapbox, **not** parsing in the app first—**the function deployment** (or its mapping) was out of sync with what we thought was live.

3. **Hypothesis:** Production was still running an older build of **`getTransactions.js`** that omitted **`location`** in the mapped object, or pointed at another DB/collection (env vars).  
   - Function **environment variables** in Appwrite were verified: `APPWRITE_DATABASE_ID`, `APPWRITE_PLAID_TRANSACTIONS_TABLE_ID=plaid_transactions`, endpoint, project—**all matched** the working REST test.

So the remaining gap was **what code was actually deployed**.

### First redeploy attempt — 503 “Cannot find package 'plaid'”

- Manual deployment required a **`.tar.gz`** of function source.
- First archive contained only **`package.json`**, **`package-lock.json`**, and **`src/`** (no **`node_modules`**), assuming the platform would run **`npm install`**.  
- On this project’s Appwrite setup, **dependencies were not present at runtime**, so Node failed with:

  `Failed to load module: Cannot find package 'plaid' imported from /mnt/code/src/main.js`

- **Fix:** From **`functions/plaid`**, run **`npm ci`**, then build the archive **including `node_modules`**:

  `tar -czvf ../plaid-function.tar.gz package.json package-lock.json src node_modules`

- **Caveat:** Stay under the **manual upload size limit** (e.g. 30MB). This bundle was small enough for Plaid + node-appwrite.

### What worked

1. **Redeploy** the Plaid function with the archive that includes **`node_modules`** (or fix the function’s **build command** so `npm install` reliably runs—either path is valid; vendoring deps fixed it here).
2. **Re-test** `getTransactions` from PowerShell: the KFC object then included:

   `"location": "{\"address\":...,\"lat\":37.42...,\"lon\":-122.09...}"`

3. **Sync in the app** (map refresh FAB or Settings).  
   - **Heatmap** appears near Mountain View / Costco test coordinates.  
   - **KFC disappears** from the envelope list (other transactions without coords still appear there, as designed).

### Summary table

| Layer | Problem | Resolution |
|-------|---------|------------|
| App | Parser strictness | Hardened `transactionLocation.ts` + `Transaction.location` typing (defensive). |
| Debugging | Wrong `userId` in curl/PowerShell | Use exact app user id; verify transaction count. |
| Truth source | DB document had `location`; function JSON did not | Redeploy function with **`location`** in **`getTransactions.js`** mapping. |
| Deploy | Missing `plaid` at runtime | Bundle **`node_modules`** in `.tar.gz` (or enforce install in build). |

**Ongoing deploy note:** After any change to **`functions/plaid`**, rebuild the tarball with **`npm ci`** and **`node_modules`** included (unless you have confirmed server-side install), upload, wait for **active** deployment, then smoke-test **`getTransactions`** for a known `transaction_id` before debugging the app UI again.
