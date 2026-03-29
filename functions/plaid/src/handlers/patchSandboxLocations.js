/**
 * HTTP handler (Plaid function action `patchSandboxLocations`): back-fill location data
 * on sandbox transactions stored in Appwrite for a given `userId`.
 *
 * Why: Plaid’s sandbox / custom-user payloads do not populate `location`, so synced
 * transactions would have no coordinates for the map. This handler matches each row’s
 * `name` / `merchant_name` to `LOCATION_MAP` / `ALIAS_MAP` and writes Plaid-shaped
 * location JSON onto the document.
 *
 * Partners: call with `{ action: "patchSandboxLocations", userId: "<appwrite user id>" }`
 * after syncing sandbox transactions — same logic applies to any test user, not only one
 * account. Keep lat/lon in sync with `sandbox_locations.json` / `scripts/sync-emulator-coords.mjs`
 * when you change reference coordinates.
 *
 * Idempotent: skips documents that already have non-null lat/lon.
 */

const LOCATION_MAP = {
  "The SpaceBar": { address: "S Akron Rd", city: "Mountain View", country: "US", lat: 37.41223626796634, lon: -122.05563935846753, postal_code: "94043", region: "CA", store_number: null },
  "Taco Bell": { address: "975 N Shoreline Blvd", city: "Mountain View", country: "US", lat: 37.408283396572365, lon: -122.07761420507997, postal_code: "94043", region: "CA", store_number: null },
  "Cafe at Mountain View": { address: "2000 N Shoreline Blvd Ground Floor", city: "Mountain View", country: "US", lat: 37.421381934634134, lon: -122.08048926682073, postal_code: "94043", region: "CA", store_number: null },
  "Michaels": { address: "2415 Charleston Rd BAY", city: "Mountain View", country: "US", lat: 37.42115115775456, lon: -122.09752654949324, postal_code: "94043", region: "CA", store_number: null },
  "El Taco Ranchero": { address: "920 Commercial St", city: "Palo Alto", country: "US", lat: 37.42292498826523, lon: -122.0999455944011, postal_code: "94303", region: "CA", store_number: null },
  "Topgolf": { address: "10 Topgolf Dr", city: "San Jose", country: "US", lat: 37.42313149891283, lon: -121.96976897108567, postal_code: "95002", region: "CA", store_number: null },
  "Vahl's Restaurant & Cocktail": { address: "1513 El Dorado St", city: "Alviso", country: "US", lat: 37.425914035717845, lon: -121.97728031178191, postal_code: "95002", region: "CA", store_number: null },
  "Levi's Stadium": { address: "4900 Marie P DeBartolo Way", city: "Santa Clara", country: "US", lat: 37.403421961969535, lon: -121.9693028601046, postal_code: "95054", region: "CA", store_number: null },
  "Costco Wholesale": { address: "1601 Coleman Ave", city: "Santa Clara", country: "US", lat: 37.35709413279404, lon: -121.93931206935954, postal_code: "95050", region: "CA", store_number: null },
  "In-N-Out Burger": { address: "1159 N Rengstorff Ave", city: "Mountain View", country: "US", lat: 37.42096323919354, lon: -122.09338452328237, postal_code: "94043", region: "CA", store_number: null },
  "Stanford Shopping Center": { address: "660 Stanford Shopping Center", city: "Palo Alto", country: "US", lat: 37.443497609217744, lon: -122.17130100492726, postal_code: "94304", region: "CA", store_number: null },
  "Mercedes-Benz of Palo Alto": { address: "1700 Embarcadero Rd", city: "Palo Alto", country: "US", lat: 37.44962034072136, lon: -122.1189165284505, postal_code: "94303", region: "CA", store_number: null },
  "Oakland Zoo": { address: "9777 Golf Links Rd", city: "Oakland", country: "US", lat: 37.748704577234705, lon: -122.14541612160274, postal_code: "94605", region: "CA", store_number: null },
  "Taqueria San Bruno": { address: "1045 San Mateo Ave", city: "San Bruno", country: "US", lat: 37.63534559154398, lon: -122.41170673187297, postal_code: "94066", region: "CA", store_number: null },
  "San Francisco Zoo": { address: "Sloat Blvd & Upper Great Hwy", city: "San Francisco", country: "US", lat: 37.73295163158418, lon: -122.50283075667083, postal_code: "94132", region: "CA", store_number: null },
  "The Home Depot": { address: "21787 Hesperian Blvd", city: "Hayward", country: "US", lat: 37.66339409716435, lon: -122.11855068946748, postal_code: "94541", region: "CA", store_number: null },
  "The Boiling Crab": { address: "71 Curtner Ave Suite 20", city: "San Jose", country: "US", lat: 37.30264719197744, lon: -121.86422569481577, postal_code: "95125", region: "CA", store_number: null },
  "Stan's Donut Shop": { address: "2628 Homestead Rd", city: "Santa Clara", country: "US", lat: 37.33894246819081, lon: -121.97289710725113, postal_code: "95051", region: "CA", store_number: null },
  "MEGA MART": { address: "760 E El Camino Real", city: "Sunnyvale", country: "US", lat: 37.356833644592825, lon: -122.02026617912253, postal_code: "94087", region: "CA", store_number: null },
  "Trader Joe's": { address: "2310 Homestead Rd", city: "Los Altos", country: "US", lat: 37.337141029890354, lon: -122.06743516795451, postal_code: "94024", region: "CA", store_number: null },
  "IKEA": { address: "1700 E Bayshore Rd", city: "East Palo Alto", country: "US", lat: 37.46108730037182, lon: -122.1393682092938, postal_code: "94303", region: "CA", store_number: null },
  "Disneyland Park": { address: null, city: "Anaheim", country: "US", lat: 33.812247607765286, lon: -117.9189300965209, postal_code: "92802", region: "CA", store_number: null },
  "Shakey's Pizza Parlor": { address: "1027 S Harbor Blvd", city: "Anaheim", country: "US", lat: 33.81957883283147, lon: -117.91546670829648, postal_code: "92805", region: "CA", store_number: null },
  "SeaLegs at the Beach": { address: "17851 Pacific Coast Hwy", city: "Huntington Beach", country: "US", lat: 33.708980434821726, lon: -118.06138654260425, postal_code: "92649", region: "CA", store_number: null },
  "Romano Cucina": { address: "16595 CA-1", city: "Sunset Beach", country: "US", lat: 33.72107863683473, lon: -118.07462400752577, postal_code: "90742", region: "CA", store_number: null },
  "Big Fish Bait & Tackle": { address: "1780 Pacific Coast Hwy", city: "Seal Beach", country: "US", lat: 33.74076609961845, lon: -118.09613707625947, postal_code: "90740", region: "CA", store_number: null },
  "Ballast Point Brewing": { address: "110 N Marina Dr", city: "Long Beach", country: "US", lat: 33.74646592320834, lon: -118.11476511931109, postal_code: "90803", region: "CA", store_number: null },
  "Malainey's Grill & One Hell of an Irish Bar": { address: "168 N Marina Dr", city: "Long Beach", country: "US", lat: 33.74718046096072, lon: -118.1149627982778, postal_code: "90803", region: "CA", store_number: null },
  "The Hangout Restaurant & Beach Bar": { address: "16490 Bolsa Chica St", city: "Huntington Beach", country: "US", lat: 33.72291906281764, lon: -118.04092753275232, postal_code: "92649", region: "CA", store_number: null },
  "Hops and Fog Brewing Company": { address: "511 Lighthouse Ave", city: "Pacific Grove", country: "US", lat: 36.62015035286096, lon: -121.91611726436204, postal_code: "93950", region: "CA", store_number: null },
  "The Inn at Spanish Bay": { address: "2700 17 Mile Dr", city: "Pebble Beach", country: "US", lat: 36.61225179163243, lon: -121.94245663320466, postal_code: "93953", region: "CA", store_number: null },
  "Roy's at Pebble Beach": { address: "2700 17 Mile Dr", city: "Pebble Beach", country: "US", lat: 36.61222672708888, lon: -121.94310227799167, postal_code: "93953", region: "CA", store_number: null },
  "The Spa at Pebble Beach": { address: "1518 Cypress Dr", city: "Pebble Beach", country: "US", lat: 36.5699133014877, lon: -121.94661978197817, postal_code: "93953", region: "CA", store_number: null },
  "Casa Palmero at Pebble Beach": { address: "1518 Cypress Dr", city: "Pebble Beach", country: "US", lat: 36.569792289454604, lon: -121.94718930702315, postal_code: "93953", region: "CA", store_number: null },
  "Ava's Downtown Market & Deli": { address: "340 Castro St", city: "Mountain View", country: "US", lat: 37.392168492784776, lon: -122.08032092340264, postal_code: "94041", region: "CA", store_number: null },
  "Bloomsgiving": { address: "301 Castro St", city: "Mountain View", country: "US", lat: 37.39234948029698, lon: -122.07959917613034, postal_code: "94041", region: "CA", store_number: null },
  "CVS Pharmacy": { address: "850 California St", city: "Mountain View", country: "US", lat: 37.392164908861844, lon: -122.08099981693074, postal_code: "94041", region: "CA", store_number: null },
  "PetSmart": { address: "2440 E Charleston Rd", city: "Mountain View", country: "US", lat: 37.4227318305945, lon: -122.0961147341856, postal_code: "94043", region: "CA", store_number: null },
  "Greenberg Design Gallery": { address: "908 Industrial Ave Unit A", city: "Palo Alto", country: "US", lat: 37.42245556007942, lon: -122.0983434318021, postal_code: "94303", region: "CA", store_number: null },
  "Patagonia": { address: "525 Alma St", city: "Palo Alto", country: "US", lat: 37.443170081525835, lon: -122.16293864087673, postal_code: "94301", region: "CA", store_number: null },
  "Center Tailoring Alterations & Tuxedo": { address: "257 Castro St", city: "Mountain View", country: "US", lat: 37.39300055272411, lon: -122.07909228435659, postal_code: "94041", region: "CA", store_number: null },
  "Urban Outfitters": { address: "660 Stanford Shopping Center", city: "Palo Alto", country: "US", lat: 37.44431571365312, lon: -122.17136399712622, postal_code: "94304", region: "CA", store_number: null },
  "Boba Bliss": { address: "685 San Antonio Rd Suite 15", city: "Mountain View", country: "US", lat: 37.4014902774058, lon: -122.1131030052077, postal_code: "94040", region: "CA", store_number: null },
  "ARCO": { address: "988 N San Antonio Rd", city: "Los Altos", country: "US", lat: 37.399858060181785, lon: -122.11457683074664, postal_code: "94022", region: "CA", store_number: null },
  "Jack in the Box": { address: "4896 El Camino Real", city: "Los Altos", country: "US", lat: 37.39836043055535, lon: -122.10881375685237, postal_code: "94022", region: "CA", store_number: null },
  "Zareen's": { address: "1477 Plymouth St Suite C", city: "Mountain View", country: "US", lat: 37.416225701894625, lon: -122.07952891934369, postal_code: "94043", region: "CA", store_number: null },
  "Chick-fil-A": { address: "1950 El Camino Real", city: "Santa Clara", country: "US", lat: 37.3520621034523, lon: -121.958721527957, postal_code: "95050", region: "CA", store_number: null },
  "Santana Row": { address: "377 Santana Row", city: "San Jose", country: "US", lat: 37.322104070839266, lon: -121.94828879089897, postal_code: "95128", region: "CA", store_number: null },
  "Fogo de Chao Brazilian Steakhouse": { address: "377 Santana Row #1090", city: "San Jose", country: "US", lat: 37.32027377717806, lon: -121.94975698968193, postal_code: "95128", region: "CA", store_number: null },
  "lululemon": { address: "334 Santana Row Unit 1035", city: "San Jose", country: "US", lat: 37.32215193105227, lon: -121.94750979620395, postal_code: "95128", region: "CA", store_number: null },
  "Nike Santana Row": { address: "333 Santana Row #1000", city: "San Jose", country: "US", lat: 37.322125120636095, lon: -121.94829352369862, postal_code: "95128", region: "CA", store_number: null },
  "Aloe Pilates": { address: "860 S Winchester Blvd Ste A", city: "San Jose", country: "US", lat: 37.31186852993601, lon: -121.94973255611251, postal_code: "95128", region: "CA", store_number: null },

  "Whole Foods Market": { address: "4800 El Camino Real", city: "Los Altos", country: "US", lat: 37.39912124562607, lon: -122.1105817851399, postal_code: "94022", region: "CA", store_number: null },
  "Best Buy": { address: "31350 Courthouse Dr", city: "Union City", country: "US", lat: 37.601045653411816, lon: -122.06427333594416, postal_code: "94587", region: "CA", store_number: null },
  "Walmart Supercenter": { address: "600 Showers Dr", city: "Mountain View", country: "US", lat: 37.40089756963302, lon: -122.10969235046318, postal_code: "94040", region: "CA", store_number: null },
  "Target": { address: "555 Showers Dr", city: "Mountain View", country: "US", lat: 37.4011490437953, lon: -122.10621180578093, postal_code: "94040", region: "CA", store_number: null },
};

/**
 * Variant aliases — transaction descriptions that include a suffix (e.g.
 * "Target MV", "Best Buy Milpitas") map to a specific location that differs
 * from the default entry above.
 */
const ALIAS_MAP = {
  "Target MV":          LOCATION_MAP["Target"],
  "Target Sunnyvale":   { address: "298 W McKinley Ave", city: "Sunnyvale", country: "US", lat: 37.37390198088723, lon: -122.03224243903735, postal_code: "94086", region: "CA", store_number: null },
  "Best Buy UC":        LOCATION_MAP["Best Buy"],
  "Best Buy Milpitas":  { address: "63 Ranch Dr", city: "Milpitas", country: "US", lat: 37.42793763447682, lon: -121.92315817225672, postal_code: "95035", region: "CA", store_number: null },
  "Walmart MV":         LOCATION_MAP["Walmart Supercenter"],
  "Walmart Milpitas":   { address: "301 Ranch Dr", city: "Milpitas", country: "US", lat: 37.4315324486958, lon: -121.92121558865063, postal_code: "95035", region: "CA", store_number: null },
  "Whole Foods Market SA": { address: "4800 El Camino Real", city: "Los Altos", country: "US", lat: 37.39902055383707, lon: -122.11068223256696, postal_code: "94022", region: "CA", store_number: null },
  "Malainey's Grill":   LOCATION_MAP["Malainey's Grill & One Hell of an Irish Bar"],
};

function locationHasCoords(locRaw) {
  if (!locRaw) return false;
  try {
    const obj = typeof locRaw === 'string' ? JSON.parse(locRaw) : locRaw;
    return obj && typeof obj.lat === 'number' && typeof obj.lon === 'number'
      && obj.lat !== 0 && obj.lon !== 0;
  } catch {
    return false;
  }
}

function findLocation(txnName) {
  if (!txnName) return null;
  const name = txnName.trim();
  if (ALIAS_MAP[name]) return ALIAS_MAP[name];
  if (LOCATION_MAP[name]) return LOCATION_MAP[name];
  for (const key of Object.keys(LOCATION_MAP)) {
    if (name.toLowerCase().includes(key.toLowerCase())) return LOCATION_MAP[key];
  }
  for (const key of Object.keys(ALIAS_MAP)) {
    if (name.toLowerCase().includes(key.toLowerCase())) return ALIAS_MAP[key];
  }
  return null;
}

/** Lists all transactions for `userId`, patches missing locations where a map match exists. */
export async function handlePatchSandboxLocations({
  req, res, log, error,
  databases, databaseId, transactionsTableId, Query,
}) {
  const { userId } = req.body ?? {};

  if (!userId) {
    error('[patchSandboxLocations] Missing userId');
    return res.json({ error: 'Missing userId' }, 400);
  }

  if (!transactionsTableId) {
    error('[patchSandboxLocations] No transactions table configured');
    return res.json({ error: 'Transactions table not configured' }, 500);
  }

  let allDocs = [];
  let cursor = undefined;
  const PAGE = 100;

  try {
    while (true) {
      const queries = [
        Query.equal('userId', userId),
        Query.limit(PAGE),
      ];
      if (cursor) queries.push(Query.cursorAfter(cursor));

      const batch = await databases.listDocuments(databaseId, transactionsTableId, queries);
      allDocs = allDocs.concat(batch.documents);
      if (batch.documents.length < PAGE) break;
      cursor = batch.documents[batch.documents.length - 1].$id;
    }
  } catch (err) {
    error('[patchSandboxLocations] Failed to list transactions: ' + (err.message ?? err));
    return res.json({ error: 'Failed to list transactions' }, 500);
  }

  let patched = 0;
  let skipped = 0;
  let noMatch = 0;

  for (const doc of allDocs) {
    if (locationHasCoords(doc.location)) {
      skipped++;
      continue;
    }

    const loc = findLocation(doc.name) || findLocation(doc.merchant_name);
    if (!loc) {
      noMatch++;
      continue;
    }

    try {
      await databases.updateDocument(databaseId, transactionsTableId, doc.$id, {
        location: JSON.stringify(loc),
      });
      patched++;
    } catch (err) {
      error(`[patchSandboxLocations] Failed to update ${doc.$id}: ${err.message ?? err}`);
    }
  }

  log(`[patchSandboxLocations] Done for ${userId}: ${patched} patched, ${skipped} already had coords, ${noMatch} unmatched`);
  return res.json({ patched, skipped, noMatch, total: allDocs.length });
}
