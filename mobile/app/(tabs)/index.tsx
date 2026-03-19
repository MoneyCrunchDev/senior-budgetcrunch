import Mapbox from "@rnmapbox/maps";
import * as Location from "expo-location";
import { useCallback, useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
} from "react-native";

const token = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
if (token) Mapbox.setAccessToken(token);

/** Fallback map center when we don't have permission or location (US center). */
const DEFAULT_CENTER: [number, number] = [-98, 39];
const DEFAULT_ZOOM = 13;

type LocationPermissionStatus = "undetermined" | "granted" | "denied";

export default function Index() {
  const [permissionStatus, setPermissionStatus] =
    useState<LocationPermissionStatus>("undetermined");
  const [checking, setChecking] = useState(true);

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

  return (
    <View style={styles.container}>
      <Mapbox.MapView style={styles.map}>
        <Mapbox.Camera
          defaultSettings={{
            centerCoordinate: DEFAULT_CENTER,
            zoomLevel: DEFAULT_ZOOM,
          }}
          centerCoordinate={canFollowUser ? undefined : DEFAULT_CENTER}
          zoomLevel={canFollowUser ? undefined : DEFAULT_ZOOM}
          followUserLocation={canFollowUser}
          followZoomLevel={DEFAULT_ZOOM}
          followUserMode={Mapbox.UserTrackingMode.Follow}
        />
        {canFollowUser && <Mapbox.UserLocation />}
      </Mapbox.MapView>

      {checking && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#333" />
          <Text style={styles.overlayText}>Requesting location access…</Text>
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
