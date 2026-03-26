/**
 * Phase B — Transaction location parsing & classification for the spending map + envelope.
 *
 * `location` can arrive either as:
 * - a JSON string (common when DB attribute is string), or
 * - a parsed object (common when DB attribute is object / JSON).
 *
 * Mapbox needs numeric lat/lon. This module is the single place that defines
 * "tracked on map" vs "untracked".
 */

import type { Transaction } from "@/lib/plaidApi";

/** WGS84 coordinates suitable for Mapbox `[lon, lat]` or heatmap points. */
export type LatLon = {
  lat: number;
  lon: number;
};

const LAT_MIN = -90;
const LAT_MAX = 90;
const LON_MIN = -180;
const LON_MAX = 180;

function isValidLatitude(n: number): boolean {
  return Number.isFinite(n) && n >= LAT_MIN && n <= LAT_MAX;
}

function isValidLongitude(n: number): boolean {
  return Number.isFinite(n) && n >= LON_MIN && n <= LON_MAX;
}

/**
 * Coerce a JSON value to a finite number (Plaid usually sends numbers; strings possible).
 */
function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value.trim());
    if (Number.isFinite(n)) return n;
  }
  return null;
}

/**
 * Read lat/lon from a parsed Plaid-style location object.
 * Supports `lat`/`lon` (Plaid) and `latitude`/`longitude` fallbacks.
 */
function readLatLonFromObject(obj: Record<string, unknown>): LatLon | null {
  const lat =
    toFiniteNumber(obj.lat) ??
    toFiniteNumber(obj.latitude);
  const lon =
    toFiniteNumber(obj.lon) ??
    toFiniteNumber(obj.longitude) ??
    toFiniteNumber(obj.lng) ??
    toFiniteNumber(obj.long);
  if (lat == null || lon == null) return null;
  if (!isValidLatitude(lat) || !isValidLongitude(lon)) return null;
  return { lat, lon };
}

function readLatLonFromCoordinatesArray(value: unknown): LatLon | null {
  if (!Array.isArray(value) || value.length < 2) return null;
  // GeoJSON-style point array: [lon, lat]
  const lon = toFiniteNumber(value[0]);
  const lat = toFiniteNumber(value[1]);
  if (lat == null || lon == null) return null;
  if (!isValidLatitude(lat) || !isValidLongitude(lon)) return null;
  return { lat, lon };
}

function readLatLonAnyObject(obj: Record<string, unknown>): LatLon | null {
  const direct = readLatLonFromObject(obj);
  if (direct) return direct;

  const nestedCoordinatesObj = obj.coordinates;
  if (
    nestedCoordinatesObj != null &&
    typeof nestedCoordinatesObj === "object" &&
    !Array.isArray(nestedCoordinatesObj)
  ) {
    const nested = readLatLonFromObject(
      nestedCoordinatesObj as Record<string, unknown>
    );
    if (nested) return nested;
  }

  const nestedCoordinatesArray = readLatLonFromCoordinatesArray(obj.coordinates);
  if (nestedCoordinatesArray) return nestedCoordinatesArray;

  const nestedLocation = obj.location;
  if (nestedLocation != null && typeof nestedLocation === "object" && !Array.isArray(nestedLocation)) {
    const nested = readLatLonAnyObject(nestedLocation as Record<string, unknown>);
    if (nested) return nested;
  }

  return null;
}

/**
 * Parse the `location` field from a transaction.
 *
 * Accepts either:
 * - string JSON (e.g. '{"lat":37.4,"lon":-122.0,...}')
 * - object (already parsed by backend / SDK)
 *
 * Returns null when coordinates are missing, invalid, or unparsable.
 */
export function parseLocationFieldToLatLon(
  raw: unknown
): LatLon | null {
  if (raw == null || raw === "") return null;

  if (typeof raw === "object" && !Array.isArray(raw)) {
    return readLatLonAnyObject(raw as Record<string, unknown>);
  }

  if (typeof raw === "string") {
    try {
      // Handle both normal JSON and double-encoded JSON strings.
      let parsed: unknown = JSON.parse(raw);
      if (typeof parsed === "string" && parsed.trim() !== "") {
        parsed = JSON.parse(parsed);
      }
      if (parsed == null || typeof parsed !== "object" || Array.isArray(parsed)) {
        return null;
      }
      return readLatLonAnyObject(parsed as Record<string, unknown>);
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Convenience: lat/lon for a transaction, or null if not mappable.
 */
export function getTransactionLatLon(transaction: Transaction): LatLon | null {
  return parseLocationFieldToLatLon(transaction.location);
}

/**
 * Plaid convention used in this app: **positive `amount` = money out (spending / outflow)**.
 * Negative = inflow (refund, deposit). Heatmap uses outflow only.
 */
export function isPlaidOutflow(amount: number): boolean {
  return amount > 0;
}

/**
 * Transaction has coordinates we can place on a map (independent of amount).
 * Use for splitting “has a map pin” vs envelope “untracked”.
 */
export function hasValidMapLocation(transaction: Transaction): boolean {
  return getTransactionLatLon(transaction) != null;
}

/**
 * **Tracked physical spending** — outflow AND valid lat/lon. Heatmap input (Phase C).
 */
export function isTrackedPhysicalOutflow(transaction: Transaction): boolean {
  return isPlaidOutflow(transaction.amount) && hasValidMapLocation(transaction);
}

/**
 * All outflow transactions that can be drawn on the heatmap (same as `isTrackedPhysicalOutflow`).
 */
export function filterHeatmapOutflowTransactions(
  transactions: Transaction[]
): Transaction[] {
  return transactions.filter(isTrackedPhysicalOutflow);
}

/**
 * **Untracked** — no usable map coordinates (inflows, online spend, missing Plaid location, bad JSON).
 * Envelope list (Phase D). Not restricted to outflow.
 */
export function filterUntrackedTransactions(
  transactions: Transaction[]
): Transaction[] {
  return transactions.filter((t) => !hasValidMapLocation(t));
}

/**
 * Approximate distance in **metres** between two WGS-84 points (Haversine).
 * Good enough for "same block / same store" proximity checks.
 */
function haversineMetres(a: LatLon, b: LatLon): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);
  const h =
    sinLat * sinLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLon * sinLon;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Given a tap coordinate, return all **heatmap-eligible** (outflow + valid coords)
 * transactions within `radiusMetres` of that point.
 * Sorted by amount descending (biggest spends first).
 */
export function findNearbyHeatmapTransactions(
  transactions: Transaction[],
  center: LatLon,
  radiusMetres = 250
): Transaction[] {
  return filterHeatmapOutflowTransactions(transactions)
    .filter((t) => {
      const ll = getTransactionLatLon(t);
      return ll != null && haversineMetres(center, ll) <= radiusMetres;
    })
    .sort((a, b) => b.amount - a.amount);
}
