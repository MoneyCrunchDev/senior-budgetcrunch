import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useTransactions } from "./TransactionContext";
import { getPrimarySlug, humanize } from "@/lib/categoryHelpers";

const BUDGETS_STORAGE_KEY = "@moneycrunch/category_budgets_v2";

export type ActivityCategory = {
  id: string;
  name: string;
  spent: number;
  budget: number;
  color: string;
};

export const CHART_PALETTE = [
  "#4CAF50",
  "#2196F3",
  "#FF9800",
  "#E91E63",
  "#9C27B0",
  "#00BCD4",
  "#795548",
  "#607D8B",
  "#8BC34A",
  "#3F51B5",
];

type StoredPrefs = Record<string, { budget?: number; color?: string }>;

async function loadPrefs(): Promise<StoredPrefs> {
  try {
    const raw = await AsyncStorage.getItem(BUDGETS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

async function savePrefs(prefs: StoredPrefs): Promise<void> {
  try {
    await AsyncStorage.setItem(BUDGETS_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
}

type ActivityCategoriesContextValue = {
  categories: ActivityCategory[];
  ready: boolean;
  /** Update the budget and/or color for a category (by slug id). */
  updateCategory: (
    id: string,
    patch: Partial<Pick<ActivityCategory, "budget" | "color">>
  ) => void;
  /** Re-read budgets and colors from storage (e.g. calendar pull-to-refresh). */
  refreshPrefs: () => Promise<void>;
};

const ActivityCategoriesContext =
  createContext<ActivityCategoriesContextValue | null>(null);

export function ActivityCategoriesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { transactions, loading: txLoading } = useTransactions();
  const [prefs, setPrefs] = useState<StoredPrefs>({});
  const [prefsLoaded, setPrefsLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const loaded = await loadPrefs();
      if (!cancelled) {
        setPrefs(loaded);
        setPrefsLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!prefsLoaded) return;
    void savePrefs(prefs);
  }, [prefs, prefsLoaded]);

  const categories = useMemo<ActivityCategory[]>(() => {
    const spendBySlug = new Map<string, number>();

    for (const t of transactions) {
      if (t.amount <= 0) continue; // only outflows (Plaid: positive = money out)
      const slug = getPrimarySlug(t);
      spendBySlug.set(slug, (spendBySlug.get(slug) ?? 0) + t.amount);
    }

    const slugs = Array.from(spendBySlug.keys()).sort(
      (a, b) => (spendBySlug.get(b) ?? 0) - (spendBySlug.get(a) ?? 0)
    );

    return slugs.map((slug, i) => {
      const pref = prefs[slug];
      return {
        id: slug,
        name: humanize(slug),
        spent: Math.round((spendBySlug.get(slug) ?? 0) * 100) / 100,
        budget: pref?.budget ?? 0,
        color: pref?.color ?? CHART_PALETTE[i % CHART_PALETTE.length],
      };
    });
  }, [transactions, prefs]);

  const ready = prefsLoaded && !txLoading;

  const updateCategory = useCallback(
    (
      id: string,
      patch: Partial<Pick<ActivityCategory, "budget" | "color">>
    ) => {
      setPrefs((prev) => {
        const existing = prev[id] ?? {};
        const next = { ...existing };
        if (patch.budget !== undefined) {
          next.budget = Math.max(0, Number.isFinite(patch.budget) ? patch.budget : 0);
        }
        if (patch.color !== undefined && patch.color) {
          next.color = patch.color;
        }
        return { ...prev, [id]: next };
      });
    },
    []
  );

  const refreshPrefs = useCallback(async () => {
    const loaded = await loadPrefs();
    setPrefs(loaded);
  }, []);

  const value = useMemo(
    () => ({ categories, ready, updateCategory, refreshPrefs }),
    [categories, ready, updateCategory, refreshPrefs]
  );

  return (
    <ActivityCategoriesContext.Provider value={value}>
      {children}
    </ActivityCategoriesContext.Provider>
  );
}

export function useActivityCategories(): ActivityCategoriesContextValue {
  const ctx = useContext(ActivityCategoriesContext);
  if (!ctx) {
    throw new Error(
      "useActivityCategories must be used within ActivityCategoriesProvider"
    );
  }
  return ctx;
}
