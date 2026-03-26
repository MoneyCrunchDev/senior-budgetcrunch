import Mapbox from "@rnmapbox/maps";
import BottomSheet from "@gorhom/bottom-sheet";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ModalBottomSheet from "@/components/ModalBottomSheet";
import MoneyPitSheetContent from "@/components/MoneyPitSheetContent";
import UntrackedEnvelopeSheetContent from "@/components/UntrackedEnvelopeSheetContent";
import { useTransactions } from "@/context/TransactionContext";
import {
  loadEnvelopeSeenTransactionIds,
  markEnvelopeTransactionIdsSeen,
} from "@/lib/envelopeSeenStorage";
import {
  buildSpendingHeatmapGeoJson,
  countHeatmapFeatures,
} from "@/lib/spendingHeatmapGeoJson";
import {
  filterUntrackedTransactions,
  findNearbyHeatmapTransactions,
} from "@/lib/transactionLocation";
import type { Transaction } from "@/lib/plaidApi";

const token = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
if (token) Mapbox.setAccessToken(token);

/**
 * Basemap with strong default POI coverage (restaurants, retail, groceries, etc.).
 * The native default is already “Street”; we pin **Streets v12** so behavior is explicit.
 *
 * For even more labels: duplicate **Streets** in Mapbox Studio, lower `minzoom` on
 * `poi-label` (and related POI layers), then set `EXPO_PUBLIC_MAPBOX_STYLE_URL` to your style URL.
 */
const MAP_STYLE_URL =
  process.env.EXPO_PUBLIC_MAPBOX_STYLE_URL?.trim() ||
  "mapbox://styles/mapbox/streets-v12";

/** Fallback map center when we don't have permission or location (US center). */
const DEFAULT_CENTER: [number, number] = [-98, 39];
const DEFAULT_ZOOM = 13;

type LocationPermissionStatus = "undetermined" | "granted" | "denied";

/** Approx tab bar height so FAB sits above it (Expo tabs ~49–56). */
const TAB_BAR_EXTRA = 8;

/** Envelope FAB size; recenter stacks above with this gap. */
const ENVELOPE_FAB_SIZE = 48;
const FAB_STACK_GAP = 10;

export default function Index() {
  const insets = useSafeAreaInsets();
  const {
    transactions,
    loading: transactionsLoading,
    syncing,
    syncAndRefresh,
  } = useTransactions();
  const envelopeSheetRef = useRef<BottomSheet>(null);
  const envelopeSnapPoints = useMemo(() => ["52%", "88%"], []);

  const moneyPitSheetRef = useRef<BottomSheet>(null);
  const moneyPitSnapPoints = useMemo(() => ["42%", "78%"], []);
  const [moneyPitTransactions, setMoneyPitTransactions] = useState<Transaction[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);

  const heatmapGeoJson = useMemo(
    () => buildSpendingHeatmapGeoJson(transactions),
    [transactions]
  );
  const heatmapPointCount = useMemo(
    () => countHeatmapFeatures(heatmapGeoJson),
    [heatmapGeoJson]
  );

  /** Transactions with no usable map coordinates (Sandbox often has none). */
  const untrackedTransactions = useMemo(() => {
    const list = filterUntrackedTransactions(transactions);
    return [...list].sort((a, b) =>
      (b.date ?? "").localeCompare(a.date ?? "")
    );
  }, [transactions]);

  const [seenUntrackedIds, setSeenUntrackedIds] = useState<Set<string>>(
    () => new Set()
  );

  useEffect(() => {
    loadEnvelopeSeenTransactionIds().then(setSeenUntrackedIds);
  }, []);

  const hasNewUntrackedBadge = useMemo(() => {
    return untrackedTransactions.some(
      (t) => !seenUntrackedIds.has(t.transaction_id)
    );
  }, [untrackedTransactions, seenUntrackedIds]);

  const [permissionStatus, setPermissionStatus] =
    useState<LocationPermissionStatus>("undetermined");
  const [checking, setChecking] = useState(true);
  /** When false, user panned away; show recenter FAB. */
  const [followingUser, setFollowingUser] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (cancelled) return;
        if (status === "granted") {
          setPermissionStatus("granted");
          setChecking(false);
          return;
        }
        if (status === "denied") {
          setPermissionStatus("denied");
          setChecking(false);
          return;
        }
        // undetermined: request so the user sees the system pop-up
        const { status: newStatus } =
          await Location.requestForegroundPermissionsAsync();
        if (cancelled) return;
        setPermissionStatus(newStatus === "granted" ? "granted" : "denied");
      } catch {
        if (!cancelled) setPermissionStatus("denied");
      } finally {
        if (!cancelled) setChecking(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const openSettings = useCallback(() => {
    Linking.openSettings();
  }, []);

  const canFollowUser = permissionStatus === "granted";

  /** v10: user pan/zoom/rotate sets isGestureActive — turn off follow until they tap recenter. */
  const onCameraChanged = useCallback(
    (state: { gestures?: { isGestureActive?: boolean } }) => {
      if (state.gestures?.isGestureActive) {
        setFollowingUser(false);
      }
    },
    []
  );

  const recenterOnUser = useCallback(() => {
    setFollowingUser(true);
  }, []);

  const closeEnvelopeSheet = useCallback(() => {
    envelopeSheetRef.current?.close();
    setSheetOpen(false);
  }, []);

  const openEnvelopeSheet = useCallback(async () => {
    const ids = untrackedTransactions.map((t) => t.transaction_id);
    await markEnvelopeTransactionIdsSeen(ids);
    setSeenUntrackedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });
    setSheetOpen(true);
    requestAnimationFrame(() => envelopeSheetRef.current?.snapToIndex(0));
  }, [untrackedTransactions]);

  const onMapSyncPress = useCallback(() => {
    if (syncing) return;
    syncAndRefresh();
  }, [syncing, syncAndRefresh]);

  const closeMoneyPitSheet = useCallback(() => {
    moneyPitSheetRef.current?.close();
    setSheetOpen(false);
  }, []);

  const onHeatmapPointPress = useCallback(
    (event: { features: GeoJSON.Feature[]; coordinates: { latitude: number; longitude: number } }) => {
      const { latitude, longitude } = event.coordinates;
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
      const nearby = findNearbyHeatmapTransactions(transactions, {
        lat: latitude,
        lon: longitude,
      });
      if (nearby.length === 0) return;
      setMoneyPitTransactions(nearby);
      setSheetOpen(true);
      requestAnimationFrame(() => moneyPitSheetRef.current?.snapToIndex(0));
    },
    [transactions]
  );

  const fabBottom = insets.bottom + TAB_BAR_EXTRA + 12;
  const recenterFabBottom =
    fabBottom + ENVELOPE_FAB_SIZE + FAB_STACK_GAP;

  return (
    <View style={styles.container}>
      <Mapbox.MapView
        style={styles.map}
        styleURL={MAP_STYLE_URL}
        onCameraChanged={onCameraChanged}
      >
        <Mapbox.Camera
          defaultSettings={{
            centerCoordinate: DEFAULT_CENTER,
            zoomLevel: DEFAULT_ZOOM,
          }}
          centerCoordinate={canFollowUser ? undefined : DEFAULT_CENTER}
          zoomLevel={canFollowUser ? undefined : DEFAULT_ZOOM}
          followUserLocation={canFollowUser && followingUser}
          followZoomLevel={DEFAULT_ZOOM}
          followUserMode={Mapbox.UserTrackingMode.Follow}
        />
        {heatmapPointCount > 0 && (
          <Mapbox.ShapeSource
            id="spendingHeatmapSource"
            shape={heatmapGeoJson}
            onPress={onHeatmapPointPress}
            hitbox={{ width: 44, height: 44 }}
          >
            <Mapbox.HeatmapLayer
              id="spendingHeatmapLayer"
              style={{
                /**
                 * Radius is in **screen pixels**. If it stops growing past a zoom level, the blob
                 * looks “stuck” on the glass while the map zooms — we extend stops to ~22 so street
                 * zoom scales up with the map (roughly constant geographic feel).
                 */
                heatmapRadius: [
                  "interpolate",
                  ["exponential", 1.75],
                  ["zoom"],
                  3,
                  2,
                  8,
                  6,
                  11,
                  14,
                  13,
                  28,
                  15,
                  52,
                  17,
                  96,
                  19,
                  168,
                  21,
                  260,
                ],
                heatmapWeight: ["get", "weight"],
                heatmapIntensity: [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  0,
                  0.65,
                  11,
                  0.9,
                  15,
                  1.05,
                  19,
                  1.15,
                ],
                heatmapColor: [
                  "interpolate",
                  ["linear"],
                  ["heatmap-density"],
                  0,
                  "rgba(33, 102, 172, 0)",
                  0.15,
                  "rgb(103, 169, 207)",
                  0.35,
                  "rgb(209, 229, 240)",
                  0.5,
                  "rgb(253, 219, 199)",
                  0.65,
                  "rgb(239, 138, 98)",
                  0.8,
                  "rgb(215, 48, 31)",
                  1,
                  "rgb(165, 0, 38)",
                ],
                heatmapOpacity: 0.55,
              }}
            />
            <Mapbox.CircleLayer
              id="spendingHeatmapTapTarget"
              style={{
                circleRadius: 22,
                circleOpacity: 0,
              }}
            />
          </Mapbox.ShapeSource>
        )}
        {canFollowUser && <Mapbox.UserLocation />}
      </Mapbox.MapView>

      {!checking && !sheetOpen && (
        <View style={[styles.refreshFabWrap, { bottom: fabBottom }]}>
          <TouchableOpacity
            style={[styles.refreshFab, syncing && styles.refreshFabDisabled]}
            onPress={onMapSyncPress}
            disabled={syncing}
            activeOpacity={0.85}
            accessibilityLabel="Sync transactions and refresh map"
            accessibilityRole="button"
          >
            {syncing ? (
              <ActivityIndicator size="small" color="#0A6EF2" />
            ) : (
              <Ionicons name="refresh-outline" size={26} color="#0A6EF2" />
            )}
          </TouchableOpacity>
        </View>
      )}

      {!checking && !sheetOpen && (
        <View style={[styles.envelopeFabWrap, { bottom: fabBottom }]}>
          <TouchableOpacity
            style={styles.envelopeFab}
            onPress={openEnvelopeSheet}
            activeOpacity={0.85}
            accessibilityLabel="Purchases without map location"
            accessibilityRole="button"
          >
            <Ionicons name="mail-outline" size={26} color="#333" />
            {hasNewUntrackedBadge && (
              <View style={styles.envelopeBadge} accessibilityLabel="New items" />
            )}
          </TouchableOpacity>
        </View>
      )}

      {canFollowUser && !checking && !sheetOpen && !followingUser && (
        <TouchableOpacity
          style={[styles.recenterFab, { bottom: recenterFabBottom }]}
          onPress={recenterOnUser}
          activeOpacity={0.85}
          accessibilityLabel="Center map on my location"
          accessibilityRole="button"
        >
          <Ionicons name="navigate-outline" size={25} color="#0A6EF2" />
        </TouchableOpacity>
      )}

      {checking && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#333" />
          <Text style={styles.overlayText}>Requesting location access…</Text>
        </View>
      )}

      {!checking &&
        !transactionsLoading &&
        heatmapPointCount === 0 && (
          <View
            style={[
              styles.heatmapHint,
              { top: Math.max(insets.top, 8) + 8 },
            ]}
            pointerEvents="none"
          >
            <Text style={styles.heatmapHintText}>
              {transactions.length === 0
                ? "No transactions loaded yet. Open Timeline and pull to sync, or use Sync transactions in Settings."
                : "No outflow with map locations in your loaded data. Tap the envelope (bottom-right) to see purchases without coordinates — common in Sandbox."}
            </Text>
          </View>
        )}

      {!checking && permissionStatus === "denied" && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            Location denied — allow in Settings to center the map on you.
          </Text>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={openSettings}
            activeOpacity={0.8}
          >
            <Text style={styles.settingsButtonText}>Open Settings</Text>
          </TouchableOpacity>
        </View>
      )}

      <ModalBottomSheet
        ref={envelopeSheetRef}
        snapPoints={envelopeSnapPoints}
        onClose={closeEnvelopeSheet}
      >
        <UntrackedEnvelopeSheetContent
          transactions={untrackedTransactions}
          onClose={closeEnvelopeSheet}
        />
      </ModalBottomSheet>

      <ModalBottomSheet
        ref={moneyPitSheetRef}
        snapPoints={moneyPitSnapPoints}
        onClose={closeMoneyPitSheet}
      >
        <MoneyPitSheetContent
          transactions={moneyPitTransactions}
          onClose={closeMoneyPitSheet}
        />
      </ModalBottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  heatmapHint: {
    position: "absolute",
    left: 12,
    right: 12,
    backgroundColor: "rgba(255,255,255,0.94)",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E6E8EC",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 3,
  },
  heatmapHintText: {
    fontSize: 13,
    color: "#333",
    lineHeight: 18,
    textAlign: "center",
  },
  refreshFabWrap: {
    position: "absolute",
    left: 16,
    zIndex: 20,
    elevation: 20,
  },
  refreshFab: {
    width: ENVELOPE_FAB_SIZE,
    height: ENVELOPE_FAB_SIZE,
    borderRadius: ENVELOPE_FAB_SIZE / 2,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 6,
    borderWidth: 1,
    borderColor: "#E6E8EC",
  },
  refreshFabDisabled: {
    opacity: 0.75,
  },
  envelopeFabWrap: {
    position: "absolute",
    right: 16,
    zIndex: 20,
    elevation: 20,
  },
  envelopeFab: {
    width: ENVELOPE_FAB_SIZE,
    height: ENVELOPE_FAB_SIZE,
    borderRadius: ENVELOPE_FAB_SIZE / 2,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 6,
    borderWidth: 1,
    borderColor: "#E6E8EC",
  },
  envelopeBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#E53935",
    borderWidth: 2,
    borderColor: "#fff",
  },
  recenterFab: {
    position: "absolute",
    right: 16,
    width: 50,
    height: 50,
    borderRadius: 26,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#E6E8EC",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  overlayText: {
    marginTop: 12,
    fontSize: 16,
    color: "#333",
  },
  banner: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.85)",
    paddingVertical: 14,
    paddingHorizontal: 16,
    paddingBottom: 28,
  },
  bannerText: {
    color: "#fff",
    fontSize: 14,
    marginBottom: 10,
  },
  settingsButton: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: "#fff",
    borderRadius: 8,
  },
  settingsButtonText: {
    color: "#000",
    fontSize: 15,
    fontWeight: "600",
  },
});
