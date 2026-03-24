/**
 * Phase C — GeoJSON for Mapbox heatmap from outflow transactions with coordinates.
 */

import type { FeatureCollection, Feature, Point } from "geojson";
import type { Transaction } from "@/lib/plaidApi";
import {
  filterHeatmapOutflowTransactions,
  getTransactionLatLon,
} from "@/lib/transactionLocation";

/**
 * Heatmap weight from dollar outflow (Plaid positive amount).
 * Capped so one huge charge doesn't dominate; floor so tiny amounts still contribute.
 */
function heatmapWeightFromAmount(amount: number): number {
  const safe = Math.max(0, amount);
  return Math.max(0.2, Math.min(safe / 40, 18));
}

/**
 * Build a FeatureCollection of Points for Mapbox ShapeSource + HeatmapLayer.
 * Each feature has `properties.weight` for `heatmapWeight: ['get', 'weight']`.
 */
export function buildSpendingHeatmapGeoJson(
  transactions: Transaction[]
): FeatureCollection {
  const outflows = filterHeatmapOutflowTransactions(transactions);
  const features: Feature<Point>[] = [];

  for (const t of outflows) {
    const ll = getTransactionLatLon(t);
    if (!ll) continue;

    const feature: Feature<Point> = {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [ll.lon, ll.lat],
      },
      properties: {
        weight: heatmapWeightFromAmount(t.amount),
        transaction_id: t.transaction_id,
        amount: t.amount,
      },
    };
    features.push(feature);
  }

  return {
    type: "FeatureCollection",
    features,
  };
}

export function countHeatmapFeatures(collection: FeatureCollection): number {
  return collection.features.length;
}
