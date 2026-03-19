import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import TextCustom from '@/components/TextCustom';

type PermissionState = {
  status: Notifications.PermissionStatus | 'unknown';
  canAskAgain: boolean;
};

export default function NotificationPermissionScreen() {
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [perm, setPerm] = useState<PermissionState>({ status: 'unknown', canAskAgain: true });
  const [error, setError] = useState<string | null>(null);

  const granted = useMemo(() => perm.status === Notifications.PermissionStatus.GRANTED, [perm.status]);

  const refresh = async () => {
    setError(null);
    try {
      const res = await Notifications.getPermissionsAsync();
      setPerm({
        status: res.status ?? 'unknown',
        canAskAgain: Boolean(res.canAskAgain),
      });
    } catch (e: any) {
      setError(e?.message ?? 'Unable to check notification permissions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const request = async () => {
    setRequesting(true);
    setError(null);
    try {
      const res = await Notifications.requestPermissionsAsync();
      setPerm({
        status: res.status ?? 'unknown',
        canAskAgain: Boolean(res.canAskAgain),
      });
    } catch (e: any) {
      setError(e?.message ?? 'Unable to request notification permissions.');
    } finally {
      setRequesting(false);
    }
  };

  const continueNext = () => {
    router.replace('/(onboarding)/account');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator />
          <Text style={{ marginTop: 12 }}>Loading…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <TextCustom fontSize={34} style={styles.title}>
          Notifications
        </TextCustom>
        <Text style={styles.subtitle}>
          Enable notifications to get reminders and important updates. You can always change this later in system settings.
        </Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Current status</Text>
          <Text style={styles.cardValue}>
            {granted ? 'Enabled' : perm.status === Notifications.PermissionStatus.DENIED ? 'Denied' : 'Not enabled'}
          </Text>
          {!granted && !perm.canAskAgain ? (
            <Text style={styles.cardHint}>Notifications are blocked. Enable them in your phone’s Settings.</Text>
          ) : null}
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, (granted || requesting) && styles.buttonDisabled]}
          onPress={request}
          disabled={granted || requesting}
        >
          <Text style={styles.primaryButtonText}>{granted ? 'Enabled' : requesting ? 'Requesting…' : 'Enable notifications'}</Text>
        </TouchableOpacity>

        <View style={styles.row}>
          <TouchableOpacity style={styles.secondaryButton} onPress={refresh} disabled={requesting}>
            <Text style={styles.secondaryButtonText}>Refresh</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={continueNext}>
            <Text style={styles.secondaryButtonText}>{granted ? 'Continue' : 'Skip for now'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: 'white',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    color: '#333',
    marginBottom: 18,
    lineHeight: 20,
  },
  errorText: {
    color: '#b00020',
    marginBottom: 12,
  },
  card: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  cardLabel: {
    color: '#666',
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  cardHint: {
    marginTop: 8,
    color: '#666',
  },
  primaryButton: {
    backgroundColor: 'black',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#222',
  },
});

