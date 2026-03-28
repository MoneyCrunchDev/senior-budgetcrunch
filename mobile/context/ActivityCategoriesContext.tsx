import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "@moneycrunch/activity_categories_v1";

export type ActivityCategory = {
  id: string;
  name: string;
  spent: number;
  budget: number;
  color: string;
};

const CHART_PALETTE = [
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

export const DEFAULT_ACTIVITY_CATEGORIES: ActivityCategory[] = [
  { id: "1", name: "Groceries", spent: 72, budget: 120, color: "#4CAF50" },
  { id: "2", name: "Transportation", spent: 35, budget: 60, color: "#2196F3" },
  { id: "3", name: "Entertainment", spent: 48, budget: 80, color: "#FF9800" },
  { id: "4", name: "Dining Out", spent: 64, budget: 90, color: "#E91E63" },
  { id: "5", name: "Shopping", spent: 25, budget: 100, color: "#9C27B0" },
];

function newId(): string {
  return `ac-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function isActivityCategory(x: unknown): x is ActivityCategory {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.name === "string" &&
    typeof o.spent === "number" &&
    typeof o.budget === "number" &&
    typeof o.color === "string"
  );
}

async function loadFromStorage(): Promise<ActivityCategory[] | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    const list = parsed.filter(isActivityCategory);
    return list.length > 0 ? list : null;
  } catch {
    return null;
  }
}

async function saveToStorage(categories: ActivityCategory[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
  } catch {
    /* ignore */
  }
}

type ActivityCategoriesContextValue = {
  categories: ActivityCategory[];
  ready: boolean;
  addCategory: (input: {
    name: string;
    budget: number;
    spent?: number;
    color?: string;
  }) => void;
  updateCategory: (
    id: string,
    patch: Partial<
      Pick<ActivityCategory, "name" | "spent" | "budget" | "color">
    >,
  ) => void;
  removeCategory: (id: string) => void;
  moveCategory: (fromIndex: number, toIndex: number) => void;
  resetToSample: () => void;
};

const ActivityCategoriesContext =
  createContext<ActivityCategoriesContextValue | null>(null);

export function ActivityCategoriesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [categories, setCategories] = useState<ActivityCategory[]>(
    DEFAULT_ACTIVITY_CATEGORIES,
  );
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const loaded = await loadFromStorage();
      if (!cancelled && loaded) {
        setCategories(loaded);
      }
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    void saveToStorage(categories);
  }, [categories, ready]);

  const addCategory = useCallback(
    (input: {
      name: string;
      budget: number;
      spent?: number;
      color?: string;
    }) => {
      const name = input.name.trim();
      if (!name) return;
      const budget = Math.max(0, Number.isFinite(input.budget) ? input.budget : 0);
      const spent = Math.max(
        0,
        Number.isFinite(input.spent ?? 0) ? (input.spent ?? 0) : 0,
      );
      setCategories((prev) => {
        const color =
          input.color ??
          CHART_PALETTE[prev.length % CHART_PALETTE.length] ??
          "#4CAF50";
        return [
          ...prev,
          {
            id: newId(),
            name,
            budget,
            spent,
            color,
          },
        ];
      });
    },
    [],
  );

  const updateCategory = useCallback(
    (
      id: string,
      patch: Partial<
        Pick<ActivityCategory, "name" | "spent" | "budget" | "color">
      >,
    ) => {
      setCategories((prev) =>
        prev.map((c) => {
          if (c.id !== id) return c;
          const next = { ...c };
          if (patch.name !== undefined) {
            const n = patch.name.trim();
            if (n) next.name = n;
          }
          if (patch.spent !== undefined) {
            next.spent = Math.max(
              0,
              Number.isFinite(patch.spent) ? patch.spent : next.spent,
            );
          }
          if (patch.budget !== undefined) {
            next.budget = Math.max(
              0,
              Number.isFinite(patch.budget) ? patch.budget : next.budget,
            );
          }
          if (patch.color !== undefined && patch.color) {
            next.color = patch.color;
          }
          return next;
        }),
      );
    },
    [],
  );

  const removeCategory = useCallback((id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const moveCategory = useCallback((fromIndex: number, toIndex: number) => {
    setCategories((prev) => {
      if (
        fromIndex < 0 ||
        fromIndex >= prev.length ||
        toIndex < 0 ||
        toIndex >= prev.length ||
        fromIndex === toIndex
      ) {
        return prev;
      }
      const next = [...prev];
      const [item] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, item);
      return next;
    });
  }, []);

  const resetToSample = useCallback(() => {
    setCategories([...DEFAULT_ACTIVITY_CATEGORIES]);
  }, []);

  const value = useMemo(
    () => ({
      categories,
      ready,
      addCategory,
      updateCategory,
      removeCategory,
      moveCategory,
      resetToSample,
    }),
    [
      categories,
      ready,
      addCategory,
      updateCategory,
      removeCategory,
      moveCategory,
      resetToSample,
    ],
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
      "useActivityCategories must be used within ActivityCategoriesProvider",
    );
  }
  return ctx;
}

export { CHART_PALETTE };
