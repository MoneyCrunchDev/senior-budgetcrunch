import ModalBottomSheet from "@/components/ModalBottomSheet";
import {
  CHART_PALETTE,
  type ActivityCategory,
  useActivityCategories,
} from "@/context/ActivityCategoriesContext";
import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

const GRID = 8;

function formatMoney(value: number): string {
  return `$${value.toFixed(2)}`;
}

function clamp01(value: number): number {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function parseAmount(raw: string): number {
  const t = raw.replace(/[$,\s]/g, "").trim();
  if (t === "") return 0;
  const n = Number.parseFloat(t);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

function CategoryCard({
  category,
  onEdit,
}: {
  category: ActivityCategory;
  onEdit: () => void;
}) {
  const progress =
    category.budget > 0 ? clamp01(category.spent / category.budget) : 0;
  const percent = Math.round(progress * 100);
  const remaining = Math.max(category.budget - category.spent, 0);
  const hasBudget = category.budget > 0;

  return (
    <View style={styles.card}>
      <View style={styles.cardTopRow}>
        <View style={styles.cardTitleWrap}>
          <View style={styles.nameRow}>
            <View
              style={[styles.colorSwatchSmall, { backgroundColor: category.color }]}
            />
            <Text style={styles.cardTitle}>{category.name}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.editButton}
          activeOpacity={0.85}
          onPress={onEdit}
        >
          <Text style={styles.editButtonText}>
            {hasBudget ? "Edit" : "Set Budget"}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.amountRow}>
        <Text style={styles.spentText}>{formatMoney(category.spent)} spent</Text>
        {hasBudget ? (
          <Text style={styles.budgetText}>
            {formatMoney(category.budget)} budget
          </Text>
        ) : (
          <Text style={styles.noBudgetText}>No budget set</Text>
        )}
      </View>

      {hasBudget && (
        <>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${percent}%`,
                  backgroundColor: percent >= 100 ? "#E53935" : "#2ECC71",
                },
              ]}
            />
          </View>

          <View style={styles.footerRow}>
            <Text style={styles.remainingText}>
              {formatMoney(remaining)} remaining
            </Text>
            <Text style={styles.percentText}>{percent}%</Text>
          </View>
        </>
      )}
    </View>
  );
}

function BudgetFormSheetContent({
  formLaunchKey,
  category,
  onClose,
  onSave,
}: {
  formLaunchKey: number;
  category: ActivityCategory | null;
  onClose: () => void;
  onSave: (id: string, v: { budget: number; color: string }) => void;
}) {
  const [budgetStr, setBudgetStr] = useState("");
  const [color, setColor] = useState(CHART_PALETTE[0] ?? "#4CAF50");

  useEffect(() => {
    if (category) {
      setBudgetStr(category.budget > 0 ? String(category.budget) : "");
      setColor(category.color);
    }
  }, [formLaunchKey, category]);

  const submit = () => {
    if (!category) return;
    const budget = parseAmount(budgetStr);
    onSave(category.id, { budget, color });
    onClose();
  };

  if (!category) return null;

  return (
    <BottomSheetScrollView
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.sheetTitle}>Set Budget</Text>
      <Text style={styles.sheetCategoryName}>{category.name}</Text>
      <Text style={styles.sheetSpentLabel}>
        Current spending: {formatMoney(category.spent)}
      </Text>

      <Text style={styles.fieldLabel}>Monthly budget</Text>
      <BottomSheetTextInput
        style={styles.input}
        value={budgetStr}
        onChangeText={setBudgetStr}
        placeholder="0"
        placeholderTextColor="#9CA3AF"
        keyboardType="decimal-pad"
      />

      <Text style={styles.fieldLabel}>Chart color</Text>
      <View style={styles.colorRow}>
        {CHART_PALETTE.map((c) => (
          <TouchableOpacity
            key={c}
            style={[
              styles.colorChoice,
              { backgroundColor: c },
              color === c && styles.colorChoiceSelected,
            ]}
            onPress={() => setColor(c)}
          />
        ))}
      </View>

      <View style={styles.sheetActions}>
        <TouchableOpacity style={styles.sheetCancel} onPress={onClose}>
          <Text style={styles.sheetCancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.sheetSave} onPress={submit}>
          <Text style={styles.sheetSaveText}>Save</Text>
        </TouchableOpacity>
      </View>
    </BottomSheetScrollView>
  );
}

export default function Screen() {
  const { categories, ready, updateCategory } = useActivityCategories();

  const { height } = useWindowDimensions();
  const formSheetRef = useRef<BottomSheet>(null);

  const formSnapPoints = useMemo(
    () => [Math.round(height * 0.45)],
    [height]
  );

  const [formLaunchKey, setFormLaunchKey] = useState(0);
  const [editing, setEditing] = useState<ActivityCategory | null>(null);

  const openEdit = useCallback(
    (c: ActivityCategory) => {
      setEditing(c);
      setFormLaunchKey((k) => k + 1);
      requestAnimationFrame(() => {
        formSheetRef.current?.snapToIndex(0);
      });
    },
    []
  );

  const closeForm = useCallback(() => {
    formSheetRef.current?.close();
  }, []);

  const onSave = useCallback(
    (id: string, v: { budget: number; color: string }) => {
      updateCategory(id, { budget: v.budget, color: v.color });
    },
    [updateCategory]
  );

  if (!ready) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color="#111" />
      </View>
    );
  }

  return (
    <View style={styles.screenRoot}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Categories</Text>
        </View>

        {categories.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              No spending categories yet.
            </Text>
            <Text style={styles.emptyHint}>
              Link a bank account and sync your transactions to see categories
              here automatically.
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionLabel}>
              Spending by Category ({categories.length})
            </Text>

            <View style={styles.list}>
              {categories.map((category) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  onEdit={() => openEdit(category)}
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>

      <ModalBottomSheet ref={formSheetRef} snapPoints={formSnapPoints}>
        <BudgetFormSheetContent
          formLaunchKey={formLaunchKey}
          category={editing}
          onClose={closeForm}
          onSave={onSave}
        />
      </ModalBottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  screenRoot: {
    flex: 1,
  },

  loadingWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F6F7F9",
  },

  container: {
    paddingHorizontal: GRID * 2,
    paddingTop: GRID * 6,
    paddingBottom: GRID * 4,
    backgroundColor: "#F6F7F9",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: GRID * 3,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111",
  },

  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: GRID * 2,
  },

  list: {
    gap: GRID * 2,
  },

  emptyCard: {
    backgroundColor: "#FFF",
    padding: GRID * 3,
    borderRadius: GRID,
    borderWidth: 1,
    borderColor: "#E6E8EC",
  },

  emptyText: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    marginBottom: GRID,
  },

  emptyHint: {
    fontSize: 13,
    color: "#999",
    textAlign: "center",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: GRID * 1.5,
    padding: GRID * 2,
    borderWidth: 1,
    borderColor: "#E6E8EC",
  },

  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: GRID * 2,
  },

  cardTitleWrap: {
    flex: 1,
    marginRight: GRID * 2,
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: GRID,
  },

  colorSwatchSmall: {
    width: GRID * 1.5,
    height: GRID * 1.5,
    borderRadius: GRID,
    borderWidth: 1,
    borderColor: "#E6E8EC",
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
    flex: 1,
  },

  editButton: {
    height: GRID * 4,
    paddingHorizontal: GRID * 1.5,
    borderRadius: GRID,
    backgroundColor: "#F8F9FB",
    borderWidth: 1,
    borderColor: "#E6E8EC",
    alignItems: "center",
    justifyContent: "center",
  },

  editButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111",
  },

  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: GRID,
  },

  spentText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111",
  },

  budgetText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },

  noBudgetText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#9CA3AF",
    fontStyle: "italic",
  },

  progressTrack: {
    height: GRID * 1.5,
    borderRadius: GRID,
    backgroundColor: "#E9EDF2",
    overflow: "hidden",
    marginBottom: GRID,
  },

  progressFill: {
    height: "100%",
    borderRadius: GRID,
  },

  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  remainingText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
  },

  percentText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111",
  },

  sheetTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111",
    marginBottom: GRID,
  },

  sheetCategoryName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: GRID / 2,
  },

  sheetSpentLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: GRID * 2,
  },

  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6B7280",
    marginBottom: GRID / 2,
  },

  input: {
    borderWidth: 1,
    borderColor: "#E6E8EC",
    borderRadius: GRID,
    paddingHorizontal: GRID * 1.5,
    paddingVertical: GRID * 1.25,
    fontSize: 16,
    color: "#111",
    marginBottom: GRID * 1.5,
    backgroundColor: "#FAFBFC",
  },

  colorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GRID,
    marginBottom: GRID * 2,
  },

  colorChoice: {
    width: GRID * 4,
    height: GRID * 4,
    borderRadius: GRID * 2,
    borderWidth: 2,
    borderColor: "transparent",
  },

  colorChoiceSelected: {
    borderColor: "#111",
  },

  sheetActions: {
    flexDirection: "row",
    gap: GRID * 1.5,
    marginTop: GRID,
  },

  sheetCancel: {
    flex: 1,
    height: GRID * 6,
    borderRadius: GRID,
    borderWidth: 1,
    borderColor: "#D8DCE2",
    alignItems: "center",
    justifyContent: "center",
  },

  sheetCancelText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },

  sheetSave: {
    flex: 1,
    height: GRID * 6,
    borderRadius: GRID,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
  },

  sheetSaveText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
