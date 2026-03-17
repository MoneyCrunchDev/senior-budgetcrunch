import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "@/context/AuthContext";
import {
  getTransactions,
  syncTransactions,
  type Transaction,
} from "@/lib/plaidApi";

const DEFAULT_LIMIT = 500;

type TransactionContextValue = {
  /** All transactions for the current user (last fetch, up to DEFAULT_LIMIT). One sync updates this for every screen. */
  transactions: Transaction[];
  /** True while the initial load or a manual load is in progress. */
  loading: boolean;
  /** True while sync (Plaid → Appwrite) + refetch is in progress. */
  syncing: boolean;
  /** Error message from last failed load or sync, or null. */
  error: string | null;
  /** Load transactions from API (no sync). Used on mount when userId is set. */
  loadTransactions: () => Promise<void>;
  /** Sync from Plaid to Appwrite, then refetch into context. Call from pull-to-refresh or Settings button. */
  syncAndRefresh: () => Promise<void>;
};

const TransactionContext = createContext<TransactionContextValue | null>(null);

export function TransactionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.$id ?? null;

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTransactions = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const list = await getTransactions(userId, { limit: DEFAULT_LIMIT });
      setTransactions(list);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const syncAndRefresh = useCallback(async () => {
    if (!userId) return;
    setSyncing(true);
    setError(null);
    try {
      await syncTransactions(userId);
      const list = await getTransactions(userId, { limit: DEFAULT_LIMIT });
      setTransactions(list);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    } finally {
      setSyncing(false);
    }
  }, [userId]);

  // Initial load when userId is available
  useEffect(() => {
    if (userId) {
      loadTransactions();
    } else {
      setLoading(false);
      setTransactions([]);
      setError(null);
    }
  }, [userId, loadTransactions]);

  const value = useMemo<TransactionContextValue>(
    () => ({
      transactions,
      loading,
      syncing,
      error,
      loadTransactions,
      syncAndRefresh,
    }),
    [transactions, loading, syncing, error, loadTransactions, syncAndRefresh]
  );

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransactions(): TransactionContextValue {
  const ctx = useContext(TransactionContext);
  if (!ctx) {
    throw new Error("useTransactions must be used within a TransactionProvider");
  }
  return ctx;
}
